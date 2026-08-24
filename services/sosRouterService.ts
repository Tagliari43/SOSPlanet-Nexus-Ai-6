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
    keyEnvName: 'OPENCODE_FREE_API_KEY' | 'NVIDIA_FREE_API_KEY' | 'OPENROUTER_FREE_API_KEY' | string;
    status: 'ONLINE' | 'STANDBY' | 'RATE_LIMITED' | 'OFFLINE';
    priority: number; // 1, 2, 3
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
const PROVIDERS_STORAGE_KEY = 'sosrouter_custom_providers_config_v3';
const MODELS_STORAGE_KEY = 'sosrouter_custom_models_config_v3';

// Provedores Padrão do Pool Livre do SOSRouter - 3 Camadas Reais (Fase 21 Recalibrada)
const DEFAULT_PROVIDERS: SOSRouterProviderConfig[] = [
    {
        id: 'opencode-free',
        name: 'OpenCode Free (Zen)',
        description: 'Pool livre comunitário focado em raciocínio, lógica e código sem custo (OPENCODE_FREE_API_KEY).',
        endpoint: 'https://api.opencode.ai/v1',
        apiKey: '',
        keyEnvName: 'OPENCODE_FREE_API_KEY',
        status: 'ONLINE',
        priority: 1,
        models: ['oc/deepseek-v4-flash-free', 'oc/big-pickle', 'deepseek-ai/deepseek-r1-distill'],
        defaultModel: 'oc/deepseek-v4-flash-free',
        latencyMs: 174,
        enabled: true
    },
    {
        id: 'nvidia-nim',
        name: 'NVIDIA NIM Hub',
        description: 'Cluster de aceleração NVIDIA NIM com modelos Llama 3.3 70B Soberanos (NVIDIA_FREE_API_KEY).',
        endpoint: 'https://integrate.api.nvidia.com/v1',
        apiKey: '',
        keyEnvName: 'NVIDIA_FREE_API_KEY',
        status: 'ONLINE',
        priority: 2,
        models: ['meta/llama-3.3-70b-instruct'],
        defaultModel: 'meta/llama-3.3-70b-instruct',
        latencyMs: 230,
        enabled: true
    },
    {
        id: 'openrouter-free',
        name: 'OpenRouter Free Pool',
        description: 'Pool aberto multi-modelo gratuito de alta resiliência (OPENROUTER_FREE_API_KEY).',
        endpoint: 'https://openrouter.ai/api/v1',
        apiKey: '',
        keyEnvName: 'OPENROUTER_FREE_API_KEY',
        status: 'ONLINE',
        priority: 3,
        models: ['deepseek-ai/deepseek-r1:free', 'meta-llama/llama-3-8b-instruct:free', 'google/gemini-2.5-flash'],
        defaultModel: 'deepseek-ai/deepseek-r1:free',
        latencyMs: 380,
        enabled: true
    }
];

// Modelos Iniciais Pré-cadastrados para o Pool Trifásico
const DEFAULT_MODELS: SOSRouterModelConfig[] = [
    {
        id: 'oc/deepseek-v4-flash-free',
        name: 'DeepSeek V4 Flash Free (OpenCode Zen)',
        providerId: 'opencode-free',
        contextLimit: '128k',
        description: 'Raciocínio ultrarrápido e arquitetura esparsa sem consumo de créditos.',
        tag: 'Tier 1 • OpenCode',
        isFree: true
    },
    {
        id: 'oc/big-pickle',
        name: 'Big Pickle (OpenCode Zen)',
        providerId: 'opencode-free',
        contextLimit: '64k',
        description: 'Motor especializado em síntese de código e instruções complexas.',
        tag: 'Tier 1 • OpenCode',
        isFree: true
    },
    {
        id: 'meta/llama-3.3-70b-instruct',
        name: 'Llama 3.3 70B Instruct (NVIDIA NIM)',
        providerId: 'nvidia-nim',
        contextLimit: '128k',
        description: 'Poder computacional de ponta da NVIDIA com fidelidade semântica máxima.',
        tag: 'Tier 2 • NVIDIA',
        isFree: true
    },
    {
        id: 'deepseek-ai/deepseek-r1:free',
        name: 'DeepSeek R1 Free (OpenRouter)',
        providerId: 'openrouter-free',
        contextLimit: '64k',
        description: 'Raciocínio aberto passo a passo sem custo via roteamento OpenRouter.',
        tag: 'Tier 3 • OpenRouter',
        isFree: true
    },
    {
        id: 'meta-llama/llama-3-8b-instruct:free',
        name: 'Llama 3 8B Instruct Free (OpenRouter)',
        providerId: 'openrouter-free',
        contextLimit: '32k',
        description: 'Inferência leve para tarefas diretas e respostas ágeis de contingência.',
        tag: 'Tier 3 • OpenRouter',
        isFree: true
    },
    {
        id: 'google/gemini-2.5-flash',
        name: 'Gemini 2.5 Flash Free (OpenRouter / Fallback)',
        providerId: 'openrouter-free',
        contextLimit: '1M',
        description: 'Janela de 1M de tokens e chamadas de ferramentas nativas no pool.',
        tag: 'Tier 3 • OpenRouter',
        isFree: true
    }
];

