import { GoogleGenAI, Type } from "@google/genai";
import { createLogger } from '../utils/logger';

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
 * A client class to encapsulate all interactions with the Google Generative AI API,
 * correctly using response schemas for structured output.
 */
export class AIAPIClient {
  private readonly logger = createLogger('ai-client');
  private readonly ai: GoogleGenAI;
  private readonly modelName: string = 'gemini-1.5-pro';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('AIAPIClient requires a valid API key.');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Simple content generation without structured schema
   * @param prompt The prompt to send to the model
   * @returns A promise that resolves to the text response
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

  /**
   * Generates a list of topics by providing a specific JSON schema to the model.
   * @param prompt The prompt to generate topics from.
   * @returns A promise that resolves to the structured JSON object.
   */
  async generateResult(prompt: string): Promise<any> {
    this.logger.info('Requesting structured topics from AI service...');
    
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
                  type: { type: Type.STRING },
                  difficulty: { type: Type.NUMBER },
                  duration: { type: Type.STRING },
                },
                required: ["name", "type", "difficulty", "duration"]
              },
            },
          },
        });
        
        return result.text;
      },
      'AI topics generation',
      this.logger
    );
  }

  /**
   * Generates a list of daily targets by providing a specific JSON schema to the model.
   * @param prompt The prompt to generate targets from.
   * @returns A promise that resolves to the structured JSON object.
   */
  async generateTargets(prompt: string): Promise<any> {
    this.logger.info('Requesting structured targets from AI service...');
    
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
                type: Type.STRING,
              },
            },
          },
        });

        return result.text;
      },
      'AI targets generation',
      this.logger
    );
  }

  /**
   * Generates a study plan by providing a specific JSON schema to the model.
   * @param prompt The prompt to generate the plan from.
   * @returns A promise that resolves to the structured JSON object (parsed).
   */
  async generateStudyPlan(prompt: string): Promise<any> {
    this.logger.info('Requesting structured study plan from AI service...');

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
                  date: { type: Type.STRING },
                  sessions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        topic: { type: Type.STRING },
                        startTime: { type: Type.STRING },
                        endTime: { type: Type.STRING },
                      },
                      required: ["topic", "startTime", "endTime"]
                    }
                  }
                },
                required: ["date", "sessions"]
              },
            },
          },
        });

        // The SDK returns a JSON string in result.text when using responseMimeType: "application/json"
        // We parse it here to return a real object.
        const text = result.text;
        if (!text) {
             throw new Error("AI returned empty response");
        }
        return JSON.parse(text);
      },
      'AI study plan generation',
      this.logger
    );
  }
}
