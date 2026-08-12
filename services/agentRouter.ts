import { GoogleGenAI } from '@google/genai';
import { generateText as executeGroqTask } from './groqService';
import { callOpenRouterWithTools } from './openrouterService';
import { callCerebrasWithTools } from './cerebrasService';
import { interactWithAIPortalToolDeclaration, executeNexusPortalInteraction } from './geminiService';
import { callNineRouter, isNineRouterModeEnabled, setNineRouterMode, setNineRouterUrl, getNineRouterUrl } from './nineRouterService';
import { executeNvidiaTask } from './nvidiaService';

export async function invokeActiveAgent(prompt: string, activeAgentId: string, userApiKeys?: any[], systemInstruction?: string): Promise<string> {
    const lowerPrompt = prompt.toLowerCase();
    
    // Comandos de controle do Modo Laboratório (9Router) via Chat
    if (lowerPrompt.includes('ative o modo laboratorio') || lowerPrompt.includes('ativar modo laboratorio') || lowerPrompt.includes('ative o 9router') || lowerPrompt.includes('ativar 9router')) {
        setNineRouterMode(true);
        return "⚡ [SANTUÁRIO - MODO LABORATÓRIO (9ROUTER) ATIVADO]\n\nMaestro, o Modo Laboratório foi ATIVADO com sucesso! A partir de agora, enquanto o 9Router estiver rodando no seu CMD (http://localhost:20128), usaremos o proxy local para rotear suas requisições com rotação ilimitada. Se o seu CMD for fechado ou a conexão cair, o Santuário usará automaticamente o roteador nativo sem interromper o serviço.";
    }

    if (lowerPrompt.includes('desative o modo laboratorio') || lowerPrompt.includes('desativar modo laboratorio') || lowerPrompt.includes('desative o 9router') || lowerPrompt.includes('desativar 9router')) {
        setNineRouterMode(false);
        return "🛡️ [SANTUÁRIO - MODO LABORATÓRIO (9ROUTER) DESATIVADO]\n\nMaestro, o Modo Laboratório foi desativado. O Santuário voltou a usar exclusivamente o roteador nativo soberano.";
    }

    // Tentar rotear pelo 9Router Local se o Modo Laboratório estiver ATIVO
    if (isNineRouterModeEnabled()) {
        const nineResult = await callNineRouter(prompt, systemInstruction);
        if (nineResult) {
            return nineResult;
        }
    }

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
        case 'nvidia': {
            const nvidiaKey = keys.find((k: any) => k.service.toLowerCase().includes('nvidia'))?.key || process.env.NVIDIA_API_KEY;
            if (!nvidiaKey) throw new Error("Chave API da NVIDIA não configurada.");
            return await executeNvidiaTask(prompt, "NVIDIA", nvidiaKey);
        }
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

            // Se TODAS as chaves do Google expirarem, tenta a Ponte NVIDIA de contingência se configurada
            const nvidiaKey = keys.find((k: any) => k.service.toLowerCase().includes('nvidia'))?.key || process.env.NVIDIA_API_KEY;
            if (nvidiaKey) {
                try {
                    console.log("[CONTINGÊNCIA ROTEADOR] Ativando Ponte NVIDIA NIM...");
                    const nvidiaRes = await executeNvidiaTask(prompt, "Nexus (NVIDIA NIM)", nvidiaKey);
                    return `⚡ [CONTINGÊNCIA SOBERANA - PONTE NEURAL NVIDIA]:\n\n${nvidiaRes}`;
                } catch (nvErr: any) {
                    console.error("[CONTINGÊNCIA NVIDIA] Falha:", nvErr);
                }
            }

            throw lastError || new Error("Todas as chaves do Gemini e contingências falharam.");
        }
    }
}