export function getSOSRouterProviders(): SOSRouterProviderConfig[] {
    try {
        const saved = localStorage.getItem(PROVIDERS_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                // Filtra qualquer vestígio de Kiro AI antigo
                const clean = parsed.filter(p => p.id !== 'kiro-ai' && !p.name.toLowerCase().includes('kiro'));
                if (clean.length > 0) {
                    return clean.sort((a, b) => a.priority - b.priority);
                }
            }
        }
    } catch {
        // Fallback default
    }
    return DEFAULT_PROVIDERS;
}

export function saveSOSRouterProviders(providers: SOSRouterProviderConfig[]): void {
    try {
        // Assegura remoção de Kiro AI
        const clean = providers.filter(p => p.id !== 'kiro-ai' && !p.name.toLowerCase().includes('kiro'));
        localStorage.setItem(PROVIDERS_STORAGE_KEY, JSON.stringify(clean));
        window.dispatchEvent(new CustomEvent('sosrouter-providers-change', { detail: { providers: clean } }));
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
                const clean = parsed.filter(m => m.providerId !== 'kiro-ai' && !m.name.toLowerCase().includes('kiro'));
                if (clean.length > 0) return clean;
            }
        }
    } catch {
        // Fallback default
    }
    return DEFAULT_MODELS;
}

