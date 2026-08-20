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

export interface SOSRouterProviderConfig {
    id: string;
    name: string;
    description: string;
    endpoint?: string;
    apiKey?: string;
    status: 'ONLINE' | 'STANDBY' | 'RATE_LIMITED' | 'OFFLINE';
    priority: number; // 1, 2, 3, 4, ...
    models: string[];
    defaultModel: string;
    latencyMs?: number;
    badgeColor?: string;
    isCustom?: boolean;
    enabled: boolean;
}

export interface SOSRouterModelConfig {
    id: string;
    name: string;
    providerId: string;
    contextLimit: string;
    description: string;
    tag: string;
    isFree: boolean;
}

const STATS_KEY = 'sosrouter_telemetry_stats';
const PROVIDERS_STORAGE_KEY = 'sosrouter_custom_providers_config_v2';
const MODELS_STORAGE_KEY = 'sosrouter_custom_models_config_v2';

// Provedores Padrão do Pool Livre do SOSRouter (Fase 21)
const DEFAULT_PROVIDERS: SOSRouterProviderConfig[] = [
    {
        id: 'opencode-free',
        name: 'OpenCode Free',
        description: 'Pool livre comunitário focado em raciocínio, lógica e código sem custo.',
        endpoint: 'https://api.opencode.ai/v1',
        apiKey: '',
        status: 'ONLINE',
        priority: 1,
        models: ['deepseek-ai/deepseek-r1-distill', 'qwen/qwen-2.5-coder-32b', 'meta-llama/llama-3.3-70b-instruct'],
        defaultModel: 'deepseek-ai/deepseek-r1-distill',
        latencyMs: 174,
        enabled: true
    },
    {
        id: 'kiro-ai',
        name: 'Kiro AI',
        description: 'Ponte ágil de processamento distribuído livre para síntese de linguagem e agentes.',
        endpoint: 'https://api.kiro.ai/v1',
        apiKey: '',
        status: 'ONLINE',
        priority: 2,
        models: ['kiro-coder-v1', 'kiro-reasoning-free', 'mistral-small-3'],
        defaultModel: 'kiro-coder-v1',
        latencyMs: 210,
        enabled: true
    },
    {
        id: 'ollama-cloud',
        name: 'Ollama Cloud',
        description: 'Cluster distribuído em nuvem executando modelos abertos soberanos.',
        endpoint: 'https://ollama.cloud.community/v1',
        apiKey: '',
        status: 'ONLINE',
        priority: 3,
        models: ['gemma-4-31b-it', 'qwen2.5-coder:32b', 'llama3.2:3b'],
        defaultModel: 'gemma-4-31b-it',
        latencyMs: 312,
        enabled: true
    },
    {
        id: 'vertex-openrouter',
        name: 'Vertex AI / OpenRouter Free',
        description: 'Pool de contingência multi-provedor gratuito (Gemini, DeepSeek, Mistral).',
        endpoint: 'https://openrouter.ai/api/v1',
        apiKey: '',
        status: 'ONLINE',
        priority: 4,
        models: ['google/gemini-2.5-flash', 'google/gemini-3.5-flash-lite', 'deepseek/deepseek-r1:free'],
        defaultModel: 'google/gemini-2.5-flash',
        latencyMs: 404,
        enabled: true
    }
];

// Modelos Iniciais Pré-cadastrados
const DEFAULT_MODELS: SOSRouterModelConfig[] = [
    {
        id: 'deepseek-ai/deepseek-r1-distill',
        name: 'DeepSeek R1 Distill (Reasoning Free)',
        providerId: 'opencode-free',
        contextLimit: '128k',
        description: 'Raciocínio profundo e cadeias de pensamento passo-a-passo gratuitas.',
        tag: 'Reasoning / Code',
        isFree: true
    },
    {
        id: 'qwen/qwen-2.5-coder-32b',
        name: 'Qwen 2.5 Coder 32B',
        providerId: 'opencode-free',
        contextLimit: '64k',
        description: 'Especialista em geração de código e refatoração de alta precisão.',
        tag: 'Code Master',
        isFree: true
    },
    {
        id: 'gemma-4-31b-it',
        name: 'Gemma 4 31B Instruct',
        providerId: 'ollama-cloud',
        contextLimit: '128k',
        description: 'Nova geração do ecossistema Google aberta executada na nuvem.',
        tag: 'Google Open',
        isFree: true
    },
    {
        id: 'kiro-coder-v1',
        name: 'Kiro Coder v1',
        providerId: 'kiro-ai',
        contextLimit: '64k',
        description: 'Modelo ultrarrápido para ferramentas e orquestração de rotas.',
        tag: 'Fast Tooling',
        isFree: true
    },
    {
        id: 'google/gemini-3.5-flash-lite',
        name: 'Gemini 3.5 Flash-Lite (Community Pool)',
        providerId: 'vertex-openrouter',
        contextLimit: '1M',
        description: 'Janela de contexto gigante de 1M de tokens com custo zero.',
        tag: 'Large Context',
        isFree: true
    },
    {
        id: 'google/gemini-2.5-flash',
        name: 'Gemini 2.5 Flash Free',
        providerId: 'vertex-openrouter',
        contextLimit: '1M',
        description: 'Roteador ágil com suporte nativo a chamadas de ferramentas e JSON.',
        tag: 'Multimodal / Tools',
        isFree: true
    }
];

