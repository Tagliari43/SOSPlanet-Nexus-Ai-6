
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
    huggingface?: string;
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
    const huggingfaceKey = userKeys.find(k => k.service.toLowerCase().includes('hugging'))?.key || sovereignKeys.huggingface;
    const githubKey = userKeys.find(k => k.id === 'github-autonomy-token')?.key;

    return {
        google: googleKey,
        cloudflare: {
            apiToken: cloudflareKey || "o1fOItjjpjCnZ2QVGrx2gw2Wt3SMEKRyBpBi96ak"
        },
        huggingface: huggingfaceKey,
        github: githubKey
    };
}
