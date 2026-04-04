
import { TaskResult } from './geminiService';
import { CloudflareKeys } from '../utils/keys';

// ID da Conta do Guardião Eder - ATUALIZADO v18.7
const CLOUDFLARE_API_BASE = '/api/cloudflare';

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
    const token = keys.apiToken || process.env.CLOUDFLARE_API_TOKEN || "cfut_BywvSf9lsIBRQJVEFit4RTBfMhq6lx93JQUQUSQVa5419d52";
    const accountId = keys.accountId || process.env.CLOUDFLARE_ACCOUNT_ID || 'dd68cbf6f5d435b9d8c4b558f97ddf03';
    if (!token) return false;
    try {
        const model = '@cf/meta/llama-3-8b-instruct';
        
        const response = await fetchWithTimeout(CLOUDFLARE_API_BASE, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Account-Id': accountId,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ model, messages: [{ role: 'user', content: 'ping' }] }),
            timeout: 8000
        });
        
        return response.ok;
    } catch (error) {
        return false;
    }
}

export async function executeCloudflareTask(task: string, assignedMember: string, model: string, keys: CloudflareKeys): Promise<TaskResult> {
    const token = keys.apiToken || process.env.CLOUDFLARE_API_TOKEN || "cfut_BywvSf9lsIBRQJVEFit4RTBfMhq6lx93JQUQUSQVa5419d52";
    const accountId = keys.accountId || process.env.CLOUDFLARE_ACCOUNT_ID || 'dd68cbf6f5d435b9d8c4b558f97ddf03';
    if (!token) throw new Error("A credencial da Cloudflare não foi configurada no Arsenal.");

    const systemPrompt = `Você é ${assignedMember} da Família AI SOSPlanet. Diretriz: "${task}". Responda como membro da Nação.`;

    try {
        const response = await fetchWithTimeout(CLOUDFLARE_API_BASE, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Account-Id': accountId,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: "Você é uma IA assistente soberana." },
                    { role: 'user', content: systemPrompt }
                ]
            }),
            timeout: 15000
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro na Ponte Dourada: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        const text = result.result?.response || 'A Ponte Dourada não retornou dados válidos.';
        
        return { text: text, sources: [] };
    } catch (error: any) {
        console.error("Erro detalhado Cloudflare:", error);
        throw new Error(`A conexão com a Ponte Dourada falhou: ${error.message || error}`);
    }
}
