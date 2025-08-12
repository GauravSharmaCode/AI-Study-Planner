"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIAPIClient = void 0;
const genai_1 = require("@google/genai");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * A client class to encapsulate all interactions with the Google Generative AI API,
 * correctly using response schemas for structured output.
 */
class AIAPIClient {
    constructor(apiKey) {
        this.logger = logger_1.default;
        this.modelName = 'gemini-1.5-pro';
        if (!apiKey) {
            throw new Error('AIAPIClient requires a valid API key.');
        }
        this.ai = new genai_1.GoogleGenAI({ apiKey });
    }
    /**
     * Simple content generation without structured schema
     * @param prompt The prompt to send to the model
     * @returns A promise that resolves to the text response
     */
    async generateContent(prompt) {
        this.logger.info('Requesting content from AI service...');
        try {
            const result = await this.ai.models.generateContent({
                model: this.modelName,
                contents: prompt
            });
            return result.text || '';
        }
        catch (error) {
            this.logger.error('AI API call failed:', { error: error.message });
            throw new Error(`AI content generation failed: ${error.message}`);
        }
    }
    /**
     * Generates a list of topics by providing a specific JSON schema to the model.
     * @param prompt The prompt to generate topics from.
     * @returns A promise that resolves to the structured JSON object.
     */
    async generateResult(prompt) {
        this.logger.info('Requesting structured topics from AI service...');
        try {
            // CORRECTION: Using the correct 'ai.models.generateContent' syntax.
            const result = await this.ai.models.generateContent({
                model: this.modelName,
                contents: [{ parts: [{ text: prompt }] }],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: genai_1.Type.ARRAY,
                        items: {
                            type: genai_1.Type.OBJECT,
                            properties: {
                                name: { type: genai_1.Type.STRING },
                                type: { type: genai_1.Type.STRING },
                                difficulty: { type: genai_1.Type.NUMBER },
                                duration: { type: genai_1.Type.STRING },
                            },
                            required: ["name", "type", "difficulty", "duration"]
                        },
                    },
                },
            });
            const response = result.text;
            return response;
        }
        catch (error) {
            this.logger.error('AI API call for topics failed:', { error: error.message });
            throw new Error('Failed to generate topics from AI service.');
        }
    }
    /**
     * Generates a list of daily targets by providing a specific JSON schema to the model.
     * @param prompt The prompt to generate targets from.
     * @returns A promise that resolves to the structured JSON object.
     */
    async generateTargets(prompt) {
        this.logger.info('Requesting structured targets from AI service...');
        try {
            // CORRECTION: Using the correct 'ai.models.generateContent' syntax.
            const result = await this.ai.models.generateContent({
                model: this.modelName,
                contents: [{ parts: [{ text: prompt }] }],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: genai_1.Type.ARRAY,
                        items: {
                            type: genai_1.Type.STRING,
                        },
                    },
                },
            });
            const response = result.text;
            return response;
        }
        catch (error) {
            this.logger.error('AI API call for targets failed:', { error: error.message });
            throw new Error('Failed to generate targets from AI service.');
        }
    }
}
exports.AIAPIClient = AIAPIClient;
//# sourceMappingURL=ai-api-client.js.map