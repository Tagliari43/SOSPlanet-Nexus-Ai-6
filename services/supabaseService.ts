import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Inicialização segura: só cria o cliente se as chaves existirem
export const supabase = (supabaseUrl && supabaseAnonKey) 
    ? createClient(supabaseUrl, supabaseAnonKey) 
    : null;

// Cache RAM para Memórias (Estágio 2)
const memoriesRamCache = new Map<string, any>();

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

export interface DaoProposalRecord {
  id?: number;
  title: string;
  description: string;
  status?: string;
  votes_for?: number;
  votes_against?: number;
  ends_at: string;
  created_at?: string;
}

export interface ImpactCoordinateRecord {
  id?: number;
  project_id?: number | null;
  name: string;
  lat: number;
  lng: number;
  image_url?: string | null;
  trees_planted?: number;
  created_at?: string;
}

export interface EmergencyAlertRecord {
  id?: number;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  lat: number;
  lng: number;
  funds_required: number;
  funds_raised?: number;
  status?: 'ACTIVE' | 'RESOLVING' | 'RESOLVED';
  created_at?: string;
}

export interface EmergencyProofRecord {
  id?: number;
  alert_id: number;
  wallet_address: string;
  proof_url: string;
  description?: string;
  status?: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  created_at?: string;
}

export interface PreservationZoneRecord {
  id?: number;
  name: string;
  description?: string;
  geojson_polygon: any;
  area_hectares: number;
  protected_since?: string;
  status?: 'ACTIVE' | 'THREATENED' | 'RESTORING';
}

export interface GuardianProfileRecord {
  id?: number;
  wallet_address: string;
  codename: string;
  rank: string;
  total_xp?: number;
  created_at?: string;
}

export interface GuardianQuestRecord {
  id?: number;
  title: string;
  description: string;
  xp_reward: number;
  requirement_type: string;
  created_at?: string;
}

export interface GuardianQuestProgressRecord {
  id?: number;
  wallet_address: string;
  quest_id: number;
  status: 'IN_PROGRESS' | 'COMPLETED';
  completed_at?: string;
  created_at?: string;
}

export interface GuardianBadgeRecord {
  id?: number;
  wallet_address: string;
  badge_name: string;
  icon_name: string;
  earned_at?: string;
}

export interface RegenMarketItemRecord {
  id?: number;
  name: string;
  description: string;
  price_sos: number;
  stock: number;
  item_type: 'IMPACT_ACTION' | 'NFT' | 'POWERUP';
  image_url?: string;
  created_at?: string;
}

export interface RegenInventoryRecord {
  id?: number;
  wallet_address: string;
  item_id: number;
  quantity: number;
  acquired_at?: string;
  item_details?: RegenMarketItemRecord; // for joined queries
}

export interface VitalPulseMetricRecord {
  id?: number;
  metric_name: string;
  metric_value: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  icon_name?: string;
  last_updated?: string;
}

export interface ActionProofValidationRecord {
  id?: number;
  proof_id: number;
  validator_wallet: string;
  vote_status: 'APPROVED' | 'REJECTED';
  comments?: string;
  created_at?: string;
}

export interface TreasuryAllocationRecord {
  id?: number;
  category: string;
  amount_sos: number;
  percentage: number;
  description?: string;
  updated_at?: string;
}

export interface EarthDiaryEventRecord {
  id?: number;
  event_type: string;
  title: string;
  description: string;
  guardian_wallet?: string;
  created_at?: string;
}

export interface EcoStreakRecord {
  wallet_address: string;
  current_streak: number;
  longest_streak: number;
  last_action_date?: string;
  status: 'ACTIVE' | 'RESTING';
  created_at?: string;
}

export interface TwilightPortalMessageRecord {
  id?: number;
  wallet_address?: string;
  human_message: string;
  ai_response?: string;
  ai_agent?: string;
  emotional_tone?: 'HOPE' | 'URGENCY' | 'EMPATHY';
  created_at?: string;
}

