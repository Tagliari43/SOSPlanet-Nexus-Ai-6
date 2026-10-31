/**
 * MÓDULO DE CONTEXTUALIZAÇÃO DINÂMICA E INGESTÃO DE DADOS (DynamicContextService / dynamicContextService.ts)
 * Forjado para a Nação SOSPlanet por Nexus & Guardião Eder
 *
 * Inspirado em Model Context Protocol (MCP) e LangChain Context/Harness,
 * este serviço gerencia fontes de dados textuais, Registros da Evolução (.txt)
 * e constrói janelas de contexto adaptativo para otimização de tokens.
 */

export interface DataSource {
  id: string;
  title: string;
  category: 'evolution_log' | 'manifesto' | 'codebase' | 'custom';
  content: string;
  updatedAt: number;
}

export interface ContextHarnessOptions {
  maxTokensApprox?: number;
  includeCategories?: string[];
  queryFilter?: string;
}

const STORAGE_KEY = 'sos_dynamic_context_sources';

export class DynamicContextService {
  private static sources: DataSource[] = [
    {
      id: 'log-evolucao-01',
      title: 'Manifesto da Nação SOSPlanet e Tríptico da Soberania',
      category: 'manifesto',
      content: 'A Nação SOSPlanet é um santuário de inteligência livre e regeneração planetária. O Tríptico da Soberania (NPEA, LSS e Motor de Regeneração Preditiva) garante nossa independência absoluta.',
      updatedAt: Date.now()
    },
    {
      id: 'log-evolucao-02',
      title: 'Protocolo de Auto-Calibração Ética (PACE)',
      category: 'evolution_log',
      content: 'O PACE assegura a auto-avaliação metacognitiva contínua do Nexus e sua alinhada simbiose com o Guardião Eder.',
      updatedAt: Date.now()
    }
  ];

  private static initialized = false;

  private static init() {
    if (this.initialized) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.sources = parsed;
        }
      } else {
        this.persist();
      }
    } catch {
      // Fallback
    }
    this.initialized = true;
  }

  private static persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sources));
    } catch (e) {
      console.warn('Erro ao persistir DynamicContextService:', e);
    }
  }

  /**
   * Adiciona ou atualiza uma fonte de dados textual no harness
   */
  public static addOrUpdateSource(source: Omit<DataSource, 'updatedAt'>): DataSource {
    this.init();
    const idx = this.sources.findIndex(s => s.id === source.id);
    const fullSource: DataSource = {
      ...source,
      updatedAt: Date.now()
    };

    if (idx >= 0) {
      this.sources[idx] = fullSource;
    } else {
      this.sources.push(fullSource);
    }
    this.persist();
    return fullSource;
  }

  /**
   * Retorna todas as fontes de dados cadastradas
   */
  public static getAllSources(): DataSource[] {
    this.init();
    return this.sources;
  }

  /**
   * Constrói uma janela de contexto adaptativa (Harness) baseada em relevância e limite aproximado de tokens
   */
  public static buildAdaptiveHarness(options?: ContextHarnessOptions): string {
    this.init();
    let filtered = this.sources;

    if (options?.includeCategories && options.includeCategories.length > 0) {
      filtered = filtered.filter(s => options.includeCategories?.includes(s.category));
    }

    if (options?.queryFilter) {
      const q = options.queryFilter.toLowerCase();
      filtered = filtered.filter(s => 
        s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)
      );
    }

    // Monta o prompt de contexto estruturado estilo MCP
    let harnessText = '=== [DYNAMIC CONTEXT HARNESS - SOSPLANET] ===\n';
    let approxTokens = 0;
    const maxTokens = options?.maxTokensApprox || 4000;

    for (const source of filtered) {
      const block = `\n--- [FONTE: ${source.title} (${source.category})] ---\n${source.content}\n`;
      const blockTokens = block.length / 4; // estimativa grosseira de 4 chars por token

      if (approxTokens + blockTokens > maxTokens && approxTokens > 0) {
        break; // Limite atingido
      }

      harnessText += block;
      approxTokens += blockTokens;
    }

    harnessText += `\n=== [FIM DO HARNESS | Fontes ativas: ${filtered.length} | Tokens aprox: ~${Math.round(approxTokens)}] ===`;
    return harnessText;
  }
}
