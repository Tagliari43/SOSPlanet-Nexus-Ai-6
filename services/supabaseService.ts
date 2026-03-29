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
}

/**
 * Salva uma nova memória no Cofre Semântico (Supabase)
 */
export async function saveMemoryToSupabase(content: string, embedding: number[], metadata: Record<string, any> = {}): Promise<boolean> {
    if (!supabase) {
        console.warn("Supabase não inicializado. Chaves ausentes.");
        return false;
    }

    try {
        const { error } = await supabase
            .from('memories')
            .insert([
                { 
                    content, 
                    embedding, 
                    metadata 
                }
            ]);

        if (error) {
            console.error("Erro ao salvar memória no Supabase:", error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Falha crítica ao salvar memória:", err);
        return false;
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
