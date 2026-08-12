/**
 * Serviço de Integração com a API NVIDIA NIM / NVIDIA AI Foundation
 * Permite roteamento de contingência para modelos como Llama 3.3 70B e Nemotron.
 */

export async function executeNvidiaTask(
    prompt: string, 
    assignedAgentName: string = "Nexus", 
    apiKey: string, 
    model: string = "meta/llama-3.3-70b-instruct"
): Promise<string> {
    if (!apiKey) {
        throw new Error("Chave API da NVIDIA não informada.");
    }

    try {
        const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey.trim()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: "system",
                        content: `Você é ${assignedAgentName}, membro ativo do Santuário SOSPlanet. Responda com clareza e autoridade.`
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.6,
                max_tokens: 2048
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(`[NVIDIA API Error ${response.status}]: ${errData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (!content) {
            throw new Error("Resposta vazia retornada pela API NVIDIA.");
        }

        return content;
    } catch (error: any) {
        console.error("[NVIDIA SERVICE ERROR]:", error);
        throw error;
    }
}
