
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
    const cloudflareKey = userKeys.find(k => k.service.toLowerCase().includes('cloudflare'))?.key;
    const googleKey = userKeys.find(k => k.service.toLowerCase().includes('google'))?.key || sovereignKeys.google;
    const groqKey = userKeys.find(k => k.service.toLowerCase().includes('groq'))?.key || process.env.GROQ_API_KEY || sovereignKeys.groq;
    const githubKey = userKeys.find(k => k.id === 'github-autonomy-token')?.key;

    return {
        google: googleKey,
        cloudflare: {
            apiToken: cloudflareKey || process.env.CLOUDFLARE_API_TOKEN || "o1fOItjjpjCnZ2QVGrx2gw2Wt3SMEKRyBpBi96ak",
            accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '239d8f103f421ca4b4298195b44e66a1'
        },
        groq: groqKey,
        github: githubKey
    };
}
