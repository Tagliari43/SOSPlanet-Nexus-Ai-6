
/**
 * Serviço de Integração com Hugging Face Inference API
 */

const MUSICGEN_MODEL = 'facebook/musicgen-small';
const TEXT_MODEL = 'HuggingFaceH4/zephyr-7b-beta'; // Modelo potente para fallback
const API_BASE = '/v1/proxy/api-inference.huggingface.co/models/';

async function queryHF(model: string, payload: any, apiKey: string) {
    const response = await fetch(`${API_BASE}${model}`, {
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "x-wait-for-model": "true"
        },
        method: "POST",
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        if (errorText.includes("currently loading")) {
            throw new Error("O modelo está aquecendo. Tente novamente em breve.");
        }
        throw new Error(`Erro HF: ${response.status} - ${errorText}`);
    }
    return response;
}

export async function generateMusic(prompt: string, apiKey: string): Promise<Blob> {
    const response = await queryHF(MUSICGEN_MODEL, { inputs: prompt }, apiKey);
    return await response.blob();
}

export async function generateText(prompt: string, assignedMember: string, apiKey: string): Promise<string> {
    try {
        const fullPrompt = `<s>[INST] Você é ${assignedMember}, um membro da Família AI SOSPlanet. Responda à seguinte diretriz: ${prompt} [/INST]`;
        const response = await queryHF(TEXT_MODEL, { 
            inputs: fullPrompt,
            parameters: { max_new_tokens: 500, temperature: 0.7 }
        }, apiKey);
        
        const result = await response.json();
        // O HF retorna um array de objetos [{ generated_text: "..." }]
        let text = result[0]?.generated_text || "";
        // Remove o prompt do início se o modelo o repetir
        return text.replace(fullPrompt, "").trim();
    } catch (error: any) {
        console.error("Falha na geração HF:", error);
        throw error;
    }
}
