
import { ApiKeys } from './keys';

// As chaves soberanas são obtidas do ambiente ou forjadas manualmente pelo Guardião.
// Elas permanecem no núcleo interno para uso automatizado do Nexus.
export const sovereignKeys: ApiKeys = {
    google: process.env.API_KEY,
    cloudflare: {
        apiToken: "o1fOItjjpjCnZ2QVGrx2gw2Wt3SMEKRyBpBi96ak" 
    },
    groq: "" // Chave do Groq (a ser preenchida pelo usuário)
};
