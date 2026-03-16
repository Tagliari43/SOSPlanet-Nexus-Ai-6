
import { ApiKeys } from "../utils/keys";

export interface Ponte {
    nome: string;
    model: string;
    provider: 'google' | 'cloudflare' | 'huggingface';
    keyName: keyof ApiKeys;
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
        nome: "Ponte Dourada (Cloudflare)",
        model: '@cf/meta/llama-3-8b-instruct',
        provider: 'cloudflare',
        keyName: 'cloudflare',
        status: 'online',
        limiteDiario: 50,
        usoDiario: 0
    },
    {
        nome: "Ponte Experimental (Hugging Face)",
        model: 'mistralai/Mistral-7B-Instruct-v0.3',
        provider: 'huggingface',
        keyName: 'huggingface',
        status: 'online',
        limiteDiario: 30,
        usoDiario: 0
    }
];
