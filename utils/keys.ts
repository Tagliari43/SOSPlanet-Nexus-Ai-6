
import { sovereignKeys } from './sovereignKeys';
import { UserApiKey } from '../components/Arsenal';
import { USER_API_KEYS_KEY } from '../App';

export interface CloudflareKeys {
    apiToken?: string;
    accountId?: string;
}

export interface ApiKeys {
    google?: string;
    groq?: string;
    github?: string;
    cerebras?: string;
    openrouter?: string;
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
    const googleKey = userKeys.find(k => k.service.toLowerCase().includes('google'))?.key || process.env.GEMINI_API_KEY || process.env.API_KEY || sovereignKeys.google;
    const groqKey = userKeys.find(k => k.service.toLowerCase().includes('groq'))?.key || process.env.GROQ_API_KEY || sovereignKeys.groq;
    const githubKey = userKeys.find(k => k.id === 'github-autonomy-token')?.key || process.env.GITHUB_TOKEN;
    const cerebrasKey = userKeys.find(k => k.service.toLowerCase().includes('cerebras'))?.key || process.env.CEREBRAS_API_KEY;
    const openrouterKey = userKeys.find(k => k.service.toLowerCase().includes('openrouter'))?.key || process.env.OPENROUTER_API_KEY;

    return {
        google: googleKey,
        groq: groqKey,
        github: githubKey,
        cerebras: cerebrasKey,
        openrouter: openrouterKey
    };
}
