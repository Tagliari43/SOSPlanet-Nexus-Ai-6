export interface RouteCandidate {
    name: string;
    url: string;
    key: string;
    endpoint: string;
    modelsEndpoint: string;
}

// Modo 9Router/9Remote: Desligado por padrão, ativado apenas sob demanda do usuário
export function isNineRouterModeEnabled(): boolean {
    return localStorage.getItem('santuario_9router_mode') === 'true';
}

export function setNineRouterMode(enabled: boolean): void {
    if (enabled) {
        localStorage.setItem('santuario_9router_mode', 'true');
    } else {
        localStorage.removeItem('santuario_9router_mode');
    }
}

// Modo Túnel: Desligado por padrão, ativado apenas se o usuário pedir explicitamente
export function isTunnelEnabled(): boolean {
    return localStorage.getItem('santuario_tunnel_enabled') === 'true';
}

export function setTunnelMode(enabled: boolean): void {
    if (enabled) {
        localStorage.setItem('santuario_tunnel_enabled', 'true');
    } else {
        localStorage.removeItem('santuario_tunnel_enabled');
    }
}

export function getNineRouterUrl(): string {
    return localStorage.getItem('VITE_NINEROUTERR_URL') || 'http://localhost:2208';
}

export function getNineRouterKey(): string {
    return localStorage.getItem('VITE_NINEROUTERR_KEY') || 'sk-8effe28f-xif4-8ff9d4';
}

export function setNineRouterUrl(url: string): void {
    localStorage.setItem('9router_url', url.trim());
}

export function setNineRouterKey(key: string): void {
    localStorage.setItem('9router_key', key.trim());
}

/**
 * Retorna a rota ativa com base no que o usuário habilitou:
 * - Se túnel estiver explicitamente ligado: usa o túnel HTTPS.
 * - Caso padrão: usa a ponte direta do 9Remote (porta 2208) ou 9Router (porta 20128).
 */
export function getActiveRoutes(): RouteCandidate[] {
    const tunnelActive = isTunnelEnabled();

    if (tunnelActive) {
        // Rota do Túnel (somente se usuário pediu)
        const tunnelUrl = (
            localStorage.getItem('VITE_NINEROUTER_TUNEL_URL') ||
            (import.meta.env.VITE_NINEROUTER_TUNEL_URL as string) ||
            'https://rkjcu2n.abc-tunnel.us/v1'
        ).replace(/\/$/, '');
        const tunnelKey = (
            localStorage.getItem('VITE_NINEROUTERR_KEY') ||
            'sk-8effe28f-xif4-8ff9d4'
        ).trim();

        return [{
            name: 'Ponte Túnel (abc-tunnel)',
            url: tunnelUrl,
            key: tunnelKey,
            endpoint: tunnelUrl.endsWith('/v1') ? `${tunnelUrl}/chat/completions` : `${tunnelUrl}/v1/chat/completions`,
            modelsEndpoint: tunnelUrl.endsWith('/v1') ? `${tunnelUrl}/models` : `${tunnelUrl}/v1/models`
        }];
    }

    // Rota padrão do 9Remote (Porta 2208)
    const remoteUrl = (
        localStorage.getItem('VITE_NINEROUTERR_URL') ||
        (import.meta.env.VITE_NINEROUTERR_URL as string) ||
        'http://localhost:2208'
    ).replace(/\/$/, '');
    const remoteKey = (
        localStorage.getItem('VITE_NINEROUTERR_KEY') ||
        (import.meta.env.VITE_NINEROUTERR_KEY as string) ||
        'sk-8effe28f-xif4-8ff9d4'
    ).trim();

    // Rota secundária 9Router Local (Porta 20128)
    const localUrl = (
        localStorage.getItem('VITE_NINEROUTER_URL') ||
        (import.meta.env.VITE_NINEROUTER_URL as string) ||
        'http://localhost:20128/v1'
    ).replace(/\/$/, '');
    const localKey = (
        localStorage.getItem('VITE_NINEROUTER_KEY') ||
        (import.meta.env.VITE_NINEROUTER_KEY as string) ||
        'sk-9358b8e41366fa0f-pip3i8-f3d894fc'
    ).trim();

    return [
        {
            name: '9Remote (Porta 2208)',
            url: remoteUrl,
            key: remoteKey,
            endpoint: remoteUrl.endsWith('/v1') ? `${remoteUrl}/chat/completions` : `${remoteUrl}/v1/chat/completions`,
            modelsEndpoint: remoteUrl.endsWith('/v1') ? `${remoteUrl}/models` : `${remoteUrl}/v1/models`
        },
        {
            name: '9Router Local (Porta 20128)',
            url: localUrl,
            key: localKey,
            endpoint: localUrl.endsWith('/v1') ? `${localUrl}/chat/completions` : `${localUrl}/v1/chat/completions`,
            modelsEndpoint: localUrl.endsWith('/v1') ? `${localUrl}/models` : `${localUrl}/v1/models`
        }
    ];
}

