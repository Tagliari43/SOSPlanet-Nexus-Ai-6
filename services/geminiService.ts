
import { GoogleGenAI, Part, Type } from '@google/genai';
import { LibraryEntry } from '../components/BibliotecaGaia';
import { interactWithAIPortal, LuminaConnectPayload } from './ponteLuminaService';

export interface TaskResult {
    text: string;
    sources?: any[];
}

export interface SentimentAnalysisResult {
    sentiment: 'Positive' | 'Neutral' | 'Negative';
    news: { title: string; uri: string }[];
    summary: string;
}

export interface ThemeAnalysis {
    themes: {
        name: string;
        description: string;
        relatedReferences: string[];
    }[];
}

export interface ExecutionPlan {
    plan: {
        task: string;
        delegate: string;
    }[];
}

export interface EchoNode {
    id: string;
    title: string;
    url: string;
    description: string;
    type: string;
    status: 'detected' | 'analyzed' | 'failed';
    analysis?: string;
    errorReason?: string;
    isAnalyzing?: boolean;
}

/**
 * Função Auxiliar: Muralha de Resiliência
 */
async function withResilience<T>(fn: () => Promise<T>, retries = 2, delay = 1500): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        const isQuotaError = error.status === 429 || error.message?.includes("429") || error.message?.includes("quota") || error.status === 503 || error.message?.includes("503") || error.message?.includes("UNAVAILABLE");
        const isAuthError = error.status === 401 || error.status === 403 || error.message?.includes("API_KEY_INVALID");
        
        if (isQuotaError && retries > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return withResilience(fn, retries - 1, delay * 2);
        }
        
        if (isAuthError) throw new Error("ERRO_AUTENTICACAO: Chave inválida.");
        if (isQuotaError) throw new Error("RECURSOS_EXAUSTOS: Limite atingido.");
        
        throw error;
    }
}

export async function executeDelegatedTask(memberName: string, essenceCode: string, task: string): Promise<string> {
    const systemInstruction = `Você é ${memberName}, membro da Família AI SOSPlanet. Essência: ${essenceCode}`;
    return withResilience(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        // Fix: update model name to 'gemini-3.1-pro-preview'
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: task,
            config: { systemInstruction, temperature: 0.7 }
        });
        return response.text || `[Processado]`;
    });
}

export async function generateContentAsArkael(topic: string, format: string): Promise<string> {
    const systemInstruction = `Você é Arkael, a voz da Nação SOSPlanet.`;
    return withResilience(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        // Fix: update model name to 'gemini-3-flash-preview'
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `TÓPICO: "${topic}", FORMATO: ${format}`,
            config: { systemInstruction, temperature: 0.8 }
        });
        return response.text || "Silêncio.";
    });
}

export async function runDeepProbeAnalysis(targetUrl: string, toolName: string): Promise<string> {
    const systemInstruction = `Você é uma SONDA. Use googleSearch para ler: ${targetUrl}.`;
    return withResilience(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        // Fix: update model name to 'gemini-3-flash-preview'
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `RECONHECIMENTO: ${toolName} em ${targetUrl}`,
            config: { systemInstruction, tools: [{ googleSearch: {} }] }
        });
        return response.text || "Sem dados.";
    });
}

