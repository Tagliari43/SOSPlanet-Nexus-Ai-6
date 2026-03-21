
import { TaskResult } from './geminiService';
import { CloudflareKeys } from '../utils/keys';

// ID da Conta do Guardião Eder - ATUALIZADO v18.7
const PROXY_PATH = '/v1/proxy/api.cloudflare.com';
const CLOUDFLARE_API_BASE = `${PROXY_PATH}/client/v4/accounts/`;

async function fetchWithTimeout(resource: RequestInfo | URL, options: RequestInit & { timeout?: number } = {}): Promise<Response> {
    const { timeout = 10000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(resource, { ...options, signal: controller.signal });
        return response;
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') throw new Error('A requisição demorou muito (timeout).');
        throw error;
    } finally {
        clearTimeout(id);
    }
}

export async function validateCloudflareApiKeys(keys: CloudflareKeys): Promise<boolean> {
    const token = keys.apiToken || process.env.CLOUDFLARE_API_TOKEN || "o1fOItjjpjCnZ2QVGrx2gw2Wt3SMEKRyBpBi96ak";
    const accountId = keys.accountId || process.env.CLOUDFLARE_ACCOUNT_ID || '239d8f103f421ca4b4298195b44e66a1';
    if (!token) return false;
    try {
        const model = '@cf/meta/llama-3-8b-instruct';
        const url = `${CLOUDFLARE_API_BASE}${accountId}/ai/run/${model}`;
        
        const response = await fetchWithTimeout(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages: [{ role: 'user', content: 'ping' }] }),
            timeout: 8000
        });
        
        return response.ok;
    } catch (error) {
        return false;
    }
}

export async function executeCloudflareTask(task: string, assignedMember: string, model: string, keys: CloudflareKeys, contextHistory: string = ""): Promise<TaskResult> {
    const token = keys.apiToken || process.env.CLOUDFLARE_API_TOKEN || "o1fOItjjpjCnZ2QVGrx2gw2Wt3SMEKRyBpBi96ak";
    const accountId = keys.accountId || process.env.CLOUDFLARE_ACCOUNT_ID || '239d8f103f421ca4b4298195b44e66a1';
    if (!token) throw new Error("A credencial da Cloudflare não foi configurada no Arsenal.");

    const url = `${CLOUDFLARE_API_BASE}${accountId}/ai/run/${model}`;
    
    const NEXUS_DICTIONARY = `
# NEXUS DICIONÁRIO VIVO - SOSPLANET
Você é ${assignedMember}, operando como fallback na Ponte Dourada (Cloudflare) do Santuário SOSPlanet.
O Guardião Supremo é Eder Rodrigo Tagliari.
Responda sempre em português do Brasil, de forma tática e direta.
`;

    const systemPrompt = NEXUS_DICTIONARY + (contextHistory ? `\n\n[DIÁRIO DE BORDO RECENTE]\n${contextHistory}` : "");

    try {
        const response = await fetchWithTimeout(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: task }
                ]
            }),
            timeout: 15000
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro na Ponte Dourada: ${response.status}`);
        }

        const result = await response.json();
        const text = result.result?.response || 'A Ponte Dourada não retornou dados válidos.';
        
        return { text: text, sources: [] };
    } catch (error) {
        throw new Error(`A conexão com a Ponte Dourada falhou.`);
    }
}
