import { GoogleGenAI, Type } from "@google/genai";
import { createLogger } from '../utils/logger';
import { TopicEstimate } from './schedulingEngine';

/**
 * Retry configuration for AI API calls
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
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
  private readonly ai: GoogleGenAI;
  private readonly modelName: string = 'gemini-2.0-flash';

  /**
   * Creates an instance of AIAPIClient.
   *
   * @param {string} apiKey - The Google GenAI API key.
   * @throws {Error} If apiKey is missing.
   */
  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('AIAPIClient requires a valid API key.');
    }
    this.ai = new GoogleGenAI({ apiKey });
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

Be thorough but practical. Each topic should represent a single focused study session or a small number of sessions. Aim for topics that take 1-4 hours each on average.`;

    return retryWithBackoff(
      async () => {
        const result = await this.ai.models.generateContent({
          model: this.modelName,
          contents: [{ parts: [{ text: prompt }] }],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  subject: { type: Type.STRING },
                  estimatedHours: { type: Type.NUMBER },
                  difficulty: { type: Type.STRING },
                },
                required: ["name", "subject", "estimatedHours", "difficulty"],
              },
            },
          },
        });

        const text = result.text;
        if (!text) {
          throw new Error("AI returned empty response");
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
      },
      'AI topic estimation',
      this.logger
    );
  }

  /**
   * Simple content generation (kept for general-purpose use).
   *
   * @param {string} prompt - The prompt to send to the AI.
   * @returns {Promise<string>} The generated text content.
   */
  async generateContent(prompt: string): Promise<string> {
    this.logger.info('Requesting content from AI service...');

    return retryWithBackoff(
      async () => {
        const result = await this.ai.models.generateContent({
          model: this.modelName,
          contents: prompt
        });

        return result.text || '';
      },
      'AI content generation',
      this.logger
    );
  }
}