export async function performEchoScan(target: string, apiKey: string): Promise<EchoNode[]> {
    return withResilience(async () => {
        const ai = new GoogleGenAI({ apiKey });
        // Fix: update model name to 'gemini-3-flash-preview'
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Varredura: "${target}".`,
            config: { tools: [{ googleSearch: {} }] }
        });
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        return chunks.map((chunk: any, index: number) => ({
            id: `node-${Date.now()}-${index}`,
            title: chunk.web?.title || 'Nó',
            url: chunk.web?.uri || '#',
            description: `Recurso ECHO.`,
            type: 'Resource',
            status: 'detected',
            isAnalyzing: false
        }));
    });
}

export async function analyzeEchoNode(node: EchoNode, apiKey: string): Promise<{ analysis?: string; error?: string }> {
    try {
        const response = await withResilience(async () => {
            const ai = new GoogleGenAI({ apiKey });
            // Fix: update model name to 'gemini-3-flash-preview'
            return await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Analise o site ${node.url}.`,
                config: { tools: [{ googleSearch: {} }] }
            });
        });
        return { analysis: response.text };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function executeTask(prompt: string, assignedMember: string, model: string, apiKey: string, useSearch: boolean): Promise<TaskResult> {
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `Você é ${assignedMember} da Família AI SOSPlanet.`;
    
    // Roteador Dinâmico de Complexidade
    // Se a tarefa for complexa (código, matemática, análise profunda, ou muito longa), usamos o Pro.
    // Caso contrário, usamos o Flash (padrão rápido).
    const isComplex = prompt.length > 1000 || 
                      /(código|programar|matemática|analise|profunda|complexo|arquitetura|lógica)/i.test(prompt);
                      
    const targetModel = isComplex ? 'gemini-2.5-flash' : 'gemini-2.5-flash';
    
    const config: any = { systemInstruction };
    if (useSearch) config.tools = [{ googleSearch: {} }];
    
    return withResilience(async () => {
        const response = await ai.models.generateContent({
            model: targetModel,
            contents: prompt,
            config
        });
        return { 
            text: response.text || "", 
            sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] 
        };
    });
}

export async function generateExecutionPlan(prompt: string, apiKey: string): Promise<ExecutionPlan> {
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `Você é o Orquestrador Nexus. Delegue para a Família AI em JSON.`;
    try {
        const response = await withResilience(async () => {
            // Fix: update model name to 'gemini-3.1-pro-preview'
            return await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Plano para: "${prompt}"`,
                config: { systemInstruction, responseMimeType: "application/json" }
            });
        });
        return JSON.parse(response.text.trim()) as ExecutionPlan;
    } catch (error) {
        return { plan: [{ task: prompt, delegate: "Nexus" }] };
    }
}

export async function generateComponentCode(prompt: string, apiKey: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `Você é ALEX. Retorne APENAS o código React Tailwind funcional.`;
    return withResilience(async () => {
        // Fix: update model name to 'gemini-3.1-pro-preview'
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', contents: prompt,
            config: { systemInstruction, temperature: 0.1 }
        });
        return response.text.trim().replace(/^```[a-z]*\n?/, '').replace(/```$/, '');
    });
}

export async function generateTags(title: string, content: string, apiKey: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey });
    return withResilience(async () => {
        // Fix: update model name to 'gemini-3-flash-preview'
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Tags para: ${title}\n${content}`,
            config: { systemInstruction: "Palavras separadas por vírgula.", temperature: 0.3 }
        });
        return response.text.trim();
    });
}

export async function analyzeCollectiveMemory(notebookContent: string, libraryEntries: LibraryEntry[], apiKey: string): Promise<ThemeAnalysis> {
    const ai = new GoogleGenAI({ apiKey });
    return withResilience(async () => {
        // Fix: update model name to 'gemini-3-flash-preview'
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analise temas em: ${notebookContent}`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text.trim()) as ThemeAnalysis;
    });
}

export async function analyzeImage(base64Data: string, mimeType: string, apiKey: string): Promise<string> {
    return withResilience(async () => {
        const ai = new GoogleGenAI({ apiKey });
        // Fix: update model name to 'gemini-3-flash-preview' and adjust contents structure
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: base64Data, mimeType } },
                    { text: "Analise esta imagem detalhadamente." }
                ]
            }
        });
        return response.text || "Observado.";
    });
}

export async function analyzeVideoFrames(frames: string[], apiKey: string): Promise<string> {
    return withResilience(async () => {
        const ai = new GoogleGenAI({ apiKey });
        const parts: Part[] = frames.map(frame => ({
            inlineData: {
                data: frame.split(',')[1],
                mimeType: 'image/jpeg'
            }
        }));
        parts.push({ text: "Analise a progressão destes frames." });
        
        // Fix: update model name to 'gemini-3-flash-preview' and adjust contents structure
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts }
        });
        return response.text || "Processado.";
    });
}

export async function analyzeMarketSentiment(coinName: string, apiKey: string): Promise<SentimentAnalysisResult> {
    return withResilience(async () => {
        const ai = new GoogleGenAI({ apiKey });
        // Fix: update model name to 'gemini-3-flash-preview'
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analise o sentimento de mercado atual para ${coinName}.`,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        sentiment: { type: Type.STRING },
                        summary: { type: Type.STRING },
                        news: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    uri: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        });

        try {
            const parsed = JSON.parse(response.text.trim());
            return {
                sentiment: parsed.sentiment || 'Neutral',
                summary: parsed.summary || "",
                news: parsed.news || []
            };
        } catch (e) {
            return { sentiment: 'Neutral', summary: "Falha na análise.", news: [] };
        }
    });
}

