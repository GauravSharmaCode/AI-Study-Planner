// Load environment variables from root .env file
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../../.env') });

const { Ollama } = require('ollama');

async function testOllama() {
  console.log('🧪 Testing Ollama Cloud API...\n');

  const apiKey = process.env.OLLAMA_API_KEY;
  const model = process.env.OLLAMA_MODEL || 'qwen3.5';

  console.log('📝 Configuration:');
  console.log(`   Model: ${model || 'no model'}`);
  console.log(`   API Key: ${apiKey ? apiKey.substring(0, 20) + '...' : 'no key'}`);
  console.log(`   Host: https://ollama.com\n`);

  if (!apiKey) {
    console.log('❌ ERROR: OLLAMA_API_KEY not found in .env file!\n');
    return;
  }

  const ollama = new Ollama({
    host: 'https://ollama.com',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const prompt = `You are an expert educational planner. Break down the following subjects into individual study topics for the exam "UPSC Civil Services Examination".

Subjects: Indian History, Indian Polity, Indian Economy

For each topic, provide:
- name: A specific, study-able topic name
- subject: The parent subject it belongs to
- estimatedHours: Realistic hours needed (0.5 to 8 hours)
- difficulty: One of "easy", "medium", or "hard"

Respond ONLY with a valid JSON array. Do not include any explanation or text outside the JSON array.`;

  console.log('📤 Sending request to Ollama Cloud API...\n');

  try {
    const start = Date.now();
    
    const response = await ollama.chat({
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      format: 'json',
      stream: false,
    });

    const duration = Date.now() - start;

    console.log('✅ Response received!\n');
    console.log(`⏱️  Duration: ${duration}ms\n`);
    console.log('📝 Raw response:');
    console.log('---');
    console.log(response.message?.content);
    console.log('---\n');

    // Try to parse JSON
    try {
      const parsed = JSON.parse(response.message?.content);
      console.log('✅ JSON parsed successfully!\n');
      console.log('📊 Parsed topics:');
      console.log(JSON.stringify(parsed, null, 2));
    } catch (parseError) {
      console.log('❌ JSON parsing failed:');
      console.log(parseError.message);
    }

  } catch (error) {
    console.log('❌ Error occurred:\n');
    console.log('   Message:', error.message);
    console.log('   Name:', error.name);
    if (error.response) {
      console.log('   Response status:', error.response.status);
      console.log('   Response data:', error.response.data);
    }
    if (error.cause) {
      console.log('   Cause:', error.cause);
    }
    console.log('\n   Full error:');
    console.log(error);
  }
}

testOllama();