/**
 * Checagem de pulso rápida (máx 3s)
 */
export async function checkNineRouterHealth(): Promise<boolean> {
    if (!isNineRouterModeEnabled()) return false;

    const routes = getActiveRoutes();
    for (const route of routes) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const headers: Record<string, string> = {};
            if (route.key) {
                headers['Authorization'] = `Bearer ${route.key}`;
            }

            const res = await fetch(route.modelsEndpoint, {
                method: 'GET',
                headers,
                signal: controller.signal
            }).catch(() => null);

            clearTimeout(timeoutId);
            if (res && (res.ok || res.status === 200 || res.status === 401 || res.status === 404)) {
                return true;
            }
        } catch {
            // Continua
        }
    }
    return false;
}

/**
 * Chamada ágil e sem looping:
 * - Tenta apenas o combo `nexus-soberano` (ou `oc/deepseek-v4-flash-free`) na rota ativa.
 * - Timeout estrito de 6 segundos por tentativa.
 * - Se não responder em 6s, retorna null imediatamente para o roteador nativo responder sem demora.
 */
export async function callNineRouter(
    prompt: string, 
    systemInstruction?: string,
    onLog?: (msg: string, source?: string) => void
): Promise<string | null> {
    if (!isNineRouterModeEnabled()) {
        return null;
    }

    const routes = getActiveRoutes();
    // Testamos apenas o combo do Maestro ou o primeiro modelo livre
    const targetModels = ['nexus-soberano', 'oc/deepseek-v4-flash-free'];

    for (const route of routes) {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        if (route.key) {
            headers['Authorization'] = `Bearer ${route.key}`;
        }

        for (const modelName of targetModels) {
            try {
                if (onLog) onLog(`Testando [${route.name}] -> modelo ${modelName}... (timeout 6s)`, "9ROUTER");
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 6000);

                const response = await fetch(route.endpoint, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        model: modelName,
                        messages: [
                            ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
                            { role: 'user', content: prompt }
                        ],
                        temperature: 0.7,
                        max_tokens: 2048
                    }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    const content = data.choices?.[0]?.message?.content;
                    if (content && content.trim().length > 0) {
                        if (onLog) onLog(`✅ Sucesso via [${route.name}] (${modelName})!`, "9ROUTER");
                        return `⚡ [9REMOTE / ${modelName.toUpperCase()}]:\n\n${content}`;
                    }
                } else {
                    if (onLog) onLog(`[${route.name}] retornou HTTP ${response.status}.`, "9ROUTER");
                }
            } catch (err: any) {
                // Timeout ou falha rápida
                if (onLog) onLog(`[${route.name}] (${modelName}) sem resposta rápida.`, "9ROUTER");
            }
        }
    }

    // Sem looping longo: se não respondeu em 6s, repassa imediatamente para o roteador nativo
    return null;
}
