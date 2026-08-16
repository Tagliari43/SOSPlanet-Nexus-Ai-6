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
    const custom = (getNineRouterUrl() || '').replace(/\/$/, '');

    const pool: string[] = [];

    // 1. Prioridade Absoluta: 9Remote Direto e URLs configuradas pelo Maestro
    if (custom) pool.push(custom);
    pool.push('http://localhost:2208/v1');
    pool.push('http://localhost:2208');
    pool.push('http://127.0.0.1:2208/v1');
    pool.push('http://127.0.0.1:2208');

    // 2. 9Router Local Direto
    pool.push('http://localhost:20128/v1');
    pool.push('http://localhost:20128');
    pool.push('http://127.0.0.1:20128/v1');
    pool.push('http://127.0.0.1:20128');

    // 3. Ponte Túnel HTTPS
    pool.push('https://rkjcu2n.abc-tunnel.us/v1');
    pool.push('https://rkjcu2n.abc-tunnel.us');

    return Array.from(new Set(pool.filter(Boolean)));
}

export async function checkNineRouterHealth(): Promise<boolean> {
    const candidates = getAllCandidateUrls();
    const keysToTry = [
        getNineRouterKey(),
        'sk-9358b8e41366fa0f-pip3i8-f3d894fc',
        'sk-8effe28f-xif4-8ff9d4'
    ].filter(Boolean);

    for (const rawUrl of candidates) {
        const url = rawUrl.replace(/\/$/, '');
        for (const key of keysToTry) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 4000);
                const headers: Record<string, string> = {};
                if (key) {
                    headers['Authorization'] = `Bearer ${key}`;
                }

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
                // Continua para o próximo
            }
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

    const candidateUrls = getAllCandidateUrls();
    const keysToTry = [
        getNineRouterKey(),
        'sk-9358b8e41366fa0f-pip3i8-f3d894fc',
        'sk-8effe28f-xif4-8ff9d4'
    ].filter(Boolean);

    // Foco direto no combo do Maestro e nos modelos OpenCode Free
    // Não varre desnecessariamente outros modelos pagos/Gemini
    const priorityModels = [
        'nexus-soberano',               // Combo oficial configurado no 9Router (Fallback automático interno)
        'oc/deepseek-v4-flash-free',    // OpenCode Free - DeepSeek v4
        'oc/nemotron-3.5-lightning-free',// OpenCode Free - Nemotron 3.5
        'oc/mimo-v2.5-free',            // OpenCode Free - MiMo v2.5
        'oc/laguna-s-2.1-free',         // OpenCode Free - Laguna
        'oc/hy3-free',                  // OpenCode Free - HY3
        'oc/big-pickle'                 // OpenCode Free - Big Pickle
    ];

    for (const rawUrl of candidateUrls) {
        const cleanBase = rawUrl.replace(/\/$/, '');
        const targetEndpoint = cleanBase.endsWith('/v1') 
            ? `${cleanBase}/chat/completions` 
            : `${cleanBase}/v1/chat/completions`;

        for (const key of keysToTry) {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };
            if (key) {
                headers['Authorization'] = `Bearer ${key}`;
            }

            for (const modelName of priorityModels) {
                try {
                    if (onLog) onLog(`9Router [${cleanBase}] acionando ${modelName}...`, "9ROUTER");
                    const controller = new AbortController();
                    // 35 segundos para permitir que modelos gratuitos de raciocínio processem a resposta
                    const timeoutId = setTimeout(() => controller.abort(), 35000);

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
                            if (onLog) onLog(`✅ 9Router respondeu com sucesso via OpenCode (${modelName})!`, "9ROUTER");
                            return `⚡ [MODO LABORATÓRIO - 9ROUTER / ${modelName.toUpperCase()}]:\n\n${content}`;
                        }
                    } else {
                        const errText = await response.text().catch(() => '');
                        console.warn(`[9ROUTER] (${modelName} @ ${cleanBase}): HTTP ${response.status}`, errText);
                        // Se o modelo ou rota não existir, tenta o próximo modelo do OpenCode
                        continue;
                    }
                } catch (error: any) {
                    console.warn(`[9ROUTER] Tentativa em ${cleanBase} (${modelName}) falhou:`, error?.message || error);
                }
            }
        }
    }

    console.warn('[9ROUTER] Nenhuma rota do OpenCode no 9Router respondeu a tempo.');
    return null;
}
