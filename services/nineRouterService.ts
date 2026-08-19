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
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('9router-mode-change', { detail: { enabled } }));
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
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('9router-mode-change', { detail: { tunnelEnabled: enabled } }));
    }
}

export function getNineRouterUrl(): string {
    return localStorage.getItem('VITE_NINEROUTER_URL') || 
           localStorage.getItem('9router_url') || 
           localStorage.getItem('VITE_NINEROUTERR_URL') || 
           (import.meta.env.VITE_NINEROUTER_URL as string) || 
           '';
}

export function getNineRouterKey(): string {
    return localStorage.getItem('VITE_NINEROUTER_KEY') || 
           localStorage.getItem('9router_key') || 
           localStorage.getItem('VITE_NINEROUTERR_KEY') || 
           (import.meta.env.VITE_NINEROUTER_KEY as string) || 
           '';
}

export function setNineRouterUrl(url: string): void {
    const cleanUrl = url.trim();
    localStorage.setItem('VITE_NINEROUTER_URL', cleanUrl);
    localStorage.setItem('9router_url', cleanUrl);
}

export function setNineRouterKey(key: string): void {
    const cleanKey = key.trim();
    localStorage.setItem('VITE_NINEROUTER_KEY', cleanKey);
    localStorage.setItem('9router_key', cleanKey);
}

/**
 * Retorna a rota ativa configurada pelo Guardião:
 * - Se nenhuma URL estiver configurada no Arsenal/Cofre, retorna vazio (sem fallbacks fantasmas).
 * - Usa exclusivamente a URL e Chave validadas e salvas nesta sessão.
 */
export function getActiveRoutes(): RouteCandidate[] {
    const rawUrl = getNineRouterUrl().trim().replace(/\/$/, '');
    const rawKey = getNineRouterKey().trim();

    if (!rawUrl) {
        return [];
    }

    const endpoint = rawUrl.endsWith('/v1') ? `${rawUrl}/chat/completions` : `${rawUrl}/v1/chat/completions`;
    const modelsEndpoint = rawUrl.endsWith('/v1') ? `${rawUrl}/models` : `${rawUrl}/v1/models`;

    return [{
        name: isTunnelEnabled() ? '9Router Túnel (Soberano)' : '9Router / 9Remote',
        url: rawUrl,
        key: rawKey,
        endpoint,
        modelsEndpoint
    }];
}

/**
 * Checagem de pulso rápida (máx 3s) com diagnóstico de rota
 */
export async function checkNineRouterHealth(onLog?: (msg: string, source?: string) => void): Promise<boolean> {
    if (!isNineRouterModeEnabled()) return false;

    const routes = getActiveRoutes();
    if (routes.length === 0) {
        if (onLog) onLog("⚠️ [DIAGNÓSTICO 9ROUTER]: Nenhuma rota ou URL configurada no Arsenal.", "9ROUTER");
        return false;
    }

    for (const route of routes) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const headers: Record<string, string> = {};
            
            if (route.key) {
                headers['Authorization'] = `Bearer ${route.key}`;
                const masked = route.key.length > 8 ? `${route.key.slice(0, 4)}...${route.key.slice(-4)}` : '••••';
                if (onLog) onLog(`🔍 [DIAGNÓSTICO]: Testando pulso com chave [${masked}] (${route.key.length} chars) em ${route.url}`, "9ROUTER");
            } else {
                if (onLog) onLog(`🔍 [DIAGNÓSTICO]: Testando pulso sem chave em ${route.url}`, "9ROUTER");
            }

            const res = await fetch(route.modelsEndpoint, {
                method: 'GET',
                headers,
                signal: controller.signal
            }).catch(() => null);

            clearTimeout(timeoutId);
            if (res && (res.ok || res.status === 200 || res.status === 401 || res.status === 404)) {
                if (res.status === 401) {
                    if (onLog) onLog(`⚠️ [ALERTA 9ROUTER]: Endpoint respondeu (401 - Chave requer validação no Arsenal).`, "9ROUTER");
                } else if (res.ok || res.status === 200) {
                    if (onLog) onLog(`🟢 [APROVAÇÃO 9ROUTER]: Pulso da rota [${route.name}] homologado com sucesso!`, "9ROUTER");
                }
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
 * - Inclui log de diagnóstico da chave e alertas de aprovação e erro estruturados.
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
    if (routes.length === 0) {
        if (onLog) onLog("⚠️ [DIAGNÓSTICO 9ROUTER]: Nenhuma rota ativa. Configure URL e Chave no Arsenal.", "9ROUTER");
        return null;
    }

    // Testamos apenas o combo do Maestro ou o primeiro modelo livre
    const targetModels = ['nexus-soberano', 'oc/deepseek-v4-flash-free'];

    for (const route of routes) {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        // Diagnóstico da Chave
        if (route.key && route.key.trim().length > 0) {
            headers['Authorization'] = `Bearer ${route.key.trim()}`;
            const keyClean = route.key.trim();
            const maskedKey = keyClean.length > 8 
                ? `${keyClean.slice(0, 4)}...${keyClean.slice(-4)}` 
                : '••••';
            if (onLog) onLog(`🔑 [DIAGNÓSTICO CHAVE]: Chave ativa detectada [${maskedKey}] (Tamanho: ${keyClean.length} caracteres).`, "9ROUTER");
        } else {
            if (onLog) onLog(`⚠️ [DIAGNÓSTICO CHAVE]: Nenhuma chave configurada. Tentando acesso direto ao endpoint.`, "9ROUTER");
        }

        for (const modelName of targetModels) {
            try {
                if (onLog) onLog(`📡 [ROTA 9ROUTER]: Testando [${route.name}] -> modelo ${modelName}... (timeout 6s)`, "9ROUTER");
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
                        if (onLog) onLog(`🟢 [APROVAÇÃO 9ROUTER]: Resposta recebida e validada com sucesso via [${route.name}] (${modelName})!`, "9ROUTER");
                        return `⚡ [9REMOTE / ${modelName.toUpperCase()}]:\n\n${content}`;
                    }
                } else if (response.status === 401) {
                    if (onLog) onLog(`⛔ [ALERTA 9ROUTER]: Chave Rejeitada (HTTP 401 Unauthorized). Verifique se a chave cristalizada no Arsenal confere exatamente com a autorizada pelo Guardião (atenção ao 'i').`, "9ROUTER");
                } else if (response.status === 403 || response.status === 429) {
                    if (onLog) onLog(`⚠️ [ALERTA 9ROUTER]: Limite de requisições ou acesso negado (HTTP ${response.status}).`, "9ROUTER");
                } else if (response.status === 404) {
                    if (onLog) onLog(`⚠️ [ALERTA 9ROUTER]: Rota ou modelo não encontrado (HTTP 404) no endpoint ${route.endpoint}.`, "9ROUTER");
                } else {
                    if (onLog) onLog(`⚠️ [ALERTA 9ROUTER]: [${route.name}] retornou HTTP ${response.status}.`, "9ROUTER");
                }
            } catch (err: any) {
                // Timeout ou falha rápida
                if (onLog) onLog(`⏳ [DIAGNÓSTICO 9ROUTER]: [${route.name}] (${modelName}) sem resposta rápida ou timeout.`, "9ROUTER");
            }
        }
    }

    // Sem looping longo: se não respondeu em 6s, repassa imediatamente para o roteador nativo
    return null;
}
