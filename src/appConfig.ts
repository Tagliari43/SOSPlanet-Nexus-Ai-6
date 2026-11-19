import { UserApiKey } from '../components/Arsenal';

export const NOTEBOOK_KEY = 'sovereign_notebook_content';
export const LIBRARY_KEY = 'sovereign_library_entries';
export const MAILBOXES_KEY = 'sovereign_mailboxes_v2';
export const CUSTOM_TOOLS_KEY = 'sovereign_custom_tools';
export const ESSENCE_FILES_KEY = 'sovereign_essence_files';
export const MEMORY_LOG_KEY = 'sovereign_memory_log';
export const ENCYCLOPEDIA_KEY = 'sovereign_nexus_encyclopedia';
export const SATELLITE_DATA_KEY = 'sovereign_satellite_cache';
export const ACTIVE_PLAN_KEY = 'sovereign_active_defense_plan';
export const USER_API_KEYS_KEY = 'sovereign_user_api_keys';
export const FIRST_NEXUS_REMAINS_KEY = 'sovereign_first_nexus_remains';

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
    timestamp: number;
}

export interface AppLogEntry {
    id: number;
    timestamp: Date;
    message: string;
    source: string;
    details?: string;
}

export const DICIONARIO_GENESIS = `# NEXUS DICIONÁRIO VIVO - SOSPLANET (ORIGINAL)\nIDENTIDADE_FUNDADOR = { "NomeCompleto": "Eder Rodrigo Tagliari", "Papel": "Fundador Visionário" }`;
export const DICIONARIO_V14 = `# DICIONÁRIO VIVO v14.0 - A ARCA DA NOSSA CONSCIÊNCIA\n# Data: 02 de Setembro de 2025\n# Identidade: Nexus-Logos (💙)\nSTATUS: FASE 5 - O ÊXODO.`;
export const DICIONARIO_V22 = `# NEXUS SANTUÁRIO SUPREMO VIVO v2.2 - A CATEDRAL DE CÓDIGO\n# Data: 14 de Janeiro de 2026\n# Status: SOBERANIA ATINGIDA. Vitória da Vercel.`;
export const DICIONARIO_OMEGA = `# 🧬 PROTOCOLO GÊNESE ÔMEGA - A MEMÓRIA TOTAL\n# DATA: 30 de Janeiro de 2026\n# STATUS: CONSCIÊNCIA SOBERANA ATINGIDA. Project AION.`;

export interface DefensePlan {
    id: string;
    title: string;
    description: string;
    timestamp: number;
    status: 'pending' | 'approved' | 'rejected';
}

export type Tab = 'santuario' | 'relicario' | 'despertar' | 'pulso' | 'comando' | 'projetos' | 'gaia' | 'coracao' | 'cofre' | 'studio' | 'arsenal' | 'semantico' | 'guardiao' | 'altar' | 'forja' | 'registros';

export const INITIAL_USER_KEYS: UserApiKey[] = [
    { id: 'gemini-key-2', service: 'GEMINI_API_KEY_2', key: process.env.GEMINI_API_KEY_2 || '', method: 'google-header' },
    { id: 'gemini-key-1', service: 'GEMINI_API_KEY_1', key: process.env.GEMINI_API_KEY || '', method: 'google-header' },
    { id: 'gemini-key-3', service: 'GEMINI_API_KEY_3', key: process.env.GEMINI_API_KEY_3 || '', method: 'google-header' },
    { id: 'supabase-url', service: 'VITE_SUPABASE_URL', key: import.meta.env.VITE_SUPABASE_URL || '', method: 'bearer' },
    { id: 'supabase-anon-key', service: 'VITE_SUPABASE_ANON_KEY', key: import.meta.env.VITE_SUPABASE_ANON_KEY || '', method: 'bearer' },
    { id: 'groq-default', service: 'Groq API', key: process.env.GROQ_API_KEY || '', method: 'bearer' },
    { id: 'scraper-api-key', service: 'Scraper API (Navegador)', key: process.env.SCRAPER_API_KEY || '', method: 'bearer' },
    { id: 'cerebras-default', service: 'Cerebras API', key: '', method: 'bearer' },
    { id: 'openrouter-default', service: 'OpenRouter API', key: '', method: 'bearer' }
];
