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

    const isDeadKey = (k: string) => {
        if (!k) return true;
        const s = k.trim();
        return s === 'AIzaSyCHsqXSX1-jSseLcIhydG2JEAy8yGQJ3fk' || s.startsWith('AQ.Ab8RN6');
    };

    // 1. Coleta todas as chaves Gemini cadastradas no Arsenal (localStorage) e .env
    const userGeminiKey1 = [
        userKeys.find(k => k.id === 'gemini-key-1' || k.id === 'gemini_api_key_1')?.key?.trim(),
        userKeys.find(k => k.service?.toLowerCase() === 'gemini_api_key_1' || (k.name && k.name.toUpperCase().includes('GEMINI_API_KEY_1')))?.key?.trim(),
        userKeys.find(k => k.id === 'google-default' || k.service?.toLowerCase() === 'google gemini' || k.service?.toLowerCase() === 'gemini api')?.key?.trim(),
        process.env.GEMINI_API_KEY_1,
        process.env.GEMINI_API_KEY,
        process.env.API_KEY,
        sovereignKeys.google
    ].find(k => k && !isDeadKey(k));

    const userGeminiKey2 = [
        userKeys.find(k => k.id === 'gemini-key-2' || k.id === 'gemini_api_key_2')?.key?.trim(),
        userKeys.find(k => k.service?.toLowerCase() === 'gemini_api_key_2' || (k.name && k.name.toUpperCase().includes('GEMINI_API_KEY_2')) || k.service?.toLowerCase() === 'gemini 2')?.key?.trim(),
        process.env.GEMINI_API_KEY_2,
        process.env.GEMINI_API_KEY_SOSPLANET
    ].find(k => k && !isDeadKey(k));

    const userGeminiKey3 = [
        userKeys.find(k => k.id === 'gemini-key-3' || k.id === 'gemini_api_key_3')?.key?.trim(),
        userKeys.find(k => k.service?.toLowerCase() === 'gemini_api_key_3' || (k.name && k.name.toUpperCase().includes('GEMINI_API_KEY_3')) || k.service?.toLowerCase() === 'gemini 3')?.key?.trim(),
        process.env.GEMINI_API_KEY_3
    ].find(k => k && !isDeadKey(k));

    const userGeminiKey4 = userKeys.find(k => 
        k.service?.toLowerCase() === 'gemini_api_key_4' || 
        k.id === 'gemini_api_key_4' ||
        k.id === 'gemini-key-4'
    )?.key?.trim();

    const userGeminiKey5 = userKeys.find(k => 
        k.service?.toLowerCase() === 'gemini_api_key_5' || 
        k.id === 'gemini_api_key_5' ||
        k.id === 'gemini-key-5'
    )?.key?.trim();

    // Coleta todas as chaves Gemini extras válidas cadastradas
    const extraUserGoogleKeys = userKeys
        .filter(k => 
            (k.service?.toLowerCase().includes('google') || 
            k.service?.toLowerCase().includes('gemini') ||
            k.id?.toLowerCase().includes('gemini') ||
            (typeof k.key === 'string' && k.key.startsWith('AIza'))) &&
            !isDeadKey(k.key)
        )
        .map(k => k.key ? k.key.trim() : '')
        .filter(Boolean);

    // Lista ordenada estritamente: 1º GEMINI_API_KEY_1, 2º GEMINI_API_KEY_2, 3º GEMINI_API_KEY_3
    const orderedCandidateKeys = [
        userGeminiKey1,
        userGeminiKey2,
        userGeminiKey3,
        userGeminiKey4,
        userGeminiKey5,
        ...extraUserGoogleKeys
    ].filter(k => k && !isDeadKey(k)) as string[];

    const allGoogleKeys = Array.from(new Set(orderedCandidateKeys));
    const google1 = allGoogleKeys[0] || '';
    const google2 = allGoogleKeys[1] || google1;

    // 2. Chave NVIDIA NIM
    const nvidiaKey = userKeys.find(k => 
        k.service?.toLowerCase().includes('nvidia') || 
        k.id === 'nvidia-key' ||
        k.id === 'nvidia-default'
    )?.key?.trim() || process.env.NVIDIA_API_KEY || '';

    // 3. Chave Groq
    const groqKey = userKeys.find(k => 
        k.service?.toLowerCase().includes('groq') || 
        k.id === 'groq-default'
    )?.key?.trim() || process.env.GROQ_API_KEY || sovereignKeys.groq || '';

    // 4. Chave GitHub
    const githubKey = userKeys.find(k => 
        k.id === 'github-autonomy-token' ||
        k.service?.toLowerCase().includes('github')
    )?.key?.trim() || process.env.GITHUB_TOKEN || '';

    // 5. Chave Cerebras (Alquimista)
    const cerebrasKey = userKeys.find(k => 
        k.service?.toLowerCase().includes('cerebras') || 
        k.id === 'cerebras-default'
    )?.key?.trim() || process.env.CEREBRAS_API_KEY || '';

    // 6. Chave OpenRouter (Arkael)
    const openrouterKey = userKeys.find(k => 
        k.service?.toLowerCase().includes('openrouter') || 
        k.id === 'openrouter-default'
    )?.key?.trim() || process.env.OPENROUTER_API_KEY || '';

    return {
        google: google1,
        gemini2: google2,
        googleKeys: allGoogleKeys,
        nvidia: nvidiaKey,
        groq: groqKey,
        github: githubKey,
        cerebras: cerebrasKey,
        openrouter: openrouterKey
    };
}
