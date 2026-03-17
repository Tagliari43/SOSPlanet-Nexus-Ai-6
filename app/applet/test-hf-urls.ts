import fetch from 'node-fetch';

async function test() {
  const models = [
    'HuggingFaceH4/zephyr-7b-beta',
    'google/gemma-1.1-7b-it',
    'microsoft/Phi-3-mini-4k-instruct',
    'Qwen/Qwen2.5-7B-Instruct'
  ];

  const bases = [
    'https://api-inference.huggingface.co/models/',
    'https://router.huggingface.co/hf-inference/models/'
  ];

  for (const base of bases) {
    for (const model of models) {
      const url = `${base}${model}`;
      console.log(`\nTesting ${url}...`);
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer hf_dummy_token'
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
}

test();
