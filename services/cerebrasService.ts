/**
 * Serviço de Integração com Cerebras API (Llama 3 70B)
 * Extremamente rápido, usado como Sub-Agente Alquimista.
 */

const TEXT_MODEL = 'llama3.1-8b';
const API_BASE = 'https://api.cerebras.ai/v1/chat/completions';

export async function callCerebrasWithTools(
  userMessage: string,
  history: any[],
  tools: any[],
  onToolRequest: (name: string, args: any) => Promise<any>,
  systemContext?: string,
  apiKey?: string
): Promise<string> {
  const token = apiKey;
  
  if (!token) {
    throw new Error("Chave da API da Cerebras não encontrada.");
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

  // Utilitário para converter o schema do formato Gemini (uppercase Types) para o formato JSON Schema padrão (lowercase Types) esperado pela API OpenAI/Cerebras
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
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: TEXT_MODEL,
        messages,
        tools: openAITools.length > 0 ? openAITools : undefined,
        tool_choice: openAITools.length > 0 ? 'auto' : undefined,
        max_completion_tokens: 1024,
        temperature: 0.7
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Erro Cerebras: ${res.status} - ${errorText}`);
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
      // continua o loop para o Cerebras processar os resultados
    } else {
      responseText = choice.message.content || '';
      continueLoop = false;
    }
  }

  return responseText;
}
