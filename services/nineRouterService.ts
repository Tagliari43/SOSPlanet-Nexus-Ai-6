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

export function getNineRouterUrl(): string {
    return localStorage.getItem('9router_url') || 'http://localhost:20128/v1';
}

export function setNineRouterUrl(url: string): void {
    localStorage.setItem('9router_url', url);
}

export async function checkNineRouterHealth(): Promise<boolean> {
    const url = getNineRouterUrl();
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        const res = await fetch(`${url}/models`, {
            method: 'GET',
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

    const key = localStorage.getItem('9router_key') || 'sk-93594fc';
    const primaryUrl = getNineRouterUrl(); // Default: http://localhost:20128/v1
    const backupTunnelUrl = 'https://rkjcu2n.abc-tunnel.us/v1'; // Tunnel from 9Router dashboard

    const urlsToTry = [primaryUrl];
    if (primaryUrl !== backupTunnelUrl) {
        urlsToTry.push(backupTunnelUrl);
    }

    for (const baseUrl of urlsToTry) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout per attempt

            const cleanBase = baseUrl.replace(/\/$/, '');
            const response = await fetch(`${cleanBase}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify({
                    model: 'gemini/gemini-3.6-flash',
                    messages: [
                        ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
                        { role: 'user', content: prompt }
                    ]
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                console.warn(`[9ROUTER] Servidor local (${cleanBase}) retornou status HTTP ${response.status}`);
                continue;
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;
            if (content) {
                return `⚡ [MODO LABORATÓRIO - 9ROUTER LOCAL]:\n\n${content}`;
            }
        } catch (error) {
            console.warn(`[9ROUTER] Falha na conexão com ${baseUrl} - Tentando próxima rota de laboratório...`);
        }
    }

    console.warn('[9ROUTER] Nenhuma rota de laboratório respondeu. Ativando fallback para o roteador do Santuário.');
    return null; // Fallback automático e transparente para o Roteador Nativo
}
