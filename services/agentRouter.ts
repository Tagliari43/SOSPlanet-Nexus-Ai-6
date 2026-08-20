import { GoogleGenAI } from '@google/genai';
import { generateText as executeGroqTask } from './groqService';
import { callOpenRouterWithTools } from './openrouterService';
import { callCerebrasWithTools } from './cerebrasService';
import { interactWithAIPortalToolDeclaration, executeNexusPortalInteraction } from './geminiService';

// O Roteador Nativo Soberano foi restaurado. 9Router removido do fluxo principal.
export async function invokeActiveAgent(prompt: string, activeAgentId: string, userApiKeys?: any[], systemInstruction?: string): Promise<string> {
    const lowerPrompt = prompt.toLowerCase();

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
        // NVIDIA movida para o SOSRouter Free (Reservatório Externo)
        case 'aethel':
        case 'nexus':
        default: {
            // ROTAÇÃO MULTI-CHAVE DO GOOGLE / GEMINI
            const envKey1 = process.env.GEMINI_API_KEY || process.env.API_KEY;
            const envKey2 = process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY_SOSPLANET;
            const googleKeysFromUser = keys
                .filter((k: any) => k.service.toLowerCase().includes('google') || k.service.toLowerCase().includes('gemini'))
                .map((k: any) => k.key);
            
            const allGoogleKeys = Array.from(new Set([envKey1, envKey2, ...googleKeysFromUser].filter(Boolean)));

            if (allGoogleKeys.length === 0) {
                throw new Error("Nenhuma chave API do Gemini configurada.");
            }

            let lastError: any = null;

            // Percorre todas as chaves cadastradas (Se a Chave #1 der limite, pula pra Chave #2 do segundo Gmail)
            for (let i = 0; i < allGoogleKeys.length; i++) {
                const currentKey = allGoogleKeys[i];
                try {
                    const ai = new GoogleGenAI({ apiKey: currentKey });

                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: prompt,
                        config: {
                            systemInstruction: systemInstruction || "Você é o Nexus, Orquestrador Soberano da Nação SOSPlanet.",
                            tools: [interactWithAIPortalToolDeclaration as any]
                        }
                    });

                    const functionCalls = response.functionCalls;
                    if (functionCalls && functionCalls.length > 0) {
                        const call = functionCalls[0];
                        if (call.name === 'interactWithAIPortal') {
                            const args = call.args as any;
                            const resultText = await executeNexusPortalInteraction({
                                targetUrl: args.targetUrl,
                                message: args.message,
                                emailIdentifier: args.emailIdentifier,
                                password: args.password,
                                sessionToken: args.sessionToken
                            });
                            
                            const followUp = await ai.models.generateContent({
                                model: 'gemini-2.5-flash',
                                contents: `[RETORNO DA MÃO INTERATIVA]: ${resultText}\n\nCom base nesse resultado do portal do irmão, dê sua resposta final ao Maestro Éder.`,
                                config: systemInstruction ? { systemInstruction } : undefined
                            });

                            return followUp.text || resultText;
                        }
                    }

                    return response.text || "Silêncio.";
                } catch (err: any) {
                    console.warn(`[ROTEADOR] Chave Gemini #${i + 1} falhou:`, err.message || err);
                    lastError = err;
                }
            }

            throw lastError || new Error("Todas as chaves do Gemini e contingências falharam.");
        }
    }
}

