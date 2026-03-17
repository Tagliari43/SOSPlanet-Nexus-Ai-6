import fetch from 'node-fetch';

async function test() {
  const url = 'https://router.huggingface.co/hf-inference/models/meta-llama/Llama-3.2-1B-Instruct';
  console.log(`Testing ${url}...`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer hf_dummy_token_for_testing_purposes_only'
      },
      body: JSON.stringify({ inputs: 'test' })
    });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response: ${text.substring(0, 100)}`);
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}

test();