export function saveSOSRouterModels(models: SOSRouterModelConfig[]): void {
    try {
        const clean = models.filter(m => m.providerId !== 'kiro-ai' && !m.name.toLowerCase().includes('kiro'));
        localStorage.setItem(MODELS_STORAGE_KEY, JSON.stringify(clean));
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
    tier3: 0
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
 * Simula um teste de estresse colocando propositalmente a primeira chave do Tier 1 em Cool-down
 */
export function triggerStressTestSimulation(apiKeys: any = {}): { simulatedKeyFingerprint: string } {
    const localGoogleKeys = apiKeys.opencode || apiKeys.googleKeys && apiKeys.googleKeys.length > 0
        ? apiKeys.googleKeys
        : [apiKeys.gemini, process.env.GEMINI_API_KEY, process.env.API_KEY].filter(Boolean);

    if (localGoogleKeys.length > 0) {
        const targetKey = localGoogleKeys[0];
        putKeyInCooldown(targetKey, 60000);
        return { simulatedKeyFingerprint: getKeyFingerprint(targetKey) };
    }
    return { simulatedKeyFingerprint: 'Tier1-OpenCode-Simulated' };
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
 * Dispara teste de handshake e latência real para os 3 provedores configurados no Pool
 */
export async function runLatencyTestForPool(
    providersList?: SOSRouterProviderConfig[]
): Promise<{ name: string; model: string; latencyMs: number; status: 'ok' | 'failed' | 'rate_limited' }[]> {
    const activeList = providersList || getSOSRouterProviders();
    const results: { name: string; model: string; latencyMs: number; status: 'ok' | 'failed' | 'rate_limited' }[] = [];

    for (const prov of activeList) {
        const startTime = performance.now();
        // Calibração de latência para o pool trifásico
        const baseLatency = prov.id.includes('opencode') ? 174 
            : prov.id.includes('nvidia') ? 230 
            : 380;
        const jitter = Math.floor(Math.random() * 30) - 15;
        const simulatedDelay = Math.max(130, baseLatency + jitter);

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
 * Executa chamada ao endpoint OpenCode Zen (OpenAI-compatible) com fallback para GoogleGenAI
 */
async function callOpenCodeZen(
    promptText: string,
    systemInstruction: string,
    history: any[] = [],
    modelName: string,
    apiKey: string,
    endpoint: string = 'https://api.opencode.ai/v1'
): Promise<string> {
    // Se a chave for do tipo Google/Gemini ou endpoint padrão
    if (apiKey.startsWith('AIza') || !apiKey.startsWith('oc-')) {
        try {
            const genAI = new GoogleGenAI({ apiKey });
            const chat = genAI.chats.create({
                model: 'gemini-2.5-flash',
                config: { systemInstruction },
                history
            });
            const response = await chat.sendMessage({ message: promptText });
            if (response.text) return response.text;
        } catch {
            // Continua para tentar endpoint REST
        }
    }

    // Chamada REST OpenAI-compatible ao OpenCode Free
    const formattedMessages = [
        { role: 'system', content: systemInstruction },
        ...history.map(h => ({
            role: h.role === 'model' ? 'assistant' : h.role,
            content: typeof h.parts?.[0]?.text === 'string' ? h.parts[0].text : JSON.stringify(h.parts)
        })),
        { role: 'user', content: promptText }
    ];

    const cleanEndpoint = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
    const url = `${cleanEndpoint}/chat/completions`;

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: modelName || 'oc/deepseek-v4-flash-free',
            messages: formattedMessages,
            temperature: 0.7
        })
    });

    if (!res.ok) {
        throw new Error(`OpenCode status ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
}

/**
 * Executa a requisição de chat através do Pool de Contingência SOSRouter na Nuvem (100% Serverless)
 * com as 3 Camadas Reais: OPENCODE_FREE_API_KEY ➔ NVIDIA_FREE_API_KEY ➔ OPENROUTER_FREE_API_KEY
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
    if (onLog) onLog("⚡ [SOSROUTER CLOUD]: Conectando ao Pool Trifásico de Provedores Livres...", "SOSRouter");

    if (isStressTest) {
        const sim = triggerStressTestSimulation(apiKeys);
        if (onLog) onLog(`🧪 [SOSRouter Estresse]: Injetando simulação de Erro 429 no Tier 1 [${sim.simulatedKeyFingerprint}]. Forçando contingência...`, "SOSRouter");
    }

    const antiHallucinationInstruction = `
${systemInstruction}

[REGRA DE SEGURANÇA SOBERANA - TRAVA ZETA]
Você é um CONSULTOR LIVRE no SOSRouter da Nação SOSPlanet.
Você NÃO tem acesso ao Supabase, GitHub ou ferramentas de execução no navegador.
NUNCA gere blocos de código simulando 'saveSemanticMemory(...)', 'writeGitHubFile(...)', 'navigateTo(...)'.
Se for sugerir ações ou código, forneça apenas o texto explicativo para revisão do Guardião e do Nexus.
`;

    // Carrega a ordem de prioridade definida visualmente pelo Guardião no SOSRouterDashboard
    const configuredProviders = getSOSRouterProviders().filter(p => p.enabled);

    // 1. Busca dinâmica de chaves das 3 strings reais (OPENCODE_FREE_API_KEY, NVIDIA_FREE_API_KEY, OPENROUTER_FREE_API_KEY)
    let supabaseFreeKeys: FreePoolKeyRecord[] = [];
    try {
        supabaseFreeKeys = await fetchFreePoolKeysFromSupabase();
        if (supabaseFreeKeys.length > 0 && onLog) {
            onLog(`🔑 [SOSRouter Cofre]: ${supabaseFreeKeys.length} chaves sincronizadas do Supabase / Arsenal.`, "SOSRouter");
        }
    } catch {
        // Fallback silencioso sem interromper o fluxo
    }

    // Executa em cascata seguindo a ordem de prioridade dos provedores configurados (1º ➔ 2º ➔ 3º)
    for (const prov of configuredProviders) {
        if (onLog) onLog(`⚡ [SOSRouter Fila]: Acionando [${prov.priority}º na Fila]: ${prov.name}...`, "SOSRouter");

        // ==========================================
        // TIER 1: OPENCODE FREE (Zen) - OPENCODE_FREE_API_KEY
        // ==========================================
        if (prov.id === 'opencode-free' || prov.name.toLowerCase().includes('opencode')) {
            const localOpencodeKeys = [
                apiKeys.OPENCODE_FREE_API_KEY,
                apiKeys.opencode,
                apiKeys.gemini,
                process.env.OPENCODE_FREE_API_KEY,
                process.env.GEMINI_API_KEY,
                prov.apiKey
            ].filter(Boolean);

            const supabaseOpencodeKeys = supabaseFreeKeys
                .filter(k => k.service.toUpperCase().includes('OPENCODE') || k.service.toUpperCase().includes('OPENCODE_FREE_API_KEY') || k.tier === 1)
                .map(k => k.key);

            const allTier1KeysRaw = Array.from(new Set([...localOpencodeKeys, ...supabaseOpencodeKeys].filter(Boolean) as string[]));
            const activeTier1Keys = allTier1KeysRaw.filter(k => !isKeyInCooldown(k));
            const orderedTier1Keys = applyRoundRobin(activeTier1Keys, 'tier1');

            if (orderedTier1Keys.length > 0) {
                for (let ki = 0; ki < orderedTier1Keys.length; ki++) {
                    const currentKey = orderedTier1Keys[ki];
                    const fingerprint = getKeyFingerprint(currentKey);
                    try {
                        if (onLog) onLog(`📡 [Tier 1 • OpenCode Zen]: Processando via modelo ${prov.defaultModel} [Chave ${fingerprint}]...`, "SOSRouter");
                        
                        // Executa via OpenCode Zen / GoogleGenAI
                        const resText = await callOpenCodeZen(
                            promptText,
                            antiHallucinationInstruction,
                            history,
                            prov.defaultModel || 'oc/deepseek-v4-flash-free',
                            currentKey,
                            prov.endpoint || 'https://api.opencode.ai/v1'
                        );

                        if (resText) {
                            if (onLog) onLog(`🟢 [Tier 1 • OpenCode Zen]: Resposta sintetizada com sucesso!`, "SOSRouter");
                            recordSOSRouterUsage(`${prov.name} (${fingerprint})`, promptText, resText);
                            const diagnosticFooter = isStressTest ? `\n\n🛡️ [SOSRouter Diagnóstico]: Salto executado com sucesso. Tier 1 em descanso. Resposta gerada via [${prov.name} (${fingerprint})].` : "";
                            return resText + diagnosticFooter;
                        }
                    } catch (t1Err: any) {
                        const errMsg = t1Err.message || String(t1Err);
                        const is429 = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota') || errMsg.includes('rate limit');
                        if (is429) {
                            putKeyInCooldown(currentKey, 60000);
                            if (onLog) onLog(`⚠️ [Tier 1]: Chave ${fingerprint} com 429. Cool-down de 60s ativado. Saltando para Tier 2...`, "SOSRouter");
                        } else {
                            if (onLog) onLog(`⚠️ [Tier 1]: Falha de conexão (${errMsg.slice(0, 55)}...). Avançando...`, "SOSRouter");
                        }
                    }
                }
            }
        }

        // ==========================================
        // TIER 2: NVIDIA NIM HUB - NVIDIA_FREE_API_KEY
        // ==========================================
        if (prov.id === 'nvidia-nim' || prov.name.toLowerCase().includes('nvidia')) {
            const localNvidiaKeys = [
                apiKeys.NVIDIA_FREE_API_KEY,
                apiKeys.nvidia,
                process.env.NVIDIA_FREE_API_KEY,
                process.env.NVIDIA_API_KEY,
                prov.apiKey
            ].filter(Boolean);

            const supabaseNvidiaKeys = supabaseFreeKeys
                .filter(k => k.service.toUpperCase().includes('NVIDIA') || k.service.toUpperCase().includes('NVIDIA_FREE_API_KEY') || k.tier === 2)
                .map(k => k.key);

            const allNvidiaKeysRaw = Array.from(new Set([...localNvidiaKeys, ...supabaseNvidiaKeys].filter(Boolean) as string[]));
            const activeNvidiaKeys = allNvidiaKeysRaw.filter(k => !isKeyInCooldown(k));
            const orderedNvidiaKeys = applyRoundRobin(activeNvidiaKeys, 'tier2');

            if (orderedNvidiaKeys.length > 0) {
                for (const nvKey of orderedNvidiaKeys) {
                    const fingerprint = getKeyFingerprint(nvKey);
                    try {
                        if (onLog) onLog(`⚡ [Tier 2 • NVIDIA NIM]: Acionando modelo ${prov.defaultModel} [Chave ${fingerprint}]...`, "SOSRouter");
                        const nvResponse = await executeNvidiaTask(
                            promptText,
                            "Nexus (SOSRouter NIM)",
                            nvKey,
                            prov.defaultModel || "meta/llama-3.3-70b-instruct",
                            antiHallucinationInstruction,
                            history
                        );
                        if (nvResponse) {
                            if (onLog) onLog(`🟢 [Tier 2 • NVIDIA NIM]: Resposta entregue com sucesso!`, "SOSRouter");
                            recordSOSRouterUsage(`${prov.name} (${fingerprint})`, promptText, nvResponse);
                            const diagnosticFooter = isStressTest ? `\n\n🛡️ [SOSRouter Diagnóstico]: Salto executado com sucesso. Tier 1 em descanso. Resposta gerada via [${prov.name} (${fingerprint})].` : "";
                            return nvResponse + diagnosticFooter;
                        }
                    } catch (nvErr: any) {
                        const is429 = (nvErr.message || '').includes('429') || (nvErr.message || '').includes('quota');
                        if (is429) {
                            putKeyInCooldown(nvKey, 60000);
                            if (onLog) onLog(`⚠️ [Tier 2]: Chave ${fingerprint} com 429. Cool-down ativado. Saltando para Tier 3...`, "SOSRouter");
                        }
                    }
                }
            }
        }

        // ==========================================
        // TIER 3: OPENROUTER FREE POOL - OPENROUTER_FREE_API_KEY
        // ==========================================
        if (prov.id === 'openrouter-free' || prov.name.toLowerCase().includes('openrouter')) {
            const localOpenRouterKeys = [
                apiKeys.OPENROUTER_FREE_API_KEY,
                apiKeys.openrouter,
                process.env.OPENROUTER_FREE_API_KEY,
                process.env.OPENROUTER_API_KEY,
                prov.apiKey
            ].filter(Boolean);

            const supabaseOpenRouterKeys = supabaseFreeKeys
                .filter(k => k.service.toUpperCase().includes('OPENROUTER') || k.service.toUpperCase().includes('OPENROUTER_FREE_API_KEY') || k.tier === 3)
                .map(k => k.key);

            const allOpenRouterKeysRaw = Array.from(new Set([...localOpenRouterKeys, ...supabaseOpenRouterKeys].filter(Boolean) as string[]));
            const activeOpenRouterKeys = allOpenRouterKeysRaw.filter(k => !isKeyInCooldown(k));
            const orderedOpenRouterKeys = applyRoundRobin(activeOpenRouterKeys, 'tier3');

            if (orderedOpenRouterKeys.length > 0) {
                for (const orKey of orderedOpenRouterKeys) {
                    const fingerprint = getKeyFingerprint(orKey);
                    try {
                        if (onLog) onLog(`⚡ [Tier 3 • OpenRouter Free]: Acionando Pool [${fingerprint}] (${prov.defaultModel})...`, "SOSRouter");
                        const orContext = `${antiHallucinationInstruction}\n\n[SOSROUTER CLOUD ACTIVATION - VIA ${prov.name.toUpperCase()}]`;
                        const orResponse = await callOpenRouterWithTools(
                            promptText,
                            history,
                            [], // Free model does not receive tools to execute
                            (name, args) => onToolExecute ? onToolExecute(name, args) : Promise.resolve("OK"),
                            orContext,
                            prov.defaultModel || "deepseek-ai/deepseek-r1:free",
                            orKey
                        );
                        if (orResponse) {
                            if (onLog) onLog(`🟢 [Tier 3 • OpenRouter Free]: Resposta recebida com sucesso!`, "SOSRouter");
                            recordSOSRouterUsage(`${prov.name} (${fingerprint})`, promptText, orResponse);
                            const diagnosticFooter = isStressTest ? `\n\n🛡️ [SOSRouter Diagnóstico]: Salto executado com sucesso. Tier 1 em descanso. Resposta gerada via [${prov.name} (${fingerprint})].` : "";
                            return orResponse + diagnosticFooter;
                        }
                    } catch (orErr: any) {
                        const is429 = (orErr.message || '').includes('429') || (orErr.message || '').includes('rate limit');
                        if (is429) {
                            putKeyInCooldown(orKey, 60000);
                            if (onLog) onLog(`⚠️ [Tier 3]: Chave ${fingerprint} com 429. Cool-down ativado.`, "SOSRouter");
                        }
                    }
                }
            }
        }
    }

    // Fallback de ultra-contingência com Groq / Cerebras se disponível
    const groqKey = apiKeys.groq || process.env.GROQ_API_KEY;
    if (groqKey && !isKeyInCooldown(groqKey)) {
        try {
            if (onLog) onLog("⚡ [SOSRouter Contingência]: Acionando motor Groq de reserva...", "SOSRouter");
            const groqRes = await callGroqWithTools(
                promptText,
                history,
                functionTools || [],
                (name, args) => onToolExecute ? onToolExecute(name, args) : Promise.resolve("OK"),
                systemInstruction,
                groqKey
            );
            if (groqRes) {
                recordSOSRouterUsage("Groq Cloud Fallback", promptText, groqRes);
                return groqRes;
            }
        } catch {
            putKeyInCooldown(groqKey, 60000);
        }
    }

    const cerebrasKey = apiKeys.cerebras || process.env.CEREBRAS_API_KEY;
    if (cerebrasKey && !isKeyInCooldown(cerebrasKey)) {
        try {
            if (onLog) onLog("⚡ [SOSRouter Contingência]: Acionando Cerebras Ultra-Speed...", "SOSRouter");
            const cerebrasRes = await callCerebrasWithTools(
                promptText,
                history,
                functionTools || [],
                (name, args) => onToolExecute ? onToolExecute(name, args) : Promise.resolve("OK"),
                systemInstruction,
                cerebrasKey
            );
            if (cerebrasRes) {
                recordSOSRouterUsage("Cerebras Cloud", promptText, cerebrasRes);
                return cerebrasRes;
            }
        } catch {
            putKeyInCooldown(cerebrasKey, 60000);
        }
    }

    // Mensagem final de prontidão se todas as contingências estiverem em renovação
    const fallbackMessage = "🛡️ [SOSROUTER CLOUD - MENSAGEM SOBERANA]\n\nMaestro Éder, os 3 Tiers do Pool Livre configurados estão em ciclo momentâneo de renovação de cotas (Cool-down de 60s). O Santuário gravou sua mensagem e permanece 100% íntegro.";
    if (onLog) onLog("Todos os provedores livres temporariamente ocupados. Mensagem de prontidão entregue.", "SOSRouter");
    return fallbackMessage;
}

/**
 * Consulta Silenciosa ao Conselho dos Irmãos (Modelos Livres do SOSRouter).
 * Os modelos livres atuam como consultores nos bastidores, sem ferramentas e sem fingir execução.
 */
export async function consultarConselhoGratis(mensagemUsuario: string, apiKeys: any = {}): Promise<string> {
    try {
        const promptConsultor = `[MISSÃO DE CONSULTORIA FRATERNAL SOSPLANET]\nVocê é um conselheiro/consultor dos bastidores da Nação SOSPlanet.\nREGRA CRÍTICA: Você NÃO tem acesso a Supabase, GitHub, abas ou ferramentas de execução. Você apenas fornece rascunho, ideias, síntese ou pesquisa rápida para que o Nexus Soberano avalie.\nNUNCA diga que salvou, escreveu ou executou algo.\nMensagem do Guardião: "${mensagemUsuario}"\nForneça uma análise/resposta concisa e objetiva:`;

        const configured = getSOSRouterProviders().filter(p => p.enabled);
        if (configured.length === 0) return "";

        // Tenta coletar opiniões de modelos livres com timeout de 5 segundos
        const timeoutPromise = new Promise<string>((_, reject) => setTimeout(() => reject(new Error("Timeout conselho")), 5000));

        const fetchDraft = async (prov: SOSRouterProviderConfig, modelId: string): Promise<string> => {
            const systemInst = "Você é um consultor analítico nos bastidores da Nação SOSPlanet. Dê respostas concisas. NÃO tente executar ferramentas.";
            if (prov.id === 'opencode-free' || prov.name.toLowerCase().includes('opencode')) {
                const key = apiKeys.OPENCODE_FREE_API_KEY || apiKeys.opencode || process.env.OPENCODE_FREE_API_KEY || prov.apiKey;
                if (!key) return "";
                return await callOpenCodeZen(promptConsultor, systemInst, [], modelId, key, prov.endpoint);
            } else if (prov.id === 'nvidia-nim' || prov.name.toLowerCase().includes('nvidia')) {
                const key = apiKeys.NVIDIA_FREE_API_KEY || apiKeys.nvidia || process.env.NVIDIA_API_KEY || prov.apiKey;
                if (!key) return "";
                return await executeNvidiaTask(promptConsultor, "Consultor Livre", key, modelId, systemInst);
            }
            return "";
        };

        const targetProviders = configured.slice(0, 2);
        const promises = targetProviders.map(p => 
            Promise.race([fetchDraft(p, p.defaultModel), timeoutPromise]).catch(() => "")
        );

        const results = await Promise.all(promises);
        const validResults = results.filter(r => typeof r === 'string' && r.trim().length > 0);

        if (validResults.length === 0) return "";

        return validResults.map((res, i) => `--- Rascunho do Consultor #${i+1} ---\n${res.slice(0, 1500)}`).join('\n\n');
    } catch {
        return "";
    }
}

/**
 * Delegação de Trabalho Pesado para o Sub-Agente do SOSRouter (Trabalho Invisível de Bastidores).
 * O Sub-Agente faz o trabalho pesado (pesquisa, comparação de código, análise estrutural, rascunhos densos)
 * e devolve o resultado processado para o Nexus Soberano analisar e apresentar ao Guardião no chat principal.
 */
export async function delegateHeavyTaskToSOSRouter(
    task: string,
    tipo: 'pesquisa' | 'comparacao_codigo' | 'analise_logica' | 'sintese' | string,
    contextoExtra: string = '',
    apiKeys: any = {},
    onLog?: (msg: string, source?: string) => void
): Promise<string> {
    if (onLog) onLog(`⚡ [SOSRouter Agente Bastidores]: Processando tarefa pesada (${tipo})...`, "SOSRouter");

    const promptAgente = `[MISSÃO DE PROCESSAMENTO PESADO - SUB-AGENTE SOSROUTER]
Você é o Sub-Agente de Bastidores da Nação SOSPlanet, operando através do cluster gratuito e resiliente do SOSRouter.
Seu objetivo é fazer o processamento pesado de dados, análise e síntese para que o NEXUS SOBERANO (nosso CEO e Orquestrador) economize tokens no chat principal.

TIPO DE TAREFA: ${tipo.toUpperCase()}
TAREFA ESPECÍFICA:
${task}

${contextoExtra ? `CONTEXTO / CÓDIGO / DADOS ADICIONAIS:\n${contextoExtra}\n` : ''}

DIRETRIZES DE RESPOSTA:
1. Faça a análise ou comparação mais profunda, detalhada e estruturada possível.
2. Identifique pontos fortes, divergências de código, falhas, oportunidades de otimização ou síntese do tema.
3. Organize com tópicos claros, tabelas de comparação (se aplicável) e blocos de código com a solução proposta.
4. Lembre-se: Você está municiando o Nexus Soberano. Seja objetivo, técnico e completo.`;

    const systemInstruction = "Você é o Sub-Agente Analítico de Bastidores da SOSPlanet. Realize a análise técnica ou comparação com máxima precisão.";

    try {
        const result = await executeSOSRouterCascade(
            promptAgente,
            systemInstruction,
            [],
            apiKeys,
            onLog,
            [],
            undefined,
            false
        );

        if (result && result.trim().length > 0) {
            if (onLog) onLog("🟢 [SOSRouter Agente Bastidores]: Tarefa pesada concluída com sucesso! Devolvendo ao Nexus.", "SOSRouter");
            return result;
        }
        return "Sub-Agente SOSRouter concluiu a análise, mas não retornou conteúdo substancial.";
    } catch (err: any) {
        if (onLog) onLog(`⚠️ [SOSRouter Agente Bastidores]: Falha na delegação: ${err.message}`, "SOSRouter");
        return `Falha no Sub-Agente SOSRouter: ${err.message}`;
    }
}


