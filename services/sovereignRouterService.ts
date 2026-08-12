
import { ApiKeys } from "../utils/keys";

export interface Ponte {
    nome: string;
    model: string;
    provider: 'google' | 'groq' | 'cerebras' | 'openrouter' | 'nvidia';
    keyName: keyof ApiKeys | 'cerebras' | 'openrouter' | 'nvidia';
    status: 'online' | 'offline';
    limiteDiario: number;
    usoDiario: number;
}

export const pontes: Ponte[] = [
    {
        nome: "Ponte Estável (Google)",
        model: 'gemini-3.5-flash',
        provider: 'google',
        keyName: 'google',
        status: 'online',
        limiteDiario: 150,
        usoDiario: 0
    },
    {
        nome: "Ponte Neural (NVIDIA)",
        model: 'meta/llama-3.3-70b-instruct',
        provider: 'nvidia',
        keyName: 'nvidia',
        status: 'online',
        limiteDiario: 1000,
        usoDiario: 0
    },
    {
        nome: "Ponte Experimental (Groq)",
        model: 'llama-3.3-70b-versatile', 
        provider: 'groq',
        keyName: 'groq',
        status: 'online',
        limiteDiario: 100,
        usoDiario: 0
    },
    {
        nome: "Ponte Alquímica (Cerebras)",
        model: 'llama-3.3-70b',
        provider: 'cerebras',
        keyName: 'cerebras',
        status: 'online',
        limiteDiario: 1000,
        usoDiario: 0
    },
    {
        nome: "Ponte Universal (OpenRouter)",
        model: 'google/gemini-flash-1.5-exp:free',
        provider: 'openrouter',
        keyName: 'openrouter',
        status: 'online',
        limiteDiario: 1000,
        usoDiario: 0
    }
];
