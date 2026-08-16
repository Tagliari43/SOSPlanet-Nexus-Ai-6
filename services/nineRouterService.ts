/**
 * Serviço do Modo Laboratório (9Router Local Proxy)
 * Permite que o Nexus roteie requisições para a porta local http://localhost:20128/v1
 * quando o CMD do Maestro estiver ativo, com FALLBACK 100% SEGURO e transparente.
 */

export function isNineRouterModeEnabled(): boolean {
    return localStorage.getItem('modo_laboratorio_9router') === 'true';
}

export function setNineRouterMode(enabled: boolean): void {
    localStorage.setItem('modo_laboratorio_9router', enabled ? 'true' : 'false');
}

export function getNineRouterKey(): string {
    return (
        localStorage.getItem('9router_key') ||
        localStorage.getItem('VITE_NINEROUTER_KEY') ||
        (import.meta.env.VITE_NINEROUTER_KEY as string) ||
        (import.meta.env.VITE_9ROUTER_KEY as string) ||
        'sk-8effe28f-xif4-8ff9d4' // Chave permanente padrão do 9Remote
    );
}

export function setNineRouterKey(key: string): void {
    localStorage.setItem('9router_key', key.trim());
}

export function getNineRouterUrl(): string {
    return (
        localStorage.getItem('9router_url') ||
        localStorage.getItem('VITE_NINEROUTER_URL') ||
        localStorage.getItem('VITE_NINEROUTERR_URL') ||
        (import.meta.env.VITE_NINEROUTER_URL as string) ||
        (import.meta.env.VITE_NINEROUTERR_URL as string) ||
        (import.meta.env.VITE_9ROUTER_URL as string) ||
        'https://rkjcu2n.abc-tunnel.us/v1'
    );
}

export function setNineRouterUrl(url: string): void {
    localStorage.setItem('9router_url', url.trim());
}

export function getAllCandidateUrls(): string[] {
    const custom = getNineRouterUrl().replace(/\/$/, '');
    const pool = [
        custom,
        'https://rkjcu2n.abc-tunnel.us/v1',
        'https://rkjcu2n.abc-tunnel.us',
        'http://localhost:20128/v1',
        'http://localhost:20128',
        'http://localhost:2208/v1',
        'http://localhost:2208',
        'http://127.0.0.1:20128/v1',
        'http://127.0.0.1:2208/v1'
    ];
    // Remove duplicados vazios ou repetidos
    return Array.from(new Set(pool.filter(Boolean)));
}

export async function checkNineRouterHealth(): Promise<boolean> {
    const candidates = getAllCandidateUrls();
    const key = getNineRouterKey();

    for (const rawUrl of candidates) {
        const url = rawUrl.replace(/\/$/, '');
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            const headers: Record<string, string> = {};
            if (key) {
                headers['Authorization'] = `Bearer ${key}`;
            }

            // Testa /models ou /v1/models dependendo de como a URL termina
            const target = url.endsWith('/v1') ? `${url}/models` : `${url}/v1/models`;
            const res = await fetch(target, {
                method: 'GET',
                headers,
                signal: controller.signal
            }).catch(() => null);

            clearTimeout(timeoutId);
            if (res && (res.ok || res.status === 200 || res.status === 401 || res.status === 404)) {
                return true;
            }
        } catch {
            // Continua para o próximo candidato
        }
    }
    return false;
}

export async function callNineRouter(
    prompt: string, 
    systemInstruction?: string,
    onLog?: (msg: string, source?: string) => void
): Promise<string | null> {
    if (!isNineRouterModeEnabled()) {
        return null; // Modo Laboratório desligado
    }

    const key = getNineRouterKey();
    const candidateUrls = getAllCandidateUrls();

    // Modelos ativos no 9Router:
    // 1. Combo customizado nexus-soberano (orquestrado no 9Router)
    // 2. OpenCode Free (Modelos livres ilimitados)
    // 3. Gemini (Chave Nexus 2 dedicada)
    const candidateModels = [
        'nexus-soberano',
        'oc/deepseek-v4-flash-free',
        'oc/nemotron-3.5-lightning-free',
        'oc/nemotron-3-ultra-free',
        'oc/mimo-v2.5-free',
        'oc/hy3-free',
        'oc/big-pickle',
        'oc/laguna-s-2.1-free',
        'gemini/gemini-3.6-flash',
        'gemini/gemini-3.5-flash-lite',
        'gemini/gemini-3.1-flash-lite-preview',
        'gemini/gemini-3-flash-preview',
        'gemini/gemma-4-31b-it'
    ];

    for (const rawUrl of candidateUrls) {
        const cleanBase = rawUrl.replace(/\/$/, '');
        const targetEndpoint = cleanBase.endsWith('/v1') 
            ? `${cleanBase}/chat/completions` 
            : `${cleanBase}/v1/chat/completions`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        if (key) {
            headers['Authorization'] = `Bearer ${key}`;
        }

        for (const modelName of candidateModels) {
            try {
                if (onLog) onLog(`9Router [${cleanBase}] testando ${modelName}...`, "9ROUTER");
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 12000);

                const response = await fetch(targetEndpoint, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        model: modelName,
                        messages: [
                            ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
                            { role: 'user', content: prompt }
                        ],
                        temperature: 0.7
                    }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    const content = data.choices?.[0]?.message?.content;
                    if (content && content.trim().length > 0) {
                        if (onLog) onLog(`✅ 9Router respondeu com sucesso via ${modelName}!`, "9ROUTER");
                        return `⚡ [MODO LABORATÓRIO - 9ROUTER / ${modelName.toUpperCase()}]:\n\n${content}`;
                    }
                } else {
                    const errText = await response.text().catch(() => '');
                    console.warn(`[9ROUTER] (${modelName} @ ${cleanBase}): HTTP ${response.status}`, errText);
                    if (onLog) onLog(`9Router (${modelName}) retornou HTTP ${response.status}. Tentando rota seguinte...`, "9ROUTER");
                    if (response.status === 404 || response.status === 429 || response.status === 400 || response.status === 401 || response.status === 500) continue;
                }
            } catch (error: any) {
                console.warn(`[9ROUTER] Tentativa em ${cleanBase} (${modelName}) erro:`, error?.message || error);
                if (onLog) onLog(`9Router [${cleanBase}] (${modelName}) falha de conexão.`, "9ROUTER");
            }
        }
    }

    console.warn('[9ROUTER] Nenhuma rota do 9Router respondeu com sucesso.');
    return null;
}
