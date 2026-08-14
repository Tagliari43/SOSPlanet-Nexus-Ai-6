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
        (import.meta.env.VITE_NINEROUTER_KEY as string) ||
        (import.meta.env.VITE_9ROUTER_KEY as string) ||
        ''
    );
}

export function setNineRouterKey(key: string): void {
    localStorage.setItem('9router_key', key.trim());
}

export function getNineRouterUrl(): string {
    return (
        localStorage.getItem('9router_url') ||
        (import.meta.env.VITE_NINEROUTER_URL as string) ||
        'http://localhost:20128/v1'
    );
}

export function setNineRouterUrl(url: string): void {
    localStorage.setItem('9router_url', url);
}

export async function checkNineRouterHealth(): Promise<boolean> {
    const url = getNineRouterUrl();
    const key = getNineRouterKey();
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        const headers: Record<string, string> = {};
        if (key) {
            headers['Authorization'] = `Bearer ${key}`;
        }
        const res = await fetch(`${url}/models`, {
            method: 'GET',
            headers,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return res.ok;
    } catch {
        return false;
    }
}

export async function callNineRouter(prompt: string, systemInstruction?: string): Promise<string | null> {
    if (!isNineRouterModeEnabled()) {
        return null; // Modo Laboratório desligado
    }

    const key = getNineRouterKey();
    const configuredUrl = getNineRouterUrl();
    const backupTunnelUrl = 'https://rkjcu2n.abc-tunnel.us/v1';

    // Se estiver em HTTPS (Vercel), DEVE usar o túnel HTTPS primeiro para evitar bloqueio de Mixed Content
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

    const candidateUrls: string[] = [];
    if (isHttps) {
        // No Vercel (HTTPS), o túnel HTTPS é a rota direta funcional
        if (backupTunnelUrl) candidateUrls.push(backupTunnelUrl);
        if (configuredUrl.startsWith('https://') && !candidateUrls.includes(configuredUrl)) candidateUrls.push(configuredUrl);
        if (!candidateUrls.includes(configuredUrl)) candidateUrls.push(configuredUrl);
    } else {
        if (configuredUrl) candidateUrls.push(configuredUrl);
        if (backupTunnelUrl && !candidateUrls.includes(backupTunnelUrl)) candidateUrls.push(backupTunnelUrl);
        if (!candidateUrls.includes('http://127.0.0.1:20128/v1')) candidateUrls.push('http://127.0.0.1:20128/v1');
        if (!candidateUrls.includes('http://localhost:20128/v1')) candidateUrls.push('http://localhost:20128/v1');
    }

    // Modelos 100% verificados e ATIVOS (Verdes) no 9Router conforme fotos do Guardião:
    // 1. OpenCode Free (Modelos livres ilimitados)
    // 2. Gemini (Chave Nexus 2 dedicada)
    const candidateModels = [
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

    for (const baseUrl of candidateUrls) {
        const cleanBase = baseUrl.replace(/\/$/, '');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        if (key) {
            headers['Authorization'] = `Bearer ${key}`;
        }

        for (const modelName of candidateModels) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 60000);

                const response = await fetch(`${cleanBase}/chat/completions`, {
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
                        return `⚡ [MODO LABORATÓRIO - 9ROUTER / ${modelName.toUpperCase()}]:\n\n${content}`;
                    }
                } else {
                    console.warn(`[9ROUTER] Resposta não-OK (${cleanBase} | ${modelName}): HTTP ${response.status}`);
                    // Se for 404 (modelo não encontrado), tenta o próximo modelo no mesmo endpoint
                    if (response.status === 404) continue;
                    // Se for 429 (rate limit do modelo), tenta o próximo modelo
                    if (response.status === 429) continue;
                }
            } catch (error: any) {
                console.warn(`[9ROUTER] Tentativa em ${cleanBase} (${modelName}) erro de rede:`, error?.message || error);
                // Continua tentando os outros modelos ou URLs
            }
        }
    }

    console.warn('[9ROUTER] Nenhuma rota do 9Router respondeu com sucesso.');
    return null;
}
