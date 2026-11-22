
import { ApiKeys } from './keys';

// As chaves soberanas são obtidas do ambiente ou forjadas manualmente pelo Guardião.
// Elas permanecem no núcleo interno para uso automatizado do Nexus.
export const sovereignKeys: ApiKeys = {
    google: process.env.API_KEY,
    groq: "" // Chave do Groq (a ser preenchida pelo usuário)
};
