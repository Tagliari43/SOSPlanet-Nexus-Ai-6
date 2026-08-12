
import { sovereignKeys } from './sovereignKeys';
import { UserApiKey } from '../components/Arsenal';
import { USER_API_KEYS_KEY } from '../App';

export interface CloudflareKeys {
    apiToken?: string;
    accountId?: string;
}

export interface ApiKeys {
    google?: string;
    googleKeys?: string[];
    groq?: string;
    github?: string;
    cerebras?: string;
    openrouter?: string;
    nvidia?: string;
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

    // Coleta TODAS as chaves do Google na ordem estrita:
    // 1. GEMINI_API_KEY / API_KEY
    // 2. GEMINI_API_KEY_2 / GEMINI_API_KEY_SOSPLANET
    // 3. Chaves do Arsenal salvas pelo usuário
    const envGoogle1 = process.env.GEMINI_API_KEY || process.env.API_KEY || sovereignKeys.google;
    const envGoogle2 = process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY_SOSPLANET;
    const googleUserKeys = userKeys
        .filter(k => k.service.toLowerCase().includes('google') || k.service.toLowerCase().includes('gemini'))
        .map(k => k.key);

    const allGoogleKeys = Array.from(new Set([envGoogle1, envGoogle2, ...googleUserKeys].filter(Boolean)));

    const googleKey = allGoogleKeys[0] || '';
    const groqKey = userKeys.find(k => k.service.toLowerCase().includes('groq'))?.key || process.env.GROQ_API_KEY || sovereignKeys.groq;
    const githubKey = userKeys.find(k => k.id === 'github-autonomy-token')?.key || process.env.GITHUB_TOKEN;
    const cerebrasKey = userKeys.find(k => k.service.toLowerCase().includes('cerebras'))?.key || process.env.CEREBRAS_API_KEY;
    const openrouterKey = userKeys.find(k => k.service.toLowerCase().includes('openrouter'))?.key || process.env.OPENROUTER_API_KEY;
    const nvidiaKey = userKeys.find(k => k.service.toLowerCase().includes('nvidia'))?.key || process.env.NVIDIA_API_KEY;

    return {
        google: googleKey,
        googleKeys: allGoogleKeys,
        groq: groqKey,
        github: githubKey,
        cerebras: cerebrasKey,
        openrouter: openrouterKey,
        nvidia: nvidiaKey
    };
}
