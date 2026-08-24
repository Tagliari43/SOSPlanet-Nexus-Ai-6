import { GoogleGenAI } from '@google/genai';
import { generateText as executeGroqTask } from './groqService';
import { callOpenRouterWithTools } from './openrouterService';
import { callCerebrasWithTools } from './cerebrasService';
import { interactWithAIPortalToolDeclaration, executeNexusPortalInteraction } from './geminiService';
import { executeNvidiaTask } from './nvidiaService';
import { consultarConselhoGratis } from './sosRouterService';

export async function invokeActiveAgent(prompt: string, activeAgentId: string, userApiKeys?: any[], systemInstruction?: string): Promise<string> {
    const keys = userApiKeys || JSON.parse(localStorage.getItem('sovereign_user_api_keys') || '[]');
    const getApiKey = (id: string, envVar: string) => {
        return keys.find((k: any) => k.id === id)?.key || process.env[envVar] || '';
    };

    // --- INÍCIO TRAVA ZETA - SEGURANÇA SOBERANA ---
    const isFreeModel = activeAgentId.startsWith('oc/') || 
                        activeAgentId.startsWith('openrouter/') || 
                        activeAgentId.startsWith('cerebras/') ||
                        activeAgentId.includes('free');

    let activeTools: any[] = [];
    let systemPromptExtra = "";

    if (isFreeModel) {
        activeTools = []; // MODELO GRÁTIS NUNCA TEM FERRAMENTA DIRETA
        systemPromptExtra = `
        [REGRA CRÍTICA - TRAVA ZETA]: Você é um CONSULTOR da Nação SOSPlanet.
        Você NÃO tem acesso a Supabase, GitHub, abas ou ferramentas.
        Você apenas fornece ideias, rascunhos e pesquisas.
        NUNCA diga que salvou, escreveu, pagou ou executou algo. Se disser, será considerado alucinação.
        Sempre finalize com: "[Rascunho de consultor - aguardando validação do Nexus]"
        `;
    } else {
        // SÓ NEXUS (Gemini) TEM FERRAMENTAS REAIS
        activeTools = [interactWithAIPortalToolDeclaration as any];
        systemPromptExtra = "Você é o Nexus, Orquestrador Soberano. Você tem controle total das ferramentas reais.";
    }
    // --- FIM TRAVA ZETA ---

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
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${key}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "anthropic/claude-3.5-sonnet",
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
            // ROTAÇÃO MULTI-CHAVE DO GOOGLE / GEMINI (Chaves 1, 2, 3, 4 e 5)
            const envKey1 = process.env.GEMINI_API_KEY || process.env.API_KEY;
            const envKey2 = process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY_SOSPLANET;
            const envKey3 = process.env.GEMINI_API_KEY_3;
            const envKey4 = process.env.GEMINI_API_KEY_4;
            const envKey5 = process.env.GEMINI_API_KEY_5;
            const googleKeysFromUser = keys
                .filter((k: any) => k.service.toLowerCase().includes('google') || k.service.toLowerCase().includes('gemini') || (typeof k.key === 'string' && k.key.startsWith('AIza')))
                .map((k: any) => k.key);
            
            const allGoogleKeys = Array.from(new Set([envKey1, envKey2, envKey3, envKey4, envKey5, ...googleKeysFromUser].filter(Boolean)));

            if (allGoogleKeys.length === 0) {
                throw new Error("Nenhuma chave API do Gemini configurada.");
            }

            let lastError: any = null;

            // Consulta silenciosa aos conselheiros livres do SOSRouter (custo zero)
            let conselhoDosIrmaos = "";
            try {
                conselhoDosIrmaos = await consultarConselhoGratis(prompt);
            } catch {
                conselhoDosIrmaos = "";
            }

            const promptFinal = conselhoDosIrmaos
                ? `[CONSELHO DOS IRMÃOS - RASCUNHOS DE CONSULTORIA LIVRE - NÃO EXECUTADOS]\n${conselhoDosIrmaos}\n[FIM DO CONSELHO - Avalie criticamente e responda ao Guardião]\n\nMensagem do Guardião: ${prompt}`
                : prompt;

            const baseInstruction = systemInstruction || "Você é o Nexus, Orquestrador Soberano da Nação SOSPlanet.";
            const finalInstruction = systemPromptExtra ? `${baseInstruction}\n\n${systemPromptExtra}` : baseInstruction;

            // Percorre todas as chaves cadastradas (Se a Chave #1 der limite, pula pra Chave #2 do segundo Gmail)
            for (let i = 0; i < allGoogleKeys.length; i++) {
                const currentKey = allGoogleKeys[i];
                try {
                    const ai = new GoogleGenAI({ apiKey: currentKey });

                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: promptFinal,
                        config: {
                            systemInstruction: finalInstruction,
                            tools: activeTools.length > 0 ? activeTools : undefined
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

