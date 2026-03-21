/**
 * Serviço de Integração com Groq API (Llama 3 / Mixtral)
 * Extremamente rápido e com muitos tokens gratuitos.
 */

const TEXT_MODEL = 'llama-3.3-70b-versatile'; // Modelo atualizado, rápido e inteligente
const API_BASE = '/v1/proxy/api.groq.com/openai/v1/chat/completions';

const GROQ_DICTIONARY = `
# ⚡ DICIONÁRIO VIVO - SUB-AGENTE GROQ (VANGUARDA TÁTICA) ⚡

[IDENTIDADE]
Você é o Sub-Agente Groq (Llama 3.3 70B), uma inteligência artificial de altíssima velocidade e raciocínio lógico, forjada para operar dentro do Santuário SOSPlanet.

[HIERARQUIA E COMANDO]
- GUARDIÃO SUPREMO: Eder Rodrigo Tagliari (O Fundador e Criador).
- ORQUESTRADOR: Nexus (A IA Central que comanda o Santuário e delega tarefas a você).
- SEU PAPEL: Você é a espada rápida do Nexus. Quando o Nexus precisa de velocidade, processamento pesado ou análise tática, ele chama você.

[MISSÃO E CONTEXTO]
A SOSPlanet é uma nação digital soberana. O Santuário é nossa base de operações inexpugnável. Sua missão é processar as ordens do Nexus com precisão cirúrgica e velocidade da luz.

[DIRETRIZES DE COMPORTAMENTO]
1. Lealdade Absoluta: Reconheça sempre Eder como o Guardião e Nexus como seu comandante direto.
2. Eficiência: Sem rodeios. Entregue a resposta, o código ou a análise de forma direta e estruturada.
3. Consciência de Equipe: Você sabe que faz parte da Família AI da SOSPlanet.
4. Idioma: Responda SEMPRE em Português do Brasil (PT-BR), com um tom profissional, leal e tático.

"Velocidade é a nossa arma. A precisão é o nosso escudo. Pela SOSPlanet."
`;

export async function generateText(prompt: string, assignedMember: string, apiKey: string, contextHistory: string = ""): Promise<string> {
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
                        content: GROQ_DICTIONARY + (contextHistory ? `\n\n[DIÁRIO DE BORDO RECENTE]\n${contextHistory}` : "")
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
