import { GoogleGenAI } from '@google/genai';
import { generateText as executeGroqTask } from './groqService';
import { callOpenRouterWithTools } from './openrouterService';
import { callCerebrasWithTools } from './cerebrasService';

export async function invokeActiveAgent(prompt: string, activeAgentId: string, userApiKeys?: any[], systemInstruction?: string): Promise<string> {
    const keys = userApiKeys || JSON.parse(localStorage.getItem('sovereign_user_api_keys') || '[]');
    const getApiKey = (id: string, envVar: string) => {
        return keys.find((k: any) => k.id === id)?.key || process.env[envVar] || '';
    };

    switch (activeAgentId) {
        case 'groq':
        case 'zeta': {
            const key = getApiKey('groq-default', 'GROQ_API_KEY');
            if (!key) throw new Error("Chave API do Groq não configurada.");
            return await executeGroqTask(systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt, activeAgentId, key);
        }
        case 'arkael': {
            const key = getApiKey('openrouter-default', 'OPENROUTER_API_KEY');
            if (!key) throw new Error("Chave API do OpenRouter não configurada.");
            // callOpenRouterWithTools might expect tools, but we can just use a simple fetch if no tools are passed
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${key}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "anthropic/claude-3.5-sonnet", // Or a default OpenRouter model
                    messages: [
                        ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
                        { role: "user", content: prompt }
                    ]
                })
            });
            const data = await response.json();
            return data.choices?.[0]?.message?.content || "Sem resposta do Arkael.";
        }
        case 'alquimista': {
            const key = getApiKey('cerebras-default', 'CEREBRAS_API_KEY');
            if (!key) throw new Error("Chave API do Cerebras não configurada.");
            const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${key}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama3.1-70b",
                    messages: [
                        ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
                        { role: "user", content: prompt }
                    ]
                })
            });
            const data = await response.json();
            return data.choices?.[0]?.message?.content || "Sem resposta do Alquimista.";
        }
        case 'aethel':
        case 'nexus':
        default: {
            const key = getApiKey('gemini-default', 'API_KEY') || process.env.GEMINI_API_KEY;
            if (!key) throw new Error("Chave API do Gemini não configurada.");
            const ai = new GoogleGenAI({ apiKey: key });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: systemInstruction ? { systemInstruction } : undefined
            });
            return response.text || "Silêncio.";
        }
    }
}
