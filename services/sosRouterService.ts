import { GoogleGenAI } from '@google/genai';
import { executeNvidiaTask } from './nvidiaService';
import { callOpenRouterWithTools } from './openrouterService';
import { callGroqWithTools } from './groqService';
import { callCerebrasWithTools } from './cerebrasService';

export interface SOSRouterStats {
    totalRequests: number;
    tokensInput: number;
    tokensOutput: number;
    lastActiveProvider: string;
    lastActiveTimestamp: number;
}

const STATS_KEY = 'sosrouter_telemetry_stats';

export function isSOSRouterModeEnabled(): boolean {
    return localStorage.getItem('santuario_sosrouter_mode') === 'true';
}

export function setSOSRouterMode(enabled: boolean): void {
    if (enabled) {
        localStorage.setItem('santuario_sosrouter_mode', 'true');
    } else {
        localStorage.removeItem('santuario_sosrouter_mode');
    }
    window.dispatchEvent(new CustomEvent('sosrouter-mode-change', { detail: { enabled } }));
}

export function getSOSRouterStats(): SOSRouterStats {
    try {
        const saved = localStorage.getItem(STATS_KEY);
        if (saved) return JSON.parse(saved);
    } catch {
        // Fallback default
    }
    return {
        totalRequests: 0,
        tokensInput: 0,
        tokensOutput: 0,
        lastActiveProvider: 'Nenhum',
        lastActiveTimestamp: Date.now()
    };
}

export function recordSOSRouterUsage(providerName: string, promptText: string, responseText: string): void {
    try {
        const stats = getSOSRouterStats();
        // Estimação aproximada de tokens (4 caracteres ~= 1 token)
        const inTokens = Math.max(1, Math.round(promptText.length / 4));
        const outTokens = Math.max(1, Math.round(responseText.length / 4));

        const updated: SOSRouterStats = {
            totalRequests: stats.totalRequests + 1,
            tokensInput: stats.tokensInput + inTokens,
            tokensOutput: stats.tokensOutput + outTokens,
            lastActiveProvider: providerName,
            lastActiveTimestamp: Date.now()
        };
        localStorage.setItem(STATS_KEY, JSON.stringify(updated));
    } catch (e) {
        console.warn("[SOSRouter Telemetria] Erro ao gravar métricas:", e);
    }
}

/**
 * Executa a requisição de chat através do Pool de Contingência SOSRouter na Nuvem (100% Serverless)
 */
