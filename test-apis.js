async function testEndpoint(name, url, payload) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer NO_KEY_TEST'
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    console.log(`[TESTE ${name}] Status: ${response.status}`);
    if (response.status === 404) {
      console.log(`❌ ALERTA: Endpoint ou Modelo não encontrado (Erro 404). Data:`, data);
    } else if (response.status === 401 || response.status === 403) {
      console.log(`✅ SUCESSO: Endpoint respondeu corretamente (Erro ${response.status} de Autenticação esperado pois não usamos chaves reais no teste).`);
    } else {
      console.log(`⚠️ OUTRO STATUS: ${response.status}`, data);
    }
  } catch (error) {
    console.log(`❌ ERRO DE REDE [${name}]:`, error.message);
  }
}

async function runTests() {
  console.log("Iniciando testes de sanidade dos provedores...\n");
  
  await testEndpoint('CEREBRAS (Alquimista)', 'https://api.cerebras.ai/v1/chat/completions', {
    model: 'llama-3.3-70b',
    messages: [{ role: 'user', content: 'Oi' }]
  });

  await testEndpoint('GROQ (Groq Sub-agente)', 'https://api.groq.com/openai/v1/chat/completions', {
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: 'Oi' }]
  });

  await testEndpoint('OPENROUTER (Arkael / Fallback)', 'https://openrouter.ai/api/v1/chat/completions', {
    model: 'google/gemini-flash-1.5-exp:free',
    messages: [{ role: 'user', content: 'Oi' }]
  });
}

runTests();
