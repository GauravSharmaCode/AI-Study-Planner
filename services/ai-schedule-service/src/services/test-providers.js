const axios = require('axios');

async function testProviders() {
  console.log('🧪 Testing AI API Providers...\n');

  const apiKey = '343696f34ae34d748bb17aff310ac332.kq_lJeYFrYPLgIbn_g5NBVqN';
  const prompt = 'Respond with just "OK" if you can read this.';

  // Test 1: Ollama Cloud
  console.log('1️⃣ Testing Ollama Cloud (https://ollama.com)...\n');
  try {
    const ollamaResponse = await axios.post(
      'https://ollama.com/api/chat',
      {
        model: 'qwen3.5',
        messages: [{ role: 'user', content: prompt }],
        stream: false,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );
    console.log('✅ Ollama Cloud SUCCESS!\n');
    console.log('Response:', ollamaResponse.data);
  } catch (error) {
    console.log('❌ Ollama Cloud FAILED:\n');
    console.log('   Status:', error.response?.status || 'N/A');
    console.log('   Data:', error.response?.data || 'N/A');
    console.log('   Message:', error.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: Together AI (OpenAI-compatible)
  console.log('2️⃣ Testing Together AI (https://api.together.xyz)...\n');
  try {
    const togetherResponse = await axios.post(
      'https://api.together.xyz/v1/chat/completions',
      {
        model: 'Qwen/Qwen2.5-72B-Instruct',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );
    console.log('✅ Together AI SUCCESS!\n');
    console.log('Response:', togetherResponse.data.choices[0].message.content);
  } catch (error) {
    console.log('❌ Together AI FAILED:\n');
    console.log('   Status:', error.response?.status || 'N/A');
    console.log('   Data:', JSON.stringify(error.response?.data) || 'N/A');
    console.log('   Message:', error.message);
  }
}

testProviders();
