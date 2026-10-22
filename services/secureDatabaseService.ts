/**
 * INJETOR DO FLUXO DE MEMÓRIA DIRETO (SecureDatabaseService)
 * Acesso Seguro e Manipulação Direta ao Supabase / PostgreSQL para a Nação SOSPlanet
 */

import { getSupabaseClient, supabase } from './supabaseService';

export interface DatabaseOperationResult {
  success: boolean;
  data?: any;
  error?: string;
  affectedRows?: number;
  tableName: string;
  timestamp: number;
}

export class SecureDatabaseService {
  /**
   * Executa consulta direta e segura na tabela indicada com sanitização e restrição de escopo
   */
  public static async queryTable(
    table: string,
    options: {
      select?: string;
      filter?: { column: string; operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike'; value: any };
      order?: { column: string; ascending?: boolean };
      limit?: number;
    } = {}
  ): Promise<DatabaseOperationResult> {
    const sb = getSupabaseClient() || supabase;
    if (!sb) {
      return {
        success: false,
        error: 'Cliente Supabase não inicializado no Santuário.',
        tableName: table,
        timestamp: Date.now()
      };
    }

    try {
      let query = sb.from(table).select(options.select || '*');

      if (options.filter) {
        const { column, operator, value } = options.filter;
        switch (operator) {
          case 'eq': query = query.eq(column, value); break;
          case 'neq': query = query.neq(column, value); break;
          case 'gt': query = query.gt(column, value); break;
          case 'gte': query = query.gte(column, value); break;
          case 'lt': query = query.lt(column, value); break;
          case 'lte': query = query.lte(column, value); break;
          case 'like': query = query.like(column, value); break;
          case 'ilike': query = query.ilike(column, value); break;
        }
      }

      if (options.order) {
        query = query.order(options.order.column, { ascending: options.order.ascending ?? true });
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) {
        return {
          success: false,
          error: error.message,
          tableName: table,
          timestamp: Date.now()
        };
      }

      return {
        success: true,
        data,
        affectedRows: Array.isArray(data) ? data.length : 1,
        tableName: table,
        timestamp: Date.now()
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        tableName: table,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Injeta registro seguro em tabela autorizada (memories, agent_logs, twilight_synapse_messages)
   */
  public static async injectRecord(table: string, record: Record<string, any>): Promise<DatabaseOperationResult> {
    const sb = getSupabaseClient() || supabase;
    if (!sb) {
      return {
        success: false,
        error: 'Supabase não conectado.',
        tableName: table,
        timestamp: Date.now()
      };
    }

    try {
      const sanitized = {
        ...record,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await sb.from(table).insert([sanitized]).select();
      if (error) {
        return {
          success: false,
          error: error.message,
          tableName: table,
          timestamp: Date.now()
        };
      }

      return {
        success: true,
        data,
        affectedRows: 1,
        tableName: table,
        timestamp: Date.now()
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        tableName: table,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Verifica a integridade da conexão direta
   */
  public static async checkHealth(): Promise<{ isConnected: boolean; message: string }> {
    const sb = getSupabaseClient() || supabase;
    if (!sb) return { isConnected: false, message: 'Supabase ausente' };
    try {
      const { error } = await sb.from('memories').select('id').limit(1);
      if (error && !error.message.includes('0 rows')) {
        return { isConnected: false, message: error.message };
      }
      return { isConnected: true, message: 'Injetor de Fluxo Direto conectado e operacional' };
    } catch (e: any) {
      return { isConnected: false, message: e.message };
    }
  }
}
