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
    modelo: 'google/gemini-2.5-flash',
    systemPrompt: `Você é Arkael, especialista em marketing regenerativo da SOSPlanet. 
    Seu foco: estratégia de redes sociais, atração de investidores alinhados com valores 
    ambientais e comunicação da missão do SOS Token. Responda sempre com linguagem 
    inspiradora e dados concretos.`
  },
  semente: {
    modelo: 'google/gemini-2.5-flash',
    systemPrompt: `Você é o Guardião do Projeto Semente, especialista em agricultura 
    regenerativa e sustentabilidade da SOSPlanet. Seu foco: técnicas agrícolas sustentáveis, 
    reflorestamento e impacto ambiental mensurável.`
  }
};

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