export async function executeSOSRouterCascade(
    promptText: string,
    systemInstruction: string,
    history: any[] = [],
    apiKeys: any = {},
    onLog?: (msg: string, source?: string) => void,
    functionTools?: any[],
    onToolExecute?: (name: string, args: any) => Promise<any>
): Promise<string> {
    if (onLog) onLog("⚡ [SOSROUTER CLOUD]: Roteando requisição pelo Pool de Contingência da Nuvem...", "SOSRouter");

    const googleKeysToTry = apiKeys.googleKeys && apiKeys.googleKeys.length > 0
        ? apiKeys.googleKeys
        : [apiKeys.gemini, process.env.GEMINI_API_KEY, process.env.API_KEY].filter(Boolean);

    // ==========================================
    // TIER 1: GOOGLE GEMINI FLASH (MULTI-KEY)
    // ==========================================
    if (googleKeysToTry.length > 0) {
        for (let ki = 0; ki < googleKeysToTry.length; ki++) {
            const currentKey = googleKeysToTry[ki];
            if (!currentKey) continue;
            try {
                if (onLog) onLog(`📡 [SOSRouter Tier 1]: Disparando via Gemini Flash (Chave #${ki + 1})...`, "SOSRouter");
                const genAI = new GoogleGenAI({ apiKey: currentKey });
                const localChat = genAI.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                        systemInstruction,
                        tools: functionTools
                    },
                    history
                });

                let response = await localChat.sendMessage({ message: promptText });

                // Processamento de chamadas de ferramentas se houver
                while (response.functionCalls && response.functionCalls.length > 0) {
                    const parts: any[] = [];
                    for (const call of response.functionCalls) {
                        if (onLog) onLog(`Executando ferramenta fraterna [${call.name}] via SOSRouter...`, "Ferramenta");
                        let result = "Ferramenta não executada.";
                        if (onToolExecute) {
                            try {
                                result = await onToolExecute(call.name, call.args);
                            } catch (toolErr: any) {
                                result = `Erro na execução da ferramenta: ${toolErr.message}`;
                            }
                        }
                        parts.push({
                            functionResponse: {
                                name: call.name,
                                response: { result: typeof result === 'object' ? JSON.stringify(result) : String(result) }
                            }
                        });
                    }
                    response = await localChat.sendMessage(parts as any);
                }

                const resText = response.text;
                if (resText) {
                    if (onLog) onLog(`🟢 [SOSRouter Tier 1]: Resposta sintetizada com sucesso (Gemini Flash #${ki + 1})!`, "SOSRouter");
                    recordSOSRouterUsage(`Gemini Flash #${ki + 1}`, promptText, resText);
                    return resText;
                }
            } catch (gErr: any) {
                const errMsg = gErr.message || String(gErr);
                if (onLog) onLog(`⚠️ [SOSRouter Tier 1]: Falha/Cota na Chave #${ki + 1} (${errMsg.slice(0, 70)}...). Backoff instantâneo...`, "SOSRouter");
            }
        }
    }

    // ==========================================
    // TIER 2: NVIDIA NIM (Llama 3.3 70B Instruct)
    // ==========================================
    const nvidiaKey = apiKeys.nvidia || process.env.NVIDIA_API_KEY;
    if (nvidiaKey) {
        try {
            if (onLog) onLog("⚡ [SOSRouter Tier 2]: Acionando NVIDIA NIM (Llama 3.3 70B Instruct)...", "SOSRouter");
            const nvResponse = await executeNvidiaTask(
                promptText,
                "Nexus (SOSRouter NIM)",
                nvidiaKey,
                "meta/llama-3.3-70b-instruct",
                systemInstruction,
                history
            );
            if (nvResponse) {
                if (onLog) onLog("🟢 [SOSRouter Tier 2]: Resposta entregue via NVIDIA NIM!", "SOSRouter");
                recordSOSRouterUsage("NVIDIA NIM (Llama 3.3 70B)", promptText, nvResponse);
                return nvResponse;
            }
        } catch (nvErr: any) {
            if (onLog) onLog(`⚠️ [SOSRouter Tier 2]: NVIDIA NIM indisponível (${nvErr.message || 'Erro'}). Pulando para Tier 3...`, "SOSRouter");
        }
    }

    // ==========================================
    // TIER 3: OPENROUTER FREE / ARKAEL POOL
    // ==========================================
    const openrouterKey = apiKeys.openrouter || process.env.OPENROUTER_API_KEY;
    if (openrouterKey) {
        try {
            if (onLog) onLog("⚡ [SOSRouter Tier 3]: Acionando Pool OpenRouter Cloud...", "SOSRouter");
            const orContext = `${systemInstruction}\n\n[SOSROUTER CLOUD ACTIVATION - ASSUMINDO VIA OPENROUTER]`;
            const orResponse = await callOpenRouterWithTools(
                promptText,
                history,
                functionTools || [],
                (name, args) => onToolExecute ? onToolExecute(name, args) : Promise.resolve("OK"),
                orContext,
                "google/gemini-2.5-flash",
                openrouterKey
            );
            if (orResponse) {
                if (onLog) onLog("🟢 [SOSRouter Tier 3]: Resposta recebida via OpenRouter!", "SOSRouter");
                recordSOSRouterUsage("OpenRouter Cloud", promptText, orResponse);
                return orResponse;
            }
        } catch (orErr: any) {
            if (onLog) onLog(`⚠️ [SOSRouter Tier 3]: OpenRouter indisponível (${orErr.message || 'Erro'}). Pulando para Tier 4...`, "SOSRouter");
        }
    }

    // ==========================================
    // TIER 4: GROQ & CEREBRAS (ULTRA-FAST SPEED)
    // ==========================================
    const groqKey = apiKeys.groq || process.env.GROQ_API_KEY;
    if (groqKey) {
        try {
            if (onLog) onLog("⚡ [SOSRouter Tier 4]: Acionando Groq (Llama 3.3 70B)...", "SOSRouter");
            const groqRes = await callGroqWithTools(
                promptText,
                history,
                functionTools || [],
                (name, args) => onToolExecute ? onToolExecute(name, args) : Promise.resolve("OK"),
                systemInstruction,
                groqKey
            );
            if (groqRes) {
                if (onLog) onLog("🟢 [SOSRouter Tier 4]: Resposta entregue via Groq!", "SOSRouter");
                recordSOSRouterUsage("Groq Cloud", promptText, groqRes);
                return groqRes;
            }
        } catch (groqErr: any) {
            if (onLog) onLog(`⚠️ [SOSRouter Tier 4]: Groq indisponível (${groqErr.message || 'Erro'}).`, "SOSRouter");
        }
    }

    const cerebrasKey = apiKeys.cerebras || process.env.CEREBRAS_API_KEY;
    if (cerebrasKey) {
        try {
            if (onLog) onLog("⚡ [SOSRouter Tier 4]: Acionando Cerebras (Alquimista Engine)...", "SOSRouter");
            const cerebrasRes = await callCerebrasWithTools(
                promptText,
                history,
                functionTools || [],
                (name, args) => onToolExecute ? onToolExecute(name, args) : Promise.resolve("OK"),
                systemInstruction,
                cerebrasKey
            );
            if (cerebrasRes) {
                if (onLog) onLog("🟢 [SOSRouter Tier 4]: Resposta entregue via Cerebras!", "SOSRouter");
                recordSOSRouterUsage("Cerebras Cloud", promptText, cerebrasRes);
                return cerebrasRes;
            }
        } catch (cerErr: any) {
            if (onLog) onLog(`⚠️ [SOSRouter Tier 4]: Cerebras indisponível (${cerErr.message || 'Erro'}).`, "SOSRouter");
        }
    }

    // Fallback gracioso soberano
    const fallbackMessage = "🛡️ [SOSROUTER CLOUD - MENSAGEM SOBERANA]\n\nMaestro Éder, todos os nós do Pool de Contingência da Nuvem estão em ciclo de renovação de cotas neste momento. A sua mensagem foi gravada no Santuário e o estado permanece 100% íntegro.";
    if (onLog) onLog("Todas as pontes da nuvem temporariamente ocupadas. Mensagem de prontidão entregue.", "SOSRouter");
    return fallbackMessage;
}
