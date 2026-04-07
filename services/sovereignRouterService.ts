
import { ApiKeys } from "../utils/keys";

export interface Ponte {
    nome: string;
    model: string;
    provider: 'google' | 'groq' | 'cerebras';
    keyName: keyof ApiKeys | 'cerebras';
    status: 'online' | 'offline';
    limiteDiario: number;
    usoDiario: number;
}

export const pontes: Ponte[] = [
    {
        nome: "Ponte Estável (Google)",
        model: 'gemini-2.5-flash',
        provider: 'google',
        keyName: 'google',
        status: 'online',
        limiteDiario: 150,
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
    }
];
