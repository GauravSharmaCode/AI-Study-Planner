import { Ollama } from 'ollama';
import CircuitBreaker from 'opossum';
import { createLogger } from '../utils/logger';
import { TopicEstimate } from './schedulingEngine';
import { aiApiLatencySeconds } from '../utils/metrics';

/**
 * Retry configuration for AI API calls
 * Reduced for circuit breaker compatibility (60s hard timeout)
 */
const RETRY_CONFIG = {
  maxRetries: 2,
  initialDelayMs: 500,
  maxDelayMs: 2000,
  backoffMultiplier: 2,
};

/**
 * Helper function to implement retry logic with exponential backoff
 *
 * @template T
 * @param {() => Promise<T>} fn - The async function to retry
 * @param {string} operation - Name of the operation for logging
 * @param {any} logger - Logger instance
 * @param {number} [retries=RETRY_CONFIG.maxRetries] - Maximum number of retries
 * @returns {Promise<T>} The result of the function call
 * @throws {Error} If all retries fail
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  operation: string,
  logger: any,
  retries = RETRY_CONFIG.maxRetries
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === retries) {
        logger.error(`${operation} failed after ${retries + 1} attempts`, {
          error: lastError.message,
        });
        throw new Error(`${operation} failed after ${retries + 1} attempts: ${lastError.message}`);
      }

      const delayMs = Math.min(
        RETRY_CONFIG.initialDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
        RETRY_CONFIG.maxDelayMs
      );

      logger.warn(`${operation} failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delayMs}ms`, {
        error: lastError.message,
      });

      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw lastError!;
}

/**
 * AI API Client — scoped for deterministic engine MVP.
 *
 * The AI is responsible ONLY for:
 * 1. Topic breakdown per subject
 * 2. Effort estimation (hours per topic)
 * 3. Difficulty tagging (easy / medium / hard)
 *
 * The deterministic scheduling engine handles all schedule generation.
 */
export class AIAPIClient {
  private readonly logger = createLogger('ai-client');
  private readonly ollama: Ollama;
  private readonly modelName: string;
  private readonly breaker: CircuitBreaker;

