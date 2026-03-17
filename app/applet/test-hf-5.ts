import fetch from 'node-fetch';

async function test() {
  const url = 'https://router.huggingface.co/hf-inference/models/HuggingFaceH4/zephyr-7b-beta';
  console.log(`Testing GET ${url}...`);
  try {
    const res = await fetch(url, {
      method: 'GET'
    });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response: ${text.substring(0, 100)}`);
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}

test();
