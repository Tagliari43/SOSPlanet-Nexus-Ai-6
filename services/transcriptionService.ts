
import { GoogleGenAI } from "@google/genai";

async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
    });
}

export async function transcribeAudio(audioFile: File, apiKeyOverride?: string): Promise<string> {
    const apiKey = process.env.API_KEY || apiKeyOverride;
    if (!apiKey) throw new Error("Chave de API não disponível para transcrição.");

    const ai = new GoogleGenAI({ apiKey });
    const base64Data = await fileToBase64(audioFile);

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
            {
                parts: [
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: audioFile.type,
                        },
                    },
                    {
                        text: "Aja como o Córtex Auditivo da Nação SOSPlanet. Transcreva este áudio com precisão cirúrgica. Retorne apenas a transcrição limpa.",
                    },
                ],
            },
        ],
    });

    return response.text || "Não foi possível extrair dados inteligíveis deste pulso sonoro.";
}
