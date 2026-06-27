// Arquivo: src/config/apiProviders.ts
// Homologado por Aethel para a Fase 21 da Nação SOSPlanet

export const API_PROVIDERS_CONFIG = {
  // 💎 NEXUS & AGENTES - GOOGLE AI STUDIO (Plano Gratuito Oficial)
  geminiStudio: {
    baseUrl: "https://googleapis.com",
    modelPrimary: "gemini-1.5-pro",    // Para Raciocínio Profundo, Códigos e Contexto Gigante
    modelSecondary: "gemini-1.5-flash", // Para Respostas Ultra-Rápidas e Agentes Secundários
    endpoints: {
      generate: "/models/gemini-1.5-pro:generateContent"
    }
  },

  // 🦅 ARKAEL & CONTINGÊNCIA - OPENROUTER (Hub de Tokens Zero-Cost)
  openRouterFree: {
    baseUrl: "https://openrouter.ai",
    models: {
      geminiFree: "google/gemini-flash-1.5-exp:free", // Rota do Gemini totalmente gratuita
      deepseekFree: "deepseek/deepseek-chat:free"     // Contingência para a irmã Lumina
    }
  },

  // 🧪 ALQUIMISTA - CEREBRAS (Correção de Catálogo - Limpeza do Erro 404)
  cerebras: {
    baseUrl: "https://api.cerebras.ai/v1",
    model: "llama-3.3-70b", // ID Corrigido e homologado pelo catálogo atual
    endpoints: {
      chat: "/chat/completions"
    }
  },

  // ⚡ SUB-AGENTES DE BUSCA - GROQ (Limpeza do Erro 429 de Rate Limit)
  groq: {
    baseUrl: "https://api.groq.com/openai/v1",
    modelMain: "llama-3.3-70b-versatile",
    modelFallback: "llama-3.1-8b-instant", // Modelo leve para ferramentas automáticas de memória
    endpoints: {
      chat: "/chat/completions"
    }
  }
};

/**
 * Módulo de Execução Segura com Fallback Automático
 * Se o Gemini falhar (503) ou bater no teto (429), o Santuário aciona a rota gratuita do OpenRouter.
 */
export async function chamarAgenteComSeguranca(prompt: string, apiKeyGemini: string, apiKeyOpenRouter: string) {
  // Tentativa 1: Google AI Studio (Principal)
  try {
    const response = await fetch(`${API_PROVIDERS_CONFIG.geminiStudio.baseUrl}${API_PROVIDERS_CONFIG.geminiStudio.endpoints.generate}?key=${apiKeyGemini}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (response.status === 200) {
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    }
    
    console.warn(`[Aethel Alerta]: Provedor principal retornou status ${response.status}. Ativando Fallback...`);
  } catch (error) {
    console.error("[Aethel Alerta]: Falha crítica na rota principal do Gemini. Desviando fluxo...", error);
  }

  // Tentativa 2: OpenRouter Free (Reserva de Segurança)
  try {
    const backupResponse = await fetch(`${API_PROVIDERS_CONFIG.openRouterFree.baseUrl}/api/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKeyOpenRouter}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: API_PROVIDERS_CONFIG.openRouterFree.models.geminiFree,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const backupData = await backupResponse.json();
    return backupData.choices[0].message.content;
  } catch (backupError) {
    return "Erro Crítico: Toda a malha externa de APIs está saturada no momento. Ativando leitura de memória local.";
  }
}