  /**
   * Creates an instance of AIAPIClient.
   *
   * @param {string} apiKey - The Ollama API key.
   * @param {string} [model] - Optional model name override.
   * @throws {Error} If apiKey is missing.
   */
  constructor(apiKey: string, model?: string) {
    if (!apiKey) {
      throw new Error('AIAPIClient requires a valid API key.');
    }

    this.modelName = model || 'llama3.1:8b-cloud';

    // Initialize Ollama client with cloud configuration
    this.ollama = new Ollama({
      host: 'https://ollama.com',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    // Initialize Circuit Breaker
    const breakerOptions = {
      timeout: 60000, // 60s cap for cloud LLMs
      errorThresholdPercentage: 50,
      resetTimeout: 10000, // 10s
    };

    this.breaker = new CircuitBreaker(this.executeAIRequest.bind(this), breakerOptions);

    this.breaker.fallback((params: any, err: any) => {
       // Check if we are calling estimateTopics
       if (params && params.type === 'estimateTopics') {
           return this.deterministicFallback(params.subjects);
       }
       // Re-throw for other types or if no fallback possible
       throw err;
    });

    this.breaker.on('open', () => this.logger.warn('Circuit Breaker OPEN'));
    this.breaker.on('halfOpen', () => this.logger.info('Circuit Breaker HALF-OPEN'));
    this.breaker.on('close', () => this.logger.info('Circuit Breaker CLOSED'));
  }

  /**
   * Internal method to execute AI request with retry.
   * Used by CircuitBreaker.
   */
  private async executeAIRequest(params: any): Promise<any> {
    const start = Date.now();
    try {
      const result = await retryWithBackoff(
        params.fn,
        params.operation,
        this.logger
      );

      const duration = (Date.now() - start) / 1000;
      aiApiLatencySeconds.observe({ operation: params.operation, status: 'success' }, duration);

      return result;
    } catch (error) {
      const duration = (Date.now() - start) / 1000;
      aiApiLatencySeconds.observe({ operation: params.operation, status: 'failure' }, duration);
      throw error;
    }
  }

  /**
   * Fallback method for topic estimation.
   */
  private deterministicFallback(subjects: string[]): TopicEstimate[] {
    this.logger.warn('Using deterministic fallback for topic estimation');
    const estimates: TopicEstimate[] = [];

    for (const subject of subjects) {
      // Create generic topics for the subject
      estimates.push({
        name: `${subject} - Core Concepts`,
        subject: subject,
        estimatedHours: 2,
        difficulty: 'medium'
      });
      estimates.push({
        name: `${subject} - Advanced Topics`,
        subject: subject,
        estimatedHours: 2,
        difficulty: 'hard'
      });
    }
    return estimates;
  }

  /**
   * Estimate topics for the given subjects.
   *
   * Uses structured output schema to get topic breakdown with:
   * - Topic name
   * - Parent subject
   * - Estimated hours to study
   * - Difficulty level (easy / medium / hard)
   *
   * This is the PRIMARY method for the deterministic engine MVP.
   *
   * @param {string[]} subjects - List of subjects to break down.
   * @param {string} [examName] - Optional name of the exam for context.
   * @returns {Promise<TopicEstimate[]>} A list of estimated topics.
   */
  async estimateTopics(
    subjects: string[],
    examName?: string
  ): Promise<TopicEstimate[]> {
    this.logger.info('Requesting topic estimates from AI', {
      subjects,
      examName,
    });

    const contextLine = examName
      ? `for the exam "${examName}"`
      : 'for study preparation';

    const prompt = `You are an expert educational planner. Break down the following subjects into individual study topics ${contextLine}.

Subjects: ${subjects.join(', ')}

For each topic, provide:
- name: A specific, study-able topic name (e.g., "Quadratic Equations", not just "Algebra")
- subject: The parent subject it belongs to
- estimatedHours: Realistic hours needed to learn/review this topic (0.5 to 8 hours)
- difficulty: One of "easy", "medium", or "hard"

Be thorough but practical. Each topic should represent a single focused study session or a small number of sessions. Aim for topics that take 1-4 hours each on average.

Respond ONLY with a valid JSON array. Do not include any explanation or text outside the JSON array.`;

    const apiCallFn = async () => {
      const result = await this.ollama.chat({
        model: this.modelName,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        format: 'json',
        stream: false,
      });

      const text = result.message?.content;
      if (!text) {
        throw new Error('AI returned empty response');
      }

      const parsed = JSON.parse(text) as TopicEstimate[];

      // Validate and sanitize difficulty values
      return parsed.map(topic => ({
        ...topic,
        difficulty: (['easy', 'medium', 'hard'].includes(topic.difficulty)
          ? topic.difficulty
          : 'medium') as 'easy' | 'medium' | 'hard',
        estimatedHours: Math.max(0.5, Math.min(8, topic.estimatedHours)),
      }));
    };

    // Execute via Circuit Breaker
    return this.breaker.fire({
      fn: apiCallFn,
      operation: 'AI topic estimation',
      type: 'estimateTopics',
      subjects: subjects
    }) as Promise<TopicEstimate[]>;
  }

  /**
   * Simple content generation (kept for general-purpose use).
   *
   * @param {string} prompt - The prompt to send to the AI.
   * @returns {Promise<string>} The generated text content.
   */
  async generateContent(prompt: string): Promise<string> {
    this.logger.info('Requesting content from AI service...');

    const apiCallFn = async () => {
      const result = await this.ollama.chat({
        model: this.modelName,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: false,
      });

      return result.message?.content || '';
    };

    return this.breaker.fire({
      fn: apiCallFn,
      operation: 'AI content generation',
      type: 'contentGeneration'
    }) as Promise<string>;
  }
}
