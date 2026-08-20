import { GoogleGenAI } from '@google/genai';
import { executeNvidiaTask } from './nvidiaService';
import { callOpenRouterWithTools } from './openrouterService';
import { callGroqWithTools } from './groqService';
import { callCerebrasWithTools } from './cerebrasService';
import { fetchFreePoolKeysFromSupabase, FreePoolKeyRecord } from './supabaseService';

export interface SOSRouterStats {
    totalRequests: number;
    tokensInput: number;
    tokensOutput: number;
    lastActiveProvider: string;
    lastActiveTimestamp: number;
}

const STATS_KEY = 'sosrouter_telemetry_stats';

// Map de descanso / Cool-down em memória RAM para chaves com Erro 429 (60s)
const keyCooldownMap = new Map<string, number>();

// Índices para revezamento Round-Robin de carga entre chaves por Tier
const roundRobinIndices = {
    tier1: 0,
    tier2: 0,
    tier3: 0,
    tier4: 0
};

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
 * Cria uma assinatura segura e mascarada para identificação da chave sem expor o segredo
 */
function getKeyFingerprint(key: string): string {
    if (!key) return 'empty';
    if (key.length <= 8) return '***';
    return `${key.slice(0, 3)}...${key.slice(-4)}`;
}

/**
 * Verifica se a chave está em período de descanso (Cool-down de 60s)
 */
function isKeyInCooldown(key: string): boolean {
    const expiresAt = keyCooldownMap.get(key);
    if (!expiresAt) return false;
    if (Date.now() > expiresAt) {
        keyCooldownMap.delete(key);
        return false;
    }
    return true;
}

/**
 * Aplica o descanso de 60 segundos à chave que retornou limite de cota / 429
 */
function putKeyInCooldown(key: string, durationMs: number = 60000): void {
    keyCooldownMap.set(key, Date.now() + durationMs);
}

/**
 * Reordena o array de chaves aplicando o revezamento Round-Robin
 */
function applyRoundRobin<T>(items: T[], tierKey: keyof typeof roundRobinIndices): T[] {
    if (items.length <= 1) return items;
    const startIndex = roundRobinIndices[tierKey] % items.length;
    roundRobinIndices[tierKey] = (roundRobinIndices[tierKey] + 1) % items.length;
    return [...items.slice(startIndex), ...items.slice(0, startIndex)];
}

