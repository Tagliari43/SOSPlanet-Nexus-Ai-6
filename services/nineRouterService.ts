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

    // Se estiver em HTTPS (ex: Vercel), prioriza URLs seguras (HTTPS) para evitar bloqueio de Mixed-Content do navegador
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    
    const candidateUrls: string[] = [];
    if (isHttps) {
        if (configuredUrl.startsWith('https://')) candidateUrls.push(configuredUrl);
        if (backupTunnelUrl.startsWith('https://') && !candidateUrls.includes(backupTunnelUrl)) candidateUrls.push(backupTunnelUrl);
        if (configuredUrl.startsWith('http://') && !candidateUrls.includes(configuredUrl)) candidateUrls.push(configuredUrl);
    } else {
        candidateUrls.push(configuredUrl);
        if (!candidateUrls.includes(backupTunnelUrl)) candidateUrls.push(backupTunnelUrl);
    }

    const candidateModels = ['gemini-3.6-flash', 'gemini/gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];

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
                // 180s (3 minutos) de timeout para permitir raciocínio profundo, buscas e respostas longas/complexas sem corte
                const timeoutId = setTimeout(() => controller.abort(), 180000);

                const response = await fetch(`${cleanBase}/chat/completions`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        model: modelName,
                        messages: [
                            ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
                            { role: 'user', content: prompt }
                        ]
                    }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!response.ok) {
                    console.warn(`[9ROUTER] (${cleanBase} - ${modelName}) status HTTP ${response.status}`);
                    // Se deu 404 de modelo, tenta o próximo modelo no mesmo endpoint
                    if (response.status === 404) continue;
                    break; // Se deu 401 ou erro de rota, passa pro próximo URL
                }

                const data = await response.json();
                const content = data.choices?.[0]?.message?.content;
                if (content && content.trim().length > 0) {
                    return `⚡ [MODO LABORATÓRIO - 9ROUTER SOBERANO]:\n\n${content}`;
                }
            } catch (error: any) {
                console.warn(`[9ROUTER] Tentativa em ${cleanBase} (${modelName}) falhou:`, error?.message || error);
                break; // Se falhou a conexão de rede/timeout, pula para a próxima URL
            }
        }
    }

    console.warn('[9ROUTER] Nenhuma rota do 9Router respondeu a tempo. Ativando contingência.');
    return null;
}
