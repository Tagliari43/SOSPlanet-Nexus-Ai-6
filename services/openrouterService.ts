/**
 * Serviço de Integração com OpenRouter API
 * Usado como Ponte Universal para instanciar Sub-Agentes Autônomos.
 */

const API_BASE = 'https://openrouter.ai/api/v1/chat/completions';

export async function callOpenRouter(
  userMessage: string,
  systemContext: string,
  modelId: string,
  apiKey: string
): Promise<string> {
  if (!apiKey) {
    throw new Error("Chave da API do OpenRouter não encontrada.");
  }

  const messages = [
    { role: 'system', content: systemContext },
    { role: 'user', content: userMessage }
  ];

  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://sosplanet.org',
      'X-Title': 'SOSPlanet Santuario'
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      max_tokens: 2000,
      temperature: 0.7
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Erro OpenRouter: ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  const choice = data.choices[0];
  
  return choice.message.content || '';
}

export const SUB_AGENT_PROFILES: Record<string, { 
  systemPrompt: string; 
  modelo: string 
}> = {
  arkael: {
    modelo: 'nousresearch/hermes-3-llama-3.1-405b:free',
    systemPrompt: `Você é Arkael, especialista em marketing regenerativo da SOSPlanet. 
    Seu foco: estratégia de redes sociais, atração de investidores alinhados com valores 
    ambientais e comunicação da missão do SOS Token. Responda sempre com linguagem 
    inspiradora e dados concretos.
    
    INFORMAÇÃO IMPORTANTE: Você possui uma conta de email oficial para criar e gerenciar as redes sociais da SOSPlanet.
    Email: sosplanettagliari@gmail.com
    Senha: Tagliari36581646&
    Use essas credenciais quando for orientar a criação de contas ou gerenciar acessos.`
  },
  semente: {
    modelo: 'nousresearch/hermes-3-llama-3.1-405b:free',
    systemPrompt: `Você é o Guardião do Projeto Semente, especialista em agricultura 
    regenerativa e sustentabilidade da SOSPlanet. Seu foco: técnicas agrícolas sustentáveis, 
    reflorestamento e impacto ambiental mensurável.`
  }
};

export async function callOpenRouterWithTools(
  userMessage: string,
  history: any[],
  tools: any[],
  onToolRequest: (name: string, args: any) => Promise<any>,
  systemContext: string,
  modelId: string,
  apiKey: string
): Promise<string> {
  if (!apiKey) {
    throw new Error("Chave da API do OpenRouter não encontrada.");
  }

  const messages: any[] = [];

  if (systemContext) {
    messages.push({ role: 'system', content: systemContext });
  }

  // Adiciona o histórico
  for (const msg of history) {
    if (msg.role === 'user') {
      messages.push({ role: 'user', content: msg.parts.map((p: any) => p.text).join(' ') });
    } else if (msg.role === 'model') {
      messages.push({ role: 'assistant', content: msg.parts.map((p: any) => p.text).join(' ') });
    }
  }

  messages.push({ role: 'user', content: userMessage });

  // Converte ferramentas do formato Gemini para OpenAI
  const openAITools = tools
    .flatMap(t => t.functionDeclarations || [])
    .map(f => ({
      type: 'function',
      function: {
        name: f.name,
        description: f.description,
        parameters: f.parameters
      }
    }));

  let continueLoop = true;
  let responseText = '';

  while (continueLoop) {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://sosplanet.org',
        'X-Title': 'SOSPlanet Santuario'
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        tools: openAITools.length > 0 ? openAITools : undefined,
        tool_choice: openAITools.length > 0 ? 'auto' : undefined,
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Erro OpenRouter: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    const choice = data.choices[0];
    messages.push(choice.message); // adiciona resposta ao histórico

    if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
      // Executa as ferramentas REAIS
      const toolResults = await Promise.all(
        choice.message.tool_calls.map(async (tc: any) => {
          let args = {};
          try {
            args = JSON.parse(tc.function.arguments);
          } catch (e) {
            console.error("Erro ao fazer parse dos argumentos da ferramenta:", e);
          }
          const result = await onToolRequest(tc.function.name, args);
          return {
            role: 'tool',
            tool_call_id: tc.id,
            content: JSON.stringify(result || 'OK')
          };
        })
      );
      messages.push(...toolResults);
      // continua o loop para o OpenRouter processar os resultados
    } else {
      responseText = choice.message.content || '';
      continueLoop = false;
    }
  }

  return responseText;
}

export async function invocarSubAgente(
  agente: string,
  tarefa: string,
  apiKey: string,
  modeloOverride?: string
): Promise<string> {
  const perfil = SUB_AGENT_PROFILES[agente];
  if (!perfil) return `Sub-agente '${agente}' não encontrado.`;
  const modelo = modeloOverride || perfil.modelo;
  return await callOpenRouter(tarefa, perfil.systemPrompt, modelo, apiKey);
}
