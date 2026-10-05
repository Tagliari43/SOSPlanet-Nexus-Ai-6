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
    modelo: 'google/gemini-2.0-flash-exp:free',
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
    modelo: 'google/gemini-2.0-flash-exp:free',
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

  // Adiciona o histórico (Limitando as últimas 8 mensagens)
  const maxHistoryLength = 8;
  const recentHistory = history.slice(-maxHistoryLength);

  for (const msg of recentHistory) {
    if (msg.role === 'user') {
      messages.push({ role: 'user', content: msg.parts.map((p: any) => p.text).join(' ') });
    } else if (msg.role === 'model') {
      messages.push({ role: 'assistant', content: msg.parts.map((p: any) => p.text).join(' ') });
    }
  }

  messages.push({ role: 'user', content: userMessage });

  // Utilitário para converter o schema
  const mapSchemaTypes = (schema: any): any => {
    if (!schema) return schema;
    if (typeof schema !== 'object') return schema;
    if (Array.isArray(schema)) return schema.map(mapSchemaTypes);

    const result: any = {};
    for (const key in schema) {
      if (key === 'type' && typeof schema[key] === 'string') {
        result[key] = schema[key].toLowerCase();
      } else if (key === 'required' && Array.isArray(schema[key])) {
        result[key] = schema[key]; // Preserve the required array
      } else {
        result[key] = mapSchemaTypes(schema[key]);
      }
    }
    return result;
  };

  // Converte ferramentas do formato Gemini para OpenAI
  const openAITools = tools
    .flatMap(t => t.functionDeclarations || [])
    .map(f => {
      let gParams = mapSchemaTypes(f.parameters);
      if (!gParams) {
        gParams = { type: "object", properties: {} };
      } else {
        if (!gParams.properties) gParams.properties = {};
      }
      return {
        type: 'function',
        function: {
          name: f.name,
          description: f.description || '',
          parameters: gParams
        }
      };
    });

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
            name: tc.function.name,
            content: JSON.stringify(result || 'OK')
          };
        })
      );
      messages.push(...toolResults);
      // continua o loop para o OpenRouter processar os resultados
    } else {
      let contentStr = choice.message.content || '';
      
      const toolMatch = contentStr.match(/\{\s*"type"\s*:\s*"function"\s*,\s*"name"\s*:\s*"([^"]+)"\s*,\s*(?:"arguments"|"parameters")\s*:\s*(\{.*?\})\s*\}/s) ||
                        contentStr.match(/\{\s*"name"\s*:\s*"([^"]+)"\s*,\s*(?:"arguments"|"parameters")\s*:\s*(\{.*?\})\s*\}/s);

      if (toolMatch) {
        const funcName = toolMatch[1];
        let funcArgs = {};
        try {
          funcArgs = JSON.parse(toolMatch[2]);
        } catch (e) {
          console.error("Erro no parse do fallback (OpenRouter):", e);
        }
        
        console.log("OpenRouter Fallback Tool Acionado:", funcName, funcArgs);
        
        contentStr = contentStr.replace(toolMatch[0], '').trim();
        
        const result = await onToolRequest(funcName, funcArgs);
        
        const callId = `call_${Date.now()}`;
        messages.push({
          role: 'assistant',
          content: null,
          tool_calls: [{
            id: callId,
            type: 'function',
            function: { name: funcName, arguments: JSON.stringify(funcArgs) }
          }]
        });
        
        messages.push({
          role: 'tool',
          tool_call_id: callId,
          name: funcName,
          content: JSON.stringify(result || 'OK')
        });

        if (contentStr) {
            responseText += contentStr + "\n";
        }
        
        continueLoop = true;
        continue;
      }

      responseText += contentStr;
      continueLoop = false;
    }
  }

  return responseText;
}

export async function invocarSubAgente(
  agente: string,
  tarefa: string,
  apiKey: string,
  modeloOverride?: string,
  contextoExtra?: string
):Promise<string> {
  const perfil = SUB_AGENT_PROFILES[agente];
  if (!perfil) return `Sub-agente '${agente}' não encontrado.`;
  const modelo = modeloOverride || perfil.modelo;
  
  let finalSystemPrompt = perfil.systemPrompt;
  if (contextoExtra) {
    finalSystemPrompt += `\n\n[CONTEXTO EXTRA / MEMÓRIAS]\n${contextoExtra}`;
  }
  
  return await callOpenRouter(tarefa, finalSystemPrompt, modelo, apiKey);
}
