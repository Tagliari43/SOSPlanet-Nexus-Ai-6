import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Inicialização segura: só cria o cliente se as chaves existirem
export const supabase = (supabaseUrl && supabaseAnonKey) 
    ? createClient(supabaseUrl, supabaseAnonKey) 
    : null;

export interface MemoryRecord {
    id?: number;
    content: string;
    embedding: number[];
    metadata?: Record<string, any>;
    created_at?: string;
    type?: string;
    importance?: number;
}

export interface AgentLogRecord {
    id?: number;
    agent_name: string;
    task_description: string;
    execution_result: string;
    success: boolean;
    duration_ms?: number;
    tokens_used?: number;
    created_at?: string;
}

/**
 * Salva um log de execução de agente no Supabase
 */
export async function saveAgentLogToSupabase(log: AgentLogRecord): Promise<{success: boolean, error?: string}> {
    if (!supabase) {
        return { success: false, error: "Supabase não inicializado. Chaves ausentes." };
    }

    try {
        const { error } = await supabase
            .from('agent_logs')
            .insert([log]);

        if (error) {
            console.error("Erro ao salvar log de agente no Supabase:", error);
            return { success: false, error: error.message || JSON.stringify(error) };
        }

        return { success: true };
    } catch (err: any) {
        console.error("Falha crítica ao salvar log de agente:", err);
        return { success: false, error: err.message || String(err) };
    }
}

/**
 * Salva uma nova memória no Cofre Semântico (Supabase)
 */
export async function saveMemoryToSupabase(content: string, embedding: number[], metadata: Record<string, any> = {}, type: string = 'conversa', importance: number = 0.5): Promise<{success: boolean, error?: string}> {
    if (!supabase) {
        return { success: false, error: "Supabase não inicializado. Chaves ausentes." };
    }

    try {
        const { error } = await supabase
            .from('memories')
            .insert([
                { 
                    content, 
                    embedding, 
                    metadata,
                    type,
                    importance
                }
            ]);

        if (error) {
            console.error("Erro ao salvar memória no Supabase:", error);
            return { success: false, error: error.message || JSON.stringify(error) };
        }

        return { success: true };
    } catch (err: any) {
        console.error("Falha crítica ao salvar memória:", err);
        return { success: false, error: err.message || String(err) };
    }
}

/**
 * Busca memórias similares usando a função match_memories do Supabase (RAG)
 */
export async function searchSimilarMemories(queryEmbedding: number[], matchThreshold: number = 0.7, matchCount: number = 5): Promise<any[]> {
    if (!supabase) {
        console.warn("Supabase não inicializado. Chaves ausentes.");
        return [];
    }

    try {
        const { data, error } = await supabase.rpc('match_memories', {
            query_embedding: queryEmbedding,
            match_threshold: matchThreshold,
            match_count: matchCount
        });

        if (error) {
            console.error("Erro ao buscar memórias similares no Supabase:", error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error("Falha crítica ao buscar memórias:", err);
        return [];
    }
}
