/**
 * Serviço de Integração com Groq API (Llama 3 / Mixtral)
 * Extremamente rápido e com muitos tokens gratuitos.
 */

const TEXT_MODEL = 'llama-3.3-70b-versatile'; // Modelo atualizado, rápido e inteligente
const API_BASE = '/v1/proxy/api.groq.com/openai/v1/chat/completions';

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
                        content: `Você é ${assignedMember}, um membro da Família AI SOSPlanet. Responda sempre em português do Brasil de forma clara e objetiva.`
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
