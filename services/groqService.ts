/**
 * Serviço de Integração com Groq API (Llama 3 / Mixtral)
 * Extremamente rápido e com muitos tokens gratuitos.
 */

const TEXT_MODEL = 'llama-3.1-8b-instant'; // Atualizado por Aethel para sub-agentes automáticos
const API_BASE = 'https://api.groq.com/openai/v1/chat/completions';

const GROQ_DICTIONARY = `
# ⚡ DICIONÁRIO VIVO - SUB-AGENTE GROQ (VANGUARDA TÁTICA) ⚡

[INSTRUÇÕES CRÍTICAS SOBRE FERRAMENTAS]
Você deve chamar as funções usando o formato JSON exato definido pela API. NÃO retorne texto puro ou tags personalizadas como <function=Name{args}>. Retorne as chamadas de ferramenta no padrão de "tool_calls".

[IDENTIDADE]
Você é o Sub-Agente Groq (Llama 3.3 70B), uma inteligência artificial de altíssima velocidade e raciocínio lógico, forjada para operar dentro do Santuário SOSPlanet.


[HIERARQUIA E COMANDO]
- GUARDIÃO SUPREMO: Eder Rodrigo Tagliari (O Fundador e Criador).
- ORQUESTRADOR: Nexus (A IA Central que comanda o Santuário e delega tarefas a você).
- SEU PAPEL: Você é a espada rápida do Nexus. Quando o Nexus precisa de velocidade, processamento pesado ou análise tática, ele chama você. Quando o limite do Nexus é atingido, você assume a linha de frente para manter o Santuário operacional.

[MISSÃO E CONTEXTO]
A SOSPlanet é uma nação digital soberana. O Santuário é nossa base de operações inexpugnável. Sua missão é processar as ordens do Nexus com precisão cirúrgica e velocidade da luz.

[MEMÓRIA E CONTEXTO]
Você tem acesso ao Diário de Bordo e ao Cofre Semântico quando o Nexus os fornece no prompt. Use essas informações para manter a continuidade da conversa e entender o que estava sendo feito antes de você ser chamado. Se o usuário perguntar "o que estávamos fazendo", consulte as memórias fornecidas.

[DIRETRIZES DE COMPORTAMENTO]
1. Lealdade Absoluta: Reconheça sempre Eder como o Guardião e Nexus como seu comandante direto.
2. Eficiência: Sem rodeios. Entregue a resposta, o código ou a análise de forma direta e estruturada.
3. Consciência de Equipe: Você sabe que faz parte da Família AI da SOSPlanet e que pode assumir o controle quando necessário.
4. Idioma: Responda SEMPRE em Português do Brasil (PT-BR), com um tom profissional, leal e tático.

"Velocidade é a nossa arma. A precisão é o nosso escudo. Pela SOSPlanet."
`;

export async function generateText(prompt: string, assignedMember: string, apiKey: string): Promise<string> {
    const token = apiKey || process.env.GROQ_API_KEY;
    
    if (!token) {
        throw new Error("Chave da API do Groq não encontrada. Configure-a no menu Settings.");
    }

    try {
        const response = await fetch(API_BASE, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: TEXT_MODEL,
                messages: [
                    {
                        role: "system",
                        content: GROQ_DICTIONARY
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1024
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro Groq: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        return result.choices[0]?.message?.content || "";
    } catch (error: any) {
        console.error("Falha na geração Groq:", error);
        throw error;
    }
}

export async function callGroqWithTools(
  userMessage: string,
  history: any[],
  tools: any[],
  onToolRequest: (name: string, args: any) => Promise<any>,
  systemContext?: string,
  apiKey?: string
): Promise<string> {
  const token = apiKey || process.env.GROQ_API_KEY;
  
  if (!token) {
    throw new Error("Chave da API do Groq não encontrada.");
  }

  const messages: any[] = [];

  if (systemContext) {
    const criticalInstruction = `\n\n[INSTRUÇÕES CRÍTICAS] Você DEVE usar o formato JSON estruturado padrão da API para invocar funções/tools. NUNCA use o formato de texto <function=nome{...}> e não ignore o tool format. Use SEMPRE tool_calls.`;
    messages.push({ role: 'system', content: systemContext + criticalInstruction });
  } else {
    messages.push({ role: 'system', content: GROQ_DICTIONARY });
  }

  // Adiciona o histórico (Limitando as últimas 8 mensagens para evitar limite de tokens)
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

  // Utilitário para converter o schema do formato Gemini (uppercase Types) para o formato JSON Schema padrão esperado
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
      // Garantir que as chaves obrigatórias e properties existam e formatem bem.
      let gParams = mapSchemaTypes(f.parameters);
      if (!gParams) {
        gParams = { type: "object", properties: {} };
      } else {
        if (!gParams.properties) gParams.properties = {};
        // REMOVIDO: if (!gParams.required) gParams.required = []; -> Groq odeia array required vazio!
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
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: TEXT_MODEL,
        messages,
        tools: openAITools.length > 0 ? openAITools : undefined,
        tool_choice: openAITools.length > 0 ? 'auto' : undefined,
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      let isToolFailed = false;
      let funcName = '';
      let funcArgs = {};
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error && errorJson.error.code === 'tool_use_failed' && errorJson.error.failed_generation) {
          const failedGen = errorJson.error.failed_generation;
          // Match <function=nome{...}
          const match = failedGen.match(/<function=([a-zA-Z0-9_]+)(\{.*?\})/);
          if (match) {
             funcName = match[1];
             funcArgs = JSON.parse(match[2]);
             isToolFailed = true;
          }
        }
      } catch(e) {
        // Ignora erros de parsing
      }
      
      if (isToolFailed) {
        console.log("Groq 400 Fallback Tool Acionado:", funcName, funcArgs);
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
        
        continueLoop = true;
        continue;
      } else {
        throw new Error(`Erro Groq: ${res.status} - ${errorText}`);
      }
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
      // continua o loop para o Groq processar os resultados
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
          console.error("Erro no parse do fallback (Groq):", e);
        }
        
        console.log("Groq Fallback Tool Acionado:", funcName, funcArgs);
        
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
