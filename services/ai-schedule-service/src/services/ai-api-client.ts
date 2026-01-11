import { GoogleGenAI, Type } from "@google/genai";
import { createLogger } from '../utils/logger';

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
    try {
      const result = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt
      });
      
      return result.text || '';

    } catch (error) {
      this.logger.error('AI API call failed:', { error: (error as Error).message });
      throw new Error(`AI content generation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Generates a list of topics by providing a specific JSON schema to the model.
   * @param prompt The prompt to generate topics from.
   * @returns A promise that resolves to the structured JSON object.
   */
  async generateResult(prompt: string): Promise<any> {
    this.logger.info('Requesting structured topics from AI service...');
    try {
      // CORRECTION: Using the correct 'ai.models.generateContent' syntax.
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
      
      const response = result.text;
      return response;

    } catch (error) {
      this.logger.error('AI API call for topics failed:', { error: (error as Error).message });
      throw new Error('Failed to generate topics from AI service.');
    }
  }

  /**
   * Generates a list of daily targets by providing a specific JSON schema to the model.
   * @param prompt The prompt to generate targets from.
   * @returns A promise that resolves to the structured JSON object.
   */
  async generateTargets(prompt: string): Promise<any> {
    this.logger.info('Requesting structured targets from AI service...');
    try {
      // CORRECTION: Using the correct 'ai.models.generateContent' syntax.
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

      const response = result.text;
      return response;

    } catch (error) {
      this.logger.error('AI API call for targets failed:', { error: (error as Error).message });
      throw new Error('Failed to generate targets from AI service.');
    }
  }
}
