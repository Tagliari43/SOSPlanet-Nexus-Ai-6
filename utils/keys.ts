
import { sovereignKeys } from './sovereignKeys';
import { UserApiKey } from '../components/Arsenal';
import { USER_API_KEYS_KEY } from '../App';

export interface CloudflareKeys {
    apiToken?: string;
    accountId?: string;
}

export interface ApiKeys {
    google?: string;
    cloudflare?: CloudflareKeys;
    groq?: string;
    github?: string;
    tavily?: string;
}

/**
 * Carrega as chaves soberanas buscando primeiro no localStorage (usuário) 
 * e depois nos valores forjados (fallback).
 */
export function loadApiKeys(): ApiKeys {
    let userKeys: UserApiKey[] = [];
    try {
        const saved = localStorage.getItem(USER_API_KEYS_KEY);
        if (saved) userKeys = JSON.parse(saved);
    } catch (e) {}

    // Busca chaves específicas nos registros do usuário
    const cloudflareKey = userKeys.find(k => k.service.toLowerCase().includes('cloudflare') && k.id !== 'cloudflare-account')?.key;
    const cloudflareAccountId = userKeys.find(k => k.id === 'cloudflare-account')?.key;
    const googleKey = userKeys.find(k => k.service.toLowerCase().includes('google'))?.key || process.env.GEMINI_API_KEY || process.env.API_KEY || sovereignKeys.google;
    const groqKey = userKeys.find(k => k.service.toLowerCase().includes('groq'))?.key || process.env.GROQ_API_KEY || sovereignKeys.groq;
    const githubKey = userKeys.find(k => k.id === 'github-autonomy-token')?.key || process.env.GITHUB_TOKEN;
    const tavilyKey = userKeys.find(k => k.service.toLowerCase().includes('tavily'))?.key || process.env.TAVILY_API_KEY;

    return {
        google: googleKey,
        cloudflare: {
            apiToken: cloudflareKey || process.env.CLOUDFLARE_API_TOKEN || "cfut_BywvSf9lsIBRQJVEFit4RTBfMhq6lx93JQUQUSQVa5419d52",
            accountId: cloudflareAccountId || process.env.ID_DA_CONTA_CLOUDFLARE || process.env.CLOUDFLARE_ACCOUNT_ID || 'dd68cbf6f5d435b9d8c4b558f97ddf03'
        },
        groq: groqKey,
        github: githubKey,
        tavily: tavilyKey
    };
}