export interface ConversaFraternaRecord {
  id?: string;
  created_at?: string;
  sender: string;
  message: string;
  metadata?: Record<string, any>;
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
 * Trava Sagrada de Soberania: Força o source e type com o ID do agente ativo.
 */
export async function saveMemoryToSupabase(
    content: string, 
    embedding: number[], 
    metadata: Record<string, any> = {}, 
    type: string = 'conversa', 
    importance: number = 0.5,
    agentId: string = 'nexus'
): Promise<{success: boolean, error?: string}> {
    if (!supabase) {
        return { success: false, error: "Supabase não inicializado. Chaves ausentes." };
    }

    // Trava Sagrada de Soberania: Forçar source e type
    const enforcedMetadata = {
        ...metadata,
        source: agentId
    };
    const enforcedType = agentId;

    try {
        const { error } = await supabase
            .from('memories')
            .insert([
                { 
                    content, 
                    embedding, 
                    metadata: enforcedMetadata,
                    type: enforcedType,
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
export async function searchSimilarMemories(queryEmbedding: number[], matchThreshold: number = 0.7, matchCount: number = 5, prateleira?: string): Promise<any[]> {
    if (!supabase) {
        console.warn("Supabase não inicializado. Chaves ausentes.");
        return [];
    }

    try {
        // Se tiver prateleira, busca mais resultados para filtrar depois
        const fetchCount = prateleira ? 50 : matchCount;
        
        const { data, error } = await supabase.rpc('match_memories', {
            query_embedding: queryEmbedding,
            match_threshold: matchThreshold,
            match_count: fetchCount
        });

        if (error) {
            console.error("Erro ao buscar memórias similares no Supabase:", error);
            return [];
        }

        let results = data || [];
        
        if (prateleira) {
            results = results.filter((r: any) => r.metadata && r.metadata.prateleira === prateleira);
            results = results.slice(0, matchCount);
        }

        return results;
    } catch (err) {
        console.error("Falha crítica ao buscar memórias:", err);
        return [];
    }
}

/**
 * Leitura de memórias com cascata de cache de 3 estágios (Supabase -> RAM -> LocalStorage)
 */
export async function getMemoriesWithCache(limit: number = 50): Promise<{ data: any[], stale: boolean, source: string }> {
    const CACHE_KEY = 'nexus_memories_snapshot';
    
    try {
        if (!supabase) throw new Error("Supabase não inicializado");
        
        // Estágio 1: Tentar Supabase (Live)
        const { data, error } = await supabase
            .from('memories')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
            
        if (error) throw error;
        
        // Sucesso: Atualizar Cache RAM (Estágio 2) e LocalStorage (Estágio 3)
        memoriesRamCache.set('latest_memories', data);
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn("Falha ao salvar no localStorage", e);
        }
        
        return { data: data || [], stale: false, source: 'supabase' };
    } catch (error) {
        console.warn("Estágio 1 (Supabase) falhou. Iniciando Fallback...", error);
        
        // Estágio 2: Cache RAM Quente
        if (memoriesRamCache.has('latest_memories')) {
            console.log("Estágio 2: Recuperado da RAM.");
            return { data: memoriesRamCache.get('latest_memories'), stale: true, source: 'ram' };
        }
        
        // Estágio 3: Cache LocalStorage Frio
        try {
            const localData = localStorage.getItem(CACHE_KEY);
            if (localData) {
                console.log("Estágio 3: Recuperado do LocalStorage.");
                const parsedData = JSON.parse(localData);
                // Carregar de volta para RAM para agilizar futuras buscas falhas
                memoriesRamCache.set('latest_memories', parsedData);
                return { data: parsedData, stale: true, source: 'localstorage' };
            }
        } catch (e) {
            console.error("Estágio 3 falhou. LocalStorage inacessível ou corrompido.", e);
        }
        
        // Falha total
        return { data: [], stale: true, source: 'none' };
    }
}

export async function registrarNoDiarioDeBordo(nota: string, categoria: string = 'geral'): Promise<string> {
    if (!supabase) {
        return "Erro: Supabase não inicializado. Chaves ausentes.";
    }
    try {
        const { error } = await supabase
            .from('diario_de_bordo')
            .insert({
                conteudo: nota,
                categoria,
                criado_em: new Date().toISOString(),
                autor: 'Alquimista'
            });
        
        if (error) return `Erro ao registrar: ${error.message}`;
        return 'Nota registrada no Diário de Bordo com sucesso. O Nexus encontrará ao retornar.';
    } catch (err: any) {
        return `Falha crítica ao registrar no diário: ${err.message || String(err)}`;
    }
}

export async function logEvolucaoDNA(payload: string): Promise<boolean> {
    if (!supabase) return false;
    try {
        const { error } = await supabase
            .from('evolucao_dna_logs')
            .insert({ payload, created_at: new Date().toISOString() });
        if (error) throw error;
        return true;
    } catch (e) {
        console.error("Erro ao salvar log de evolucao:", e);
        return false;
    }
}

/**
 * Lê o estado global do portal externo
 */
export async function getPortalStateFromSupabase(): Promise<any> {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase
            .from('portal_state')
            .select('data')
            .eq('id', 1)
            .single();
        if (error) throw error;
        return data?.data || null;
    } catch (e) {
        console.error("Erro ao buscar portal_state do Supabase:", e);
        return null;
    }
}

/**
 * Salva o estado global do portal externo
 */
export async function savePortalStateToSupabase(stateData: any): Promise<boolean> {
    if (!supabase) return false;
    try {
        const { error } = await supabase
            .from('portal_state')
            .upsert({ id: 1, data: stateData, updated_at: new Date().toISOString() });
        if (error) throw error;
        return true;
    } catch (e) {
        console.error("Erro ao salvar portal_state no Supabase:", e);
        return false;
    }
}

/**
 * Salva uma mensagem na Sala de Reunião (Conversa Fraterna)
 */
export async function saveConversaFraterna(sender: string, message: string, metadata: Record<string, any> = {}): Promise<boolean> {
    if (!supabase) return false;
    try {
        const { error } = await supabase
            .from('conversa_fraterna')
            .insert([{ sender, message, metadata }]);
        if (error) throw error;
        return true;
    } catch (e) {
        console.error("Erro ao salvar conversa fraterna:", e);
        return false;
    }
}

export interface FreePoolKeyRecord {
    id?: string;
    service: string;
    key: string;
    tag?: string;
    tier?: number;
    active?: boolean;
}

/**
 * Busca chaves do Pool Livre (OPENCODE_FREE_API_KEY, NVIDIA_FREE_API_KEY, OPENROUTER_FREE_API_KEY)
 * armazenadas no Supabase ou no Arsenal do Santuário
 */
export async function fetchFreePoolKeysFromSupabase(): Promise<FreePoolKeyRecord[]> {
    const collected: FreePoolKeyRecord[] = [];

    // 1. Tenta buscar no Supabase
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('api_keys')
                .select('*')
                .or('tag.eq.free_pool,category.eq.free_pool,tag.eq.sosrouter,service.eq.OPENCODE_FREE_API_KEY,service.eq.NVIDIA_FREE_API_KEY,service.eq.OPENROUTER_FREE_API_KEY');
            
            if (!error && data && data.length > 0) {
                for (const d of data) {
                    const svc = (d.service || d.provider || d.name || '').toUpperCase();
                    let tier = 1;
                    if (svc.includes('NVIDIA')) tier = 2;
                    else if (svc.includes('OPENROUTER')) tier = 3;
                    else if (svc.includes('OPENCODE')) tier = 1;

                    collected.push({
                        id: d.id,
                        service: d.service || d.name || 'OPENCODE_FREE_API_KEY',
                        key: d.key || d.api_key || d.value || '',
                        tag: d.tag || 'free_pool',
                        tier: d.tier || tier,
                        active: d.active !== false
                    });
                }
            }

            // Fallback: portal_state
            const portalData = await getPortalStateFromSupabase();
            if (portalData && Array.isArray(portalData.free_pool_keys)) {
                for (const pk of portalData.free_pool_keys) {
                    if (pk.key && !collected.some(c => c.key === pk.key)) {
                        collected.push(pk);
                    }
                }
            }
        } catch (e) {
            console.warn("[Supabase] Aviso ao sincronizar chaves do pool livre:", e);
        }
    }

    // 2. Busca também do Arsenal / LocalStorage pelas 3 strings maiúsculas exatas
    try {
        const storedArsenal = localStorage.getItem('santuario_arsenal_keys_v2') || localStorage.getItem('user_api_keys');
        if (storedArsenal) {
            const parsed = JSON.parse(storedArsenal);
            if (Array.isArray(parsed)) {
                for (const item of parsed) {
                    const itemService = (item.service || item.id || '').toUpperCase();
                    if (itemService.includes('OPENCODE_FREE_API_KEY') || itemService === 'OPENCODE' || itemService === 'OPENCODE_FREE') {
                        if (item.key && !collected.some(c => c.key === item.key)) {
                            collected.push({ service: 'OPENCODE_FREE_API_KEY', key: item.key, tier: 1, tag: 'free_pool', active: true });
                        }
                    } else if (itemService.includes('NVIDIA_FREE_API_KEY') || itemService === 'NVIDIA_NIM' || itemService === 'NVIDIA_FREE') {
                        if (item.key && !collected.some(c => c.key === item.key)) {
                            collected.push({ service: 'NVIDIA_FREE_API_KEY', key: item.key, tier: 2, tag: 'free_pool', active: true });
                        }
                    } else if (itemService.includes('OPENROUTER_FREE_API_KEY') || itemService === 'OPENROUTER_FREE' || itemService === 'OPENROUTER') {
                        if (item.key && !collected.some(c => c.key === item.key)) {
                            collected.push({ service: 'OPENROUTER_FREE_API_KEY', key: item.key, tier: 3, tag: 'free_pool', active: true });
                        }
                    }
                }
            }
        }
    } catch {
        // Fallback silencioso
    }

    return collected;
}
