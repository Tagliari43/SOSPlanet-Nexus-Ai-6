import fetch from 'node-fetch';

async function test() {
  const urls = [
    'https://router.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta',
    'https://router.huggingface.co/hf-inference/models/HuggingFaceH4/zephyr-7b-beta',
    'https://router.huggingface.co/hf-inference/v1/chat/completions'
  ];

  for (const url of urls) {
    console.log(`Testing ${url}...`);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer hf_dummy_token_for_testing_purposes_only'
        },
        body: JSON.stringify({ inputs: 'test', model: 'HuggingFaceH4/zephyr-7b-beta', messages: [{role: 'user', content: 'test'}] })
      });
      console.log(`Status: ${res.status}`);
      const text = await res.text();
      console.log(`Response: ${text.substring(0, 100)}`);
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }
}

test();
