import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

import { AIAPIClient } from './ai-api-client';

async function run() {
  try {
    const apiKey = process.env.OLLAMA_API_KEY || '';
    const model = process.env.OLLAMA_MODEL || 'qwen3.5';
    const client = new AIAPIClient(apiKey, model);
    console.log('Testing estimateTopics...');
    const result = await client.estimateTopics(['Indian History', 'Indian Polity', 'Indian Economy'], 'UPSC Civil Services Examination');
    console.log('Result:', result);
  } catch (e) {
    console.error('Error:', e);
  }
}

run();
