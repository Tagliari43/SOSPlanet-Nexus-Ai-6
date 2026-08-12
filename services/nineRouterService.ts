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

export async function checkNineRouterHealth(): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        const res = await fetch('http://localhost:20128/v1/models', {
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

    try {
        const key = localStorage.getItem('9router_key') || 'sk-93594fc';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

        const response = await fetch('http://localhost:20128/v1/chat/completions', {
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
            console.warn('[9ROUTER] Servidor local retornou status HTTP', response.status, '- Fallback para roteador nativo');
            return null;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
            return `⚡ [MODO LABORATÓRIO - 9ROUTER LOCAL]:\n\n${content}`;
        }
        return null;
    } catch (error) {
        console.warn('[9ROUTER] Falha na conexão com http://localhost:20128 - Ativando fallback para o roteador do Santuário.');
        return null; // Fallback automático e transparente
    }
}