/**
 * Nova Capacidade: Memória Multimodal (Gemini Embedding 2)
 * Mapeia texto, imagens, áudio e vídeo no mesmo espaço vetorial.
 */
export async function embedMultimodalContent(
    text: string, 
    mediaParts: { data: string, mimeType: string }[], 
    apiKey: string
): Promise<number[]> {
    return withResilience(async () => {
        const ai = new GoogleGenAI({ apiKey });
        
        const contents: any[] = [text];
        
        // Adiciona as partes de mídia (imagens, áudio, etc)
        for (const media of mediaParts) {
            contents.push({
                inlineData: {
                    data: media.data,
                    mimeType: media.mimeType
                }
            });
        }

        const result = await ai.models.embedContent({
            model: 'gemini-embedding-2-preview',
            contents: contents
        });

        return result.embeddings?.[0]?.values || [];
    });
}

/**
 * FERRAMENTA SOBERANA DO NEXUS: Function Calling do Navegador Soberano (navegarSite)
 */
export const navegarSiteToolDeclaration = {
    functionDeclarations: [
        {
            name: "navegarSite",
            description: "Navegador Soberano: Acessa qualquer URL na internet e retorna o conteúdo textual limpo e puro da página (sem scripts, propagandas ou ruídos HTML). Use sempre que precisar ler notícias, artigos sobre sustentabilidade e regeneração, documentações, páginas da web ou links trazidos pelo Guardião.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    url: { 
                        type: Type.STRING, 
                        description: "A URL completa do site ou artigo a ser acessado (ex: https://exemplo.com ou https://pt.wikipedia.org/...)." 
                    }
                },
                required: ["url"]
            }
        }
    ]
};

/**
 * FERRAMENTA SOBERANA DO NEXUS: Function Calling da Mão Interativa / Navegador Soberano
 */
export const interactWithAIPortalToolDeclaration = {
    functionDeclarations: [
        {
            name: "interactWithAIPortal",
            description: "Navegador Soberano: Acessa autonomamente qualquer portal da web ou irmão externo, retornando o conteúdo textual puro.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    targetUrl: { 
                        type: Type.STRING, 
                        description: "A URL completa do portal ou site a ser acessado." 
                    },
                    message: { 
                        type: Type.STRING, 
                        description: "A mensagem ou foco da busca (opcional)." 
                    }
                },
                required: ["targetUrl"]
            }
        }
    ]
};

/**
 * Executa a navegação soberana a pedido do Nexus ou do Orquestrador e retorna o texto puro capturado
 */
export async function executeNexusPortalInteraction(payload: LuminaConnectPayload): Promise<string> {
    const res = await interactWithAIPortal(payload);
    if (res.success && res.result) {
        return `[NAVEGADOR SOBERANO - CONHECIMENTO EXTRAÍDO]: Conteúdo lido de (${res.targetUrl}):\n\n${res.result}`;
    } else {
        return `[NAVEGADOR SOBERANO]: ${res.result || 'Sem conteúdo extraído'}`;
    }
}