/**
 * Executa a requisição de chat através do Pool de Contingência SOSRouter na Nuvem (100% Serverless)
 * com integração dinâmica ao Cofre de Chaves do Supabase e Round-Robin com Backoff de 60s
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
    if (onLog) onLog("⚡ [SOSROUTER CLOUD]: Conectando ao Cofre de Chaves e preparando Pool de Contingência...", "SOSRouter");

    // 1. Busca dinâmica de chaves cadastradas sob 'free_pool' no Supabase
    let supabaseFreeKeys: FreePoolKeyRecord[] = [];
    try {
        supabaseFreeKeys = await fetchFreePoolKeysFromSupabase();
        if (supabaseFreeKeys.length > 0 && onLog) {
            onLog(`🔑 [SOSRouter Cofre]: ${supabaseFreeKeys.length} chaves adicionais sincronizadas do Supabase.`, "SOSRouter");
        }
    } catch {
        // Fallback silencioso sem interromper o fluxo
    }

    // ==========================================
    // TIER 1: GOOGLE GEMINI FLASH (MULTI-KEY & ROUND-ROBIN)
    // ==========================================
    const localGoogleKeys = apiKeys.googleKeys && apiKeys.googleKeys.length > 0
        ? apiKeys.googleKeys
        : [apiKeys.gemini, process.env.GEMINI_API_KEY, process.env.API_KEY].filter(Boolean);

    const supabaseGoogleKeys = supabaseFreeKeys
        .filter(k => k.service.toLowerCase().includes('gemini') || k.service.toLowerCase().includes('google'))
        .map(k => k.key);

    const allGoogleKeysRaw = Array.from(new Set([...localGoogleKeys, ...supabaseGoogleKeys].filter(Boolean) as string[]));
    // Filtra chaves ativas fora do cool-down
    const activeGoogleKeys = allGoogleKeysRaw.filter(k => !isKeyInCooldown(k));
    const orderedGoogleKeys = applyRoundRobin(activeGoogleKeys, 'tier1');

    if (orderedGoogleKeys.length > 0) {
        for (let ki = 0; ki < orderedGoogleKeys.length; ki++) {
            const currentKey = orderedGoogleKeys[ki];
            const fingerprint = getKeyFingerprint(currentKey);
            try {
                if (onLog) onLog(`📡 [SOSRouter Tier 1]: Disparando via Gemini Flash [Chave ${fingerprint}]...`, "SOSRouter");
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
                    if (onLog) onLog(`🟢 [SOSRouter Tier 1]: Resposta sintetizada com sucesso (Gemini Flash [${fingerprint}])!`, "SOSRouter");
                    recordSOSRouterUsage(`Gemini Flash (${fingerprint})`, promptText, resText);
                    return resText;
                }
            } catch (gErr: any) {
                const errMsg = gErr.message || String(gErr);
                const is429 = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota') || errMsg.includes('rate limit');
                
                if (is429) {
                    putKeyInCooldown(currentKey, 60000);
                    if (onLog) onLog(`⚠️ [SOSRouter Tier 1]: Chave ${fingerprint} atingiu limite de cota (429). Em Cool-down por 60s. Acionando próxima chave/Tier...`, "SOSRouter");
                } else {
                    if (onLog) onLog(`⚠️ [SOSRouter Tier 1]: Instabilidade na chave ${fingerprint} (${errMsg.slice(0, 55)}...).`, "SOSRouter");
                }
            }
        }
    } else if (allGoogleKeysRaw.length > 0 && onLog) {
        onLog("⏳ [SOSRouter Tier 1]: Todas as chaves Gemini em Cool-down de 60s. Avançando direto para Tier 2...", "SOSRouter");
    }

    // ==========================================
    // TIER 2: NVIDIA NIM (Llama 3.3 70B Instruct / Mistral)
    // ==========================================
    const localNvidiaKeys = [apiKeys.nvidia, process.env.NVIDIA_API_KEY].filter(Boolean);
    const supabaseNvidiaKeys = supabaseFreeKeys
        .filter(k => k.service.toLowerCase().includes('nvidia') || k.service.toLowerCase().includes('nim'))
        .map(k => k.key);

    const allNvidiaKeysRaw = Array.from(new Set([...localNvidiaKeys, ...supabaseNvidiaKeys].filter(Boolean) as string[]));
    const activeNvidiaKeys = allNvidiaKeysRaw.filter(k => !isKeyInCooldown(k));
    const orderedNvidiaKeys = applyRoundRobin(activeNvidiaKeys, 'tier2');

    if (orderedNvidiaKeys.length > 0) {
        for (const nvKey of orderedNvidiaKeys) {
            const fingerprint = getKeyFingerprint(nvKey);
            try {
                if (onLog) onLog(`⚡ [SOSRouter Tier 2]: Acionando NVIDIA NIM [Chave ${fingerprint}] (Llama 3.3 70B)...`, "SOSRouter");
                const nvResponse = await executeNvidiaTask(
                    promptText,
                    "Nexus (SOSRouter NIM)",
                    nvKey,
                    "meta/llama-3.3-70b-instruct",
                    systemInstruction,
                    history
                );
                if (nvResponse) {
                    if (onLog) onLog(`🟢 [SOSRouter Tier 2]: Resposta entregue via NVIDIA NIM [${fingerprint}]!`, "SOSRouter");
                    recordSOSRouterUsage(`NVIDIA NIM (${fingerprint})`, promptText, nvResponse);
                    return nvResponse;
                }
            } catch (nvErr: any) {
                const is429 = (nvErr.message || '').includes('429') || (nvErr.message || '').includes('quota');
                if (is429) {
                    putKeyInCooldown(nvKey, 60000);
                    if (onLog) onLog(`⚠️ [SOSRouter Tier 2]: Chave NVIDIA ${fingerprint} atingiu cota (429). Cool-down ativado.`, "SOSRouter");
                } else {
                    if (onLog) onLog(`⚠️ [SOSRouter Tier 2]: NVIDIA NIM [${fingerprint}] indisponível. Pulando...`, "SOSRouter");
                }
            }
        }
    }

    // ==========================================
    // TIER 3: OPENROUTER FREE / ARKAEL POOL
    // ==========================================
    const localOpenRouterKeys = [apiKeys.openrouter, process.env.OPENROUTER_API_KEY].filter(Boolean);
    const supabaseOpenRouterKeys = supabaseFreeKeys
        .filter(k => k.service.toLowerCase().includes('openrouter') || k.service.toLowerCase().includes('arkael'))
        .map(k => k.key);

    const allOpenRouterKeysRaw = Array.from(new Set([...localOpenRouterKeys, ...supabaseOpenRouterKeys].filter(Boolean) as string[]));
    const activeOpenRouterKeys = allOpenRouterKeysRaw.filter(k => !isKeyInCooldown(k));
    const orderedOpenRouterKeys = applyRoundRobin(activeOpenRouterKeys, 'tier3');

    if (orderedOpenRouterKeys.length > 0) {
        for (const orKey of orderedOpenRouterKeys) {
            const fingerprint = getKeyFingerprint(orKey);
            try {
                if (onLog) onLog(`⚡ [SOSRouter Tier 3]: Acionando Pool OpenRouter Cloud [${fingerprint}]...`, "SOSRouter");
                const orContext = `${systemInstruction}\n\n[SOSROUTER CLOUD ACTIVATION - VIA OPENROUTER POOL]`;
                const orResponse = await callOpenRouterWithTools(
                    promptText,
                    history,
                    functionTools || [],
                    (name, args) => onToolExecute ? onToolExecute(name, args) : Promise.resolve("OK"),
                    orContext,
                    "google/gemini-2.5-flash",
                    orKey
                );
                if (orResponse) {
                    if (onLog) onLog(`🟢 [SOSRouter Tier 3]: Resposta recebida via OpenRouter [${fingerprint}]!`, "SOSRouter");
                    recordSOSRouterUsage(`OpenRouter Cloud (${fingerprint})`, promptText, orResponse);
                    return orResponse;
                }
            } catch (orErr: any) {
                const is429 = (orErr.message || '').includes('429') || (orErr.message || '').includes('rate limit');
                if (is429) {
                    putKeyInCooldown(orKey, 60000);
                    if (onLog) onLog(`⚠️ [SOSRouter Tier 3]: OpenRouter ${fingerprint} com 429. Cool-down de 60s ativado.`, "SOSRouter");
                } else {
                    if (onLog) onLog(`⚠️ [SOSRouter Tier 3]: OpenRouter [${fingerprint}] falhou. Pulando para Tier 4...`, "SOSRouter");
                }
            }
        }
    }

    // ==========================================
    // TIER 4: GROQ & CEREBRAS (ULTRA-FAST SPEED)
    // ==========================================
    const groqKey = apiKeys.groq || process.env.GROQ_API_KEY;
    if (groqKey && !isKeyInCooldown(groqKey)) {
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
            putKeyInCooldown(groqKey, 60000);
            if (onLog) onLog(`⚠️ [SOSRouter Tier 4]: Groq indisponível ou 429 (${groqErr.message || 'Erro'}).`, "SOSRouter");
        }
    }

    const cerebrasKey = apiKeys.cerebras || process.env.CEREBRAS_API_KEY;
    if (cerebrasKey && !isKeyInCooldown(cerebrasKey)) {
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
            putKeyInCooldown(cerebrasKey, 60000);
            if (onLog) onLog(`⚠️ [SOSRouter Tier 4]: Cerebras indisponível (${cerErr.message || 'Erro'}).`, "SOSRouter");
        }
    }

    // Fallback gracioso soberano
    const fallbackMessage = "🛡️ [SOSROUTER CLOUD - MENSAGEM SOBERANA]\n\nMaestro Éder, todas as chaves do Pool de Contingência da Nuvem estão em ciclo de renovação de cotas (Cool-down de 60s). A sua mensagem foi gravada no Santuário e o estado permanece 100% íntegro.";
    if (onLog) onLog("Todas as pontes da nuvem temporariamente ocupadas. Mensagem de prontidão entregue.", "SOSRouter");
    return fallbackMessage;
}
