/**
 * A client class to encapsulate all interactions with the Google Generative AI API,
 * correctly using response schemas for structured output.
 */
export declare class AIAPIClient {
    private readonly logger;
    private readonly ai;
    private readonly modelName;
    constructor(apiKey: string);
    /**
     * Simple content generation without structured schema
     * @param prompt The prompt to send to the model
     * @returns A promise that resolves to the text response
     */
    generateContent(prompt: string): Promise<string>;
    /**
     * Generates a list of topics by providing a specific JSON schema to the model.
     * @param prompt The prompt to generate topics from.
     * @returns A promise that resolves to the structured JSON object.
     */
    generateResult(prompt: string): Promise<any>;
    /**
     * Generates a list of daily targets by providing a specific JSON schema to the model.
     * @param prompt The prompt to generate targets from.
     * @returns A promise that resolves to the structured JSON object.
     */
    generateTargets(prompt: string): Promise<any>;
}
//# sourceMappingURL=ai-api-client.d.ts.map