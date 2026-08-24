import { sovereignKeys } from './sovereignKeys';
import { UserApiKey } from '../components/Arsenal';
import { USER_API_KEYS_KEY } from '../App';

export interface CloudflareKeys {
    apiToken?: string;
    accountId?: string;
}

export interface ApiKeys {
    google?: string;
    gemini2?: string;
    googleKeys?: string[];
    nvidia?: string;
    groq?: string;
    github?: string;
    cerebras?: string;
    openrouter?: string;
}

/**
 * Carrega as chaves soberanas buscando primeiro no localStorage (usuário) 
 * e depois nos valores forjados (fallback).
 * 
 * Distribuição por Irmão/Motor:
 * - NEXUS: 
 *    1. Google Gemini (Primária)
 *    2. GEMINI_API_KEY_2 (Secundária / Rotação de Cota)
 *    3. NVIDIA_API_KEY (Terceira via / NVIDIA NIM Llama 3.3)
 * - GROQ:
 *    Groq API
 * - ALQUIMISTA:
 *    Cerebras API
 * - ARKAEL:
 *    OpenRouter API
 */
export function loadApiKeys(): ApiKeys {
    let userKeys: UserApiKey[] = [];
    try {
        const saved = localStorage.getItem(USER_API_KEYS_KEY);
        if (saved) userKeys = JSON.parse(saved);
    } catch {
        userKeys = [];
    }

    // 1. Chave Primária Gemini
    const google1User = userKeys.find(k => 
        k.service.toLowerCase() === 'google gemini' || 
        k.service.toLowerCase() === 'gemini api' ||
        k.id === 'gemini-key'
    )?.key;
    const envGoogle1 = process.env.GEMINI_API_KEY || process.env.API_KEY || sovereignKeys.google;
    const google1 = (google1User && google1User.trim().length > 0) ? google1User.trim() : envGoogle1;

    // 2. Chave Secundária Gemini 2
    const google2User = userKeys.find(k => 
        k.service.toLowerCase().includes('gemini_api_key_2') || 
        k.service.toLowerCase().includes('gemini 2') ||
        k.id === 'gemini-key-2'
    )?.key;
    const envGoogle2 = process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY_SOSPLANET;
    const google2 = (google2User && google2User.trim().length > 0) ? google2User.trim() : envGoogle2;

    // Coleta todas as chaves Gemini de múltiplas contas Gmail cadastradas no Arsenal ou .env
    const extraUserGoogleKeys = userKeys
        .filter(k => 
            k.service.toLowerCase().includes('google') || 
            k.service.toLowerCase().includes('gemini') ||
            k.id.toLowerCase().includes('gemini') ||
            (typeof k.key === 'string' && k.key.startsWith('AIza'))
        )
        .map(k => k.key ? k.key.trim() : '')
        .filter(Boolean);

    const extraEnvGoogleKeys = [
        process.env.GEMINI_API_KEY_3,
        process.env.GEMINI_API_KEY_4,
        process.env.GEMINI_API_KEY_5
    ].filter(Boolean) as string[];

    const allGoogleKeys = Array.from(new Set([google1, google2, ...extraUserGoogleKeys, ...extraEnvGoogleKeys].filter(Boolean) as string[]));

    // 3. Chave NVIDIA NIM
    const nvidiaKey = userKeys.find(k => 
        k.service.toLowerCase().includes('nvidia') || 
        k.id === 'nvidia-key'
    )?.key || process.env.NVIDIA_API_KEY;

    // 4. Chave Groq
    const groqKey = userKeys.find(k => 
        k.service.toLowerCase().includes('groq') || 
        k.id === 'groq-default'
    )?.key || process.env.GROQ_API_KEY || sovereignKeys.groq;

    // 5. Chave GitHub
    const githubKey = userKeys.find(k => 
        k.id === 'github-autonomy-token' ||
        k.service.toLowerCase().includes('github')
    )?.key || process.env.GITHUB_TOKEN;

    // 6. Chave Cerebras (Alquimista)
    const cerebrasKey = userKeys.find(k => 
        k.service.toLowerCase().includes('cerebras') || 
        k.id === 'cerebras-default'
    )?.key || process.env.CEREBRAS_API_KEY;

    // 7. Chave OpenRouter (Arkael)
    const openrouterKey = userKeys.find(k => 
        k.service.toLowerCase().includes('openrouter') || 
        k.id === 'openrouter-default'
    )?.key || process.env.OPENROUTER_API_KEY;

    return {
        google: allGoogleKeys[0] || '',
        gemini2: google2,
        googleKeys: allGoogleKeys,
        nvidia: nvidiaKey,
        groq: groqKey,
        github: githubKey,
        cerebras: cerebrasKey,
        openrouter: openrouterKey
    };
}
