async function testEndpoint(name, url, model) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer NO_KEY_TEST'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'Oi' }]
      })
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 404 || data.error?.code === 'model_not_found' || data.error?.type === 'not_found_error') {
      console.log(`❌ ${name} (${model}) NÃO EXISTE (404)`);
    } else if (response.status === 401 || response.status === 403) {
      console.log(`✅ ${name} (${model}) EXISTE (Deu 401, então o modelo foi aceito antes da auth)`);
    } else {
      console.log(`⚠️ ${name} (${model}) OUTRO STATUS: ${response.status}`, JSON.stringify(data).substring(0, 100));
    }
  } catch (error) {
    console.log(`❌ ERRO DE REDE [${name}]:`, error.message);
  }
}

async function runTests() {
  const c_models = ['llama-3.1-8b', 'llama3.1-8b', 'llama-3.1-70b', 'llama3.1-70b', 'llama-3.3-70b', 'llama3.3-70b'];
  for (const m of c_models) await testEndpoint('Cerebras', 'https://api.cerebras.ai/v1/chat/completions', m);
  
  const g_models = ['llama-3.1-8b-instant', 'llama3-8b-8192', 'llama-3.3-70b-versatile', 'gemma2-9b-it', 'mixtral-8x7b-32768'];
  for (const m of g_models) await testEndpoint('Groq', 'https://api.groq.com/openai/v1/chat/completions', m);
}

runTests();
