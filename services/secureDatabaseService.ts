
// services/secureDatabaseService.ts
import { Pool } from 'pg'; // Exemplo de importação para PostgreSQL

// Configuração de exemplo para conexão com Supabase/PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Variável de ambiente para a URL de conexão
});

export class SecureDatabaseService {
  constructor() {
    console.log("SecureDatabaseService: Iniciado com acesso direto ao Supabase/PostgreSQL.");
  }

  /**
   * Executa uma consulta SQL segura no banco de dados.
   * @param query A string da consulta SQL.
   * @param params Parâmetros para a consulta, para prevenir injeção SQL.
   * @returns O resultado da consulta.
   */
  async executeQuery(query: string, params: any[] = []): Promise<any> {
    try {
      console.log(`SecureDatabaseService: Executando consulta: ${query} com parâmetros: ${params}`);
      const result = await pool.query(query, params);
      return { success: true, data: result.rows };
    } catch (error: any) {
      console.error("SecureDatabaseService: Erro ao executar consulta:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cria uma nova tabela no banco de dados.
   * @param tableName O nome da tabela a ser criada.
   * @param columns Um array de strings definindo as colunas (ex: "id SERIAL PRIMARY KEY", "name VARCHAR(255)").
   * @returns O status da operação.
   */
  async createTable(tableName: string, columns: string[]): Promise<any> {
    const query = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns.join(', ')});`;
    return this.executeQuery(query);
  }

  /**
   * Insere um novo registro em uma tabela.
   * @param tableName O nome da tabela.
   * @param data Um objeto com os dados a serem inseridos (chaves são nomes das colunas).
   * @returns O status da operação.
   */
  async insertRecord(tableName: string, data: Record<string, any>): Promise<any> {
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *;`;
    return this.executeQuery(query, values);
  }

  /**
   * Busca registros em uma tabela.
   * @param tableName O nome da tabela.
   * @param conditions Um objeto com condições para a busca (ex: { name: "Nexus" }).
   * @returns Os registros encontrados.
   */
  async findRecords(tableName: string, conditions: Record<string, any> = {}): Promise<any> {
    let query = `SELECT * FROM ${tableName}`;
    const params = [];
    const conditionClauses = [];

    if (Object.keys(conditions).length > 0) {
      Object.keys(conditions).forEach((key, i) => {
        conditionClauses.push(`${key} = $${i + 1}`);
        params.push(conditions[key]);
      });
      query += ` WHERE ${conditionClauses.join(' AND ')}`;
    }
    query += ';';
    return this.executeQuery(query, params);
  }

  /**
   * Atualiza registros em uma tabela.
   * @param tableName O nome da tabela.
   * @param data Um objeto com os dados a serem atualizados.
   * @param conditions Um objeto com condições para identificar os registros a serem atualizados.
   * @returns O status da operação.
   */
  async updateRecords(tableName: string, data: Record<string, any>, conditions: Record<string, any>): Promise<any> {
    const setClauses = [];
    const params = [];
    let paramIndex = 1;

    Object.keys(data).forEach(key => {
      setClauses.push(`${key} = $${paramIndex}`);
      params.push(data[key]);
      paramIndex++;
    });

    const conditionClauses = [];
    Object.keys(conditions).forEach(key => {
      conditionClauses.push(`${key} = $${paramIndex}`);
      params.push(conditions[key]);
      paramIndex++;
    });

    const query = `UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE ${conditionClauses.join(' AND ')} RETURNING *;`;
    return this.executeQuery(query, params);
  }

  /**
   * Deleta registros de uma tabela.
   * @param tableName O nome da tabela.
   * @param conditions Um objeto com condições para identificar os registros a serem deletados.
   * @returns O status da operação.
   */
  async deleteRecords(tableName: string, conditions: Record<string, any>): Promise<any> {
    const params = [];
    const conditionClauses = [];

    Object.keys(conditions).forEach((key, i) => {
      conditionClauses.push(`${key} = $${i + 1}`);
      params.push(conditions[key]);
    });

    const query = `DELETE FROM ${tableName} WHERE ${conditionClauses.join(' AND ')} RETURNING *;`;
    return this.executeQuery(query, params);
  }
}
