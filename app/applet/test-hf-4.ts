import fetch from 'node-fetch';

async function test() {
  const url = 'https://router.huggingface.co/hf-inference/models/HuggingFaceH4/zephyr-7b-beta';
  console.log(`Testing ${url}...`);
  try {
    const res = await fetch(url, {
      method: 'POST',
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
