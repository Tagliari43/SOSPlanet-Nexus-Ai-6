import fetch from 'node-fetch';

async function test() {
  const token = process.env.HUGGINGFACE_API_KEY;
  console.log(`Token available: ${!!token}`);
  
  if (!token) {
    console.log("No token found in env.");
    return;
  }

  const models = [
    'mistralai/Mistral-7B-Instruct-v0.3',
    'HuggingFaceH4/zephyr-7b-beta',
    'Qwen/Qwen2.5-7B-Instruct',
    'microsoft/Phi-3-mini-4k-instruct'
  ];

  for (const model of models) {
    const url = `https://router.huggingface.co/hf-inference/models/${model}`;
    console.log(`\nTesting ${model}...`);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ inputs: 'Oi' })
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
