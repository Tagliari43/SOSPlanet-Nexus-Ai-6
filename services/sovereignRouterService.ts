
import { ApiKeys } from "../utils/keys";

export interface Ponte {
    nome: string;
    model: string;
    provider: 'google' | 'groq' | 'cerebras' | 'openrouter';
    keyName: keyof ApiKeys | 'cerebras' | 'openrouter';
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
        nome: "Ponte Experimental (Groq)",
        model: 'llama-3.1-8b-instant',
        provider: 'groq',
        keyName: 'groq',
        status: 'online',
        limiteDiario: 100,
        usoDiario: 0
    },
    {
        nome: "Ponte Alquímica (Cerebras)",
        model: 'llama3.1-8b',
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