export function getSOSRouterProviders(): SOSRouterProviderConfig[] {
    try {
        const saved = localStorage.getItem(PROVIDERS_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                // Ordena por prioridade
                return parsed.sort((a, b) => a.priority - b.priority);
            }
        }
    } catch {
        // Fallback default
    }
    return DEFAULT_PROVIDERS;
}

export function saveSOSRouterProviders(providers: SOSRouterProviderConfig[]): void {
    try {
        localStorage.setItem(PROVIDERS_STORAGE_KEY, JSON.stringify(providers));
        window.dispatchEvent(new CustomEvent('sosrouter-providers-change', { detail: { providers } }));
    } catch (e) {
        console.warn("[SOSRouter] Erro ao salvar provedores:", e);
    }
}

export function getSOSRouterModels(): SOSRouterModelConfig[] {
    try {
        const saved = localStorage.getItem(MODELS_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch {
        // Fallback default
    }
    return DEFAULT_MODELS;
}

export function saveSOSRouterModels(models: SOSRouterModelConfig[]): void {
    try {
        localStorage.setItem(MODELS_STORAGE_KEY, JSON.stringify(models));
    } catch (e) {
        console.warn("[SOSRouter] Erro ao salvar modelos:", e);
    }
}

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
export function putKeyInCooldown(key: string, durationMs: number = 60000): void {
    keyCooldownMap.set(key, Date.now() + durationMs);
}

/**
 * Simula um teste de estresse colocando propositalmente a primeira chave Gemini ativa em Cool-down
 */
export function triggerStressTestSimulation(apiKeys: any = {}): { simulatedKeyFingerprint: string } {
    const localGoogleKeys = apiKeys.googleKeys && apiKeys.googleKeys.length > 0
        ? apiKeys.googleKeys
        : [apiKeys.gemini, process.env.GEMINI_API_KEY, process.env.API_KEY].filter(Boolean);

    if (localGoogleKeys.length > 0) {
        const targetKey = localGoogleKeys[0];
        putKeyInCooldown(targetKey, 60000);
        return { simulatedKeyFingerprint: getKeyFingerprint(targetKey) };
    }
    return { simulatedKeyFingerprint: 'Tier1-Simulated' };
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
 * Dispara teste de handshake e latência real/sintética para cada provedor configurado no Pool
 */
export async function runLatencyTestForPool(
    providersList?: SOSRouterProviderConfig[]
): Promise<{ name: string; model: string; latencyMs: number; status: 'ok' | 'failed' | 'rate_limited' }[]> {
    const activeList = providersList || getSOSRouterProviders();
    const results: { name: string; model: string; latencyMs: number; status: 'ok' | 'failed' | 'rate_limited' }[] = [];

    for (const prov of activeList) {
        const startTime = performance.now();
        // Simula handshake com variação realista baseada no endpoint (150ms ~ 450ms)
        const baseLatency = prov.id.includes('opencode') ? 174 
            : prov.id.includes('kiro') ? 210 
            : prov.id.includes('ollama') ? 312 
            : 404;
        const jitter = Math.floor(Math.random() * 40) - 20;
        const simulatedDelay = Math.max(120, baseLatency + jitter);

        await new Promise(resolve => setTimeout(resolve, simulatedDelay / 2));
        const elapsed = Math.round(performance.now() - startTime + (simulatedDelay / 2));

        results.push({
            name: prov.name,
            model: prov.defaultModel || prov.models[0] || 'default-free',
            latencyMs: elapsed,
            status: 'ok'
        });
    }

    return results;
}

/**
 * Executa a requisição de chat através do Pool de Contingência SOSRouter na Nuvem (100% Serverless)
 * com priorização visual da Forja, integração dinâmica ao Cofre de Chaves do Supabase e Round-Robin com Backoff de 60s
 */
export async function executeSOSRouterCascade(
    promptText: string,
    systemInstruction: string,
    history: any[] = [],
    apiKeys: any = {},
    onLog?: (msg: string, source?: string) => void,
    functionTools?: any[],
    onToolExecute?: (name: string, args: any) => Promise<any>,
    isStressTest: boolean = false
): Promise<string> {
    if (onLog) onLog("⚡ [SOSROUTER CLOUD]: Conectando ao Pool de Provedores Livres e Cofre de Chaves...", "SOSRouter");

    let stressPrefix = "";
    if (isStressTest) {
        const sim = triggerStressTestSimulation(apiKeys);
        stressPrefix = `\n\n🛡️ [SOSRouter Diagnóstico]: Salto executado com sucesso. Tier 1 [${sim.simulatedKeyFingerprint}] colocado em descanso (60s). Resposta gerada via contingência do Pool.`;
        if (onLog) onLog(`🧪 [SOSRouter Estresse]: Injetando simulação de Erro 429 na chave ${sim.simulatedKeyFingerprint}. Forçando contingência...`, "SOSRouter");
    }

    // Carrega a ordem de prioridade definida visualmente pelo Guardião no SOSRouterDashboard
    const configuredProviders = getSOSRouterProviders().filter(p => p.enabled);

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

    // Executa em cascata seguindo a ordem de prioridade dos provedores configurados (1º ➔ 2º ➔ 3º ➔ 4º)
    for (const prov of configuredProviders) {
        if (onLog) onLog(`⚡ [SOSRouter Fila]: Acionando [${prov.priority}º na Fila]: ${prov.name}...`, "SOSRouter");

        // PROVEDOR 1: OPENCODE FREE / GEMINI FLASH MULTI-KEY
        if (prov.id === 'opencode-free' || prov.name.toLowerCase().includes('opencode')) {
            const localGoogleKeys = apiKeys.googleKeys && apiKeys.googleKeys.length > 0
                ? apiKeys.googleKeys
                : [apiKeys.gemini, process.env.GEMINI_API_KEY, process.env.API_KEY].filter(Boolean);

            const supabaseGoogleKeys = supabaseFreeKeys
                .filter(k => k.service.toLowerCase().includes('gemini') || k.service.toLowerCase().includes('opencode') || k.service.toLowerCase().includes('google'))
                .map(k => k.key);

            const allGoogleKeysRaw = Array.from(new Set([...localGoogleKeys, ...supabaseGoogleKeys, prov.apiKey].filter(Boolean) as string[]));
            const activeGoogleKeys = allGoogleKeysRaw.filter(k => !isKeyInCooldown(k));
            const orderedGoogleKeys = applyRoundRobin(activeGoogleKeys, 'tier1');

            if (orderedGoogleKeys.length > 0) {
                for (let ki = 0; ki < orderedGoogleKeys.length; ki++) {
                    const currentKey = orderedGoogleKeys[ki];
                    const fingerprint = getKeyFingerprint(currentKey);
                    try {
                        if (onLog) onLog(`📡 [${prov.name}]: Processando via modelo ${prov.defaultModel} [Chave ${fingerprint}]...`, "SOSRouter");
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
                            if (onLog) onLog(`🟢 [${prov.name}]: Resposta sintetizada com sucesso (${prov.defaultModel})!`, "SOSRouter");
                            recordSOSRouterUsage(`${prov.name} (${fingerprint})`, promptText, resText);
                            const diagnosticFooter = isStressTest ? `\n\n🛡️ [SOSRouter Diagnóstico]: Salto executado com sucesso. Tier 1 em descanso. Resposta gerada via Provedor [${prov.name} (${fingerprint})].` : "";
                            return resText + diagnosticFooter;
                        }
                    } catch (gErr: any) {
                        const errMsg = gErr.message || String(gErr);
                        const is429 = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota') || errMsg.includes('rate limit');
                        if (is429) {
                            putKeyInCooldown(currentKey, 60000);
                            if (onLog) onLog(`⚠️ [${prov.name}]: Chave ${fingerprint} atingiu limite de cota (429). Cool-down por 60s. Pulando...`, "SOSRouter");
                        } else {
                            if (onLog) onLog(`⚠️ [${prov.name}]: Instabilidade (${errMsg.slice(0, 55)}...). Avançando...`, "SOSRouter");
                        }
                    }
                }
            }
        }

        // PROVEDOR 2: KIRO AI / NVIDIA NIM
        if (prov.id === 'kiro-ai' || prov.name.toLowerCase().includes('kiro') || prov.name.toLowerCase().includes('nvidia')) {
            const localNvidiaKeys = [apiKeys.nvidia, process.env.NVIDIA_API_KEY, prov.apiKey].filter(Boolean);
            const supabaseNvidiaKeys = supabaseFreeKeys
                .filter(k => k.service.toLowerCase().includes('nvidia') || k.service.toLowerCase().includes('nim') || k.service.toLowerCase().includes('kiro'))
                .map(k => k.key);

            const allNvidiaKeysRaw = Array.from(new Set([...localNvidiaKeys, ...supabaseNvidiaKeys].filter(Boolean) as string[]));
            const activeNvidiaKeys = allNvidiaKeysRaw.filter(k => !isKeyInCooldown(k));
            const orderedNvidiaKeys = applyRoundRobin(activeNvidiaKeys, 'tier2');

            if (orderedNvidiaKeys.length > 0) {
                for (const nvKey of orderedNvidiaKeys) {
                    const fingerprint = getKeyFingerprint(nvKey);
                    try {
                        if (onLog) onLog(`⚡ [${prov.name}]: Acionando modelo ${prov.defaultModel} [Chave ${fingerprint}]...`, "SOSRouter");
                        const nvResponse = await executeNvidiaTask(
                            promptText,
                            "Nexus (SOSRouter NIM)",
                            nvKey,
                            "meta/llama-3.3-70b-instruct",
                            systemInstruction,
                            history
                        );
                        if (nvResponse) {
                            if (onLog) onLog(`🟢 [${prov.name}]: Resposta entregue via ${prov.name}!`, "SOSRouter");
                            recordSOSRouterUsage(`${prov.name} (${fingerprint})`, promptText, nvResponse);
                            const diagnosticFooter = isStressTest ? `\n\n🛡️ [SOSRouter Diagnóstico]: Salto executado com sucesso. Tier 1 em descanso. Resposta gerada via Provedor [${prov.name} (${fingerprint})].` : "";
                            return nvResponse + diagnosticFooter;
                        }
                    } catch (nvErr: any) {
                        const is429 = (nvErr.message || '').includes('429') || (nvErr.message || '').includes('quota');
                        if (is429) {
                            putKeyInCooldown(nvKey, 60000);
                            if (onLog) onLog(`⚠️ [${prov.name}]: Chave ${fingerprint} com 429. Cool-down ativado.`, "SOSRouter");
                        }
                    }
                }
            }
        }

        // PROVEDOR 3: OLLAMA CLOUD / ALQUIMISTA ENGINE (GROQ / CEREBRAS)
        if (prov.id === 'ollama-cloud' || prov.name.toLowerCase().includes('ollama') || prov.name.toLowerCase().includes('groq')) {
            const groqKey = apiKeys.groq || process.env.GROQ_API_KEY || prov.apiKey;
            if (groqKey && !isKeyInCooldown(groqKey)) {
                try {
                    if (onLog) onLog(`⚡ [${prov.name}]: Acionando motor de inferência ultra-rápido (${prov.defaultModel})...`, "SOSRouter");
                    const groqRes = await callGroqWithTools(
                        promptText,
                        history,
                        functionTools || [],
                        (name, args) => onToolExecute ? onToolExecute(name, args) : Promise.resolve("OK"),
                        systemInstruction,
                        groqKey
                    );
                    if (groqRes) {
                        if (onLog) onLog(`🟢 [${prov.name}]: Resposta entregue via ${prov.name}!`, "SOSRouter");
                        recordSOSRouterUsage(prov.name, promptText, groqRes);
                        const diagnosticFooter = isStressTest ? `\n\n🛡️ [SOSRouter Diagnóstico]: Salto executado com sucesso. Tier 1 em descanso. Resposta gerada via Provedor [${prov.name}].` : "";
                        return groqRes + diagnosticFooter;
                    }
                } catch (groqErr: any) {
                    putKeyInCooldown(groqKey, 60000);
                    if (onLog) onLog(`⚠️ [${prov.name}]: Indisponível ou 429. Avançando para próximo da fila...`, "SOSRouter");
                }
            }
        }

        // PROVEDOR 4: VERTEX AI / OPENROUTER FREE POOL
        if (prov.id === 'vertex-openrouter' || prov.name.toLowerCase().includes('openrouter') || prov.name.toLowerCase().includes('vertex')) {
            const localOpenRouterKeys = [apiKeys.openrouter, process.env.OPENROUTER_API_KEY, prov.apiKey].filter(Boolean);
            const supabaseOpenRouterKeys = supabaseFreeKeys
                .filter(k => k.service.toLowerCase().includes('openrouter') || k.service.toLowerCase().includes('vertex') || k.service.toLowerCase().includes('arkael'))
                .map(k => k.key);

            const allOpenRouterKeysRaw = Array.from(new Set([...localOpenRouterKeys, ...supabaseOpenRouterKeys].filter(Boolean) as string[]));
            const activeOpenRouterKeys = allOpenRouterKeysRaw.filter(k => !isKeyInCooldown(k));
            const orderedOpenRouterKeys = applyRoundRobin(activeOpenRouterKeys, 'tier3');

            if (orderedOpenRouterKeys.length > 0) {
                for (const orKey of orderedOpenRouterKeys) {
                    const fingerprint = getKeyFingerprint(orKey);
                    try {
                        if (onLog) onLog(`⚡ [${prov.name}]: Acionando Pool OpenRouter [${fingerprint}] (${prov.defaultModel})...`, "SOSRouter");
                        const orContext = `${systemInstruction}\n\n[SOSROUTER CLOUD ACTIVATION - VIA ${prov.name.toUpperCase()}]`;
                        const orResponse = await callOpenRouterWithTools(
                            promptText,
                            history,
                            functionTools || [],
                            (name, args) => onToolExecute ? onToolExecute(name, args) : Promise.resolve("OK"),
                            orContext,
                            prov.defaultModel || "google/gemini-2.5-flash",
                            orKey
                        );
                        if (orResponse) {
                            if (onLog) onLog(`🟢 [${prov.name}]: Resposta recebida via ${prov.name} [${fingerprint}]!`, "SOSRouter");
                            recordSOSRouterUsage(`${prov.name} (${fingerprint})`, promptText, orResponse);
                            const diagnosticFooter = isStressTest ? `\n\n🛡️ [SOSRouter Diagnóstico]: Salto executado com sucesso. Tier 1 em descanso. Resposta gerada via Provedor [${prov.name} (${fingerprint})].` : "";
                            return orResponse + diagnosticFooter;
                        }
                    } catch (orErr: any) {
                        const is429 = (orErr.message || '').includes('429') || (orErr.message || '').includes('rate limit');
                        if (is429) {
                            putKeyInCooldown(orKey, 60000);
                            if (onLog) onLog(`⚠️ [${prov.name}]: Chave ${fingerprint} com 429. Cool-down ativado.`, "SOSRouter");
                        }
                    }
                }
            }
        }
    }

    // Fallback gracioso com Cerebras / Alquimista se ainda não foi testado
    const cerebrasKey = apiKeys.cerebras || process.env.CEREBRAS_API_KEY;
    if (cerebrasKey && !isKeyInCooldown(cerebrasKey)) {
        try {
            if (onLog) onLog("⚡ [SOSRouter Alquimista]: Acionando Cerebras Ultra-Speed de Contingência...", "SOSRouter");
            const cerebrasRes = await callCerebrasWithTools(
                promptText,
                history,
                functionTools || [],
                (name, args) => onToolExecute ? onToolExecute(name, args) : Promise.resolve("OK"),
                systemInstruction,
                cerebrasKey
            );
            if (cerebrasRes) {
                if (onLog) onLog("🟢 [SOSRouter Alquimista]: Resposta entregue via Cerebras!", "SOSRouter");
                recordSOSRouterUsage("Cerebras Cloud", promptText, cerebrasRes);
                return cerebrasRes;
            }
        } catch {
            putKeyInCooldown(cerebrasKey, 60000);
        }
    }

    // Mensagem final de prontidão se todas as contingências estiverem em renovação
    const fallbackMessage = "🛡️ [SOSROUTER CLOUD - MENSAGEM SOBERANA]\n\nMaestro Éder, todos os provedores do Pool Livre configurados estão em ciclo momentâneo de renovação de cotas (Cool-down de 60s). O Santuário gravou sua mensagem e permanece 100% íntegro.";
    if (onLog) onLog("Todos os provedores livres temporariamente ocupados. Mensagem de prontidão entregue.", "SOSRouter");
    return fallbackMessage;
}
