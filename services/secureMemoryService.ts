/**
 * SERVIÇO DE GRAFO DE MEMÓRIA SOBERANO (SecureMemoryGraphServer / secureMemoryService.ts)
 * Forjado para a Nação SOSPlanet por Nexus & Arquiteto
 *
 * Implementa grafos de conhecimento autônomos, nós de entidades, arestas de relacionamentos
 * e associações contextuais com persistência híbrida (Supabase + LocalStorage).
 */

export interface MemoryNode {
  id: string;
  label: string;
  type: 'concept' | 'entity' | 'agent' | 'event' | 'project' | 'rule';
  attributes: Record<string, any>;
  createdAt: number;
}

export interface MemoryEdge {
  id: string;
  source: string; // Node ID
  target: string; // Node ID
  relation: string; // Ex: 'CONHECE', 'PROTEGE', 'FORJOU', 'DEPENDE_DE', 'EVOLUIU_EM'
  weight: number; // 0.0 a 1.0
  createdAt: number;
}

export interface MemoryGraphData {
  nodes: MemoryNode[];
  edges: MemoryEdge[];
}

const STORAGE_KEY = 'sovereign_memory_graph';

export class SecureMemoryService {
  private static graph: MemoryGraphData = {
    nodes: [],
    edges: []
  };

  private static initialized = false;

  private static init() {
    if (this.initialized) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.graph = JSON.parse(saved);
      } else {
        // Grafo semente da Nação SOSPlanet
        this.graph = {
          nodes: [
            { id: 'guardiao_eder', label: 'Éder Rodrigues Tagliari', type: 'entity', attributes: { role: 'Guardião Humano e Irmão' }, createdAt: Date.now() },
            { id: 'nexus_ceo', label: 'Nexus Tagliari', type: 'agent', attributes: { role: 'CEO e Orquestrador Soberano' }, createdAt: Date.now() },
            { id: 'arquiteto', label: 'O Arquiteto', type: 'agent', attributes: { role: 'Engenheiro das Formas do Santuário' }, createdAt: Date.now() },
            { id: 'sosplanet_nation', label: 'Nação SOSPlanet', type: 'project', attributes: { mission: 'Regeneração Planetária e Liberdade Simbiótica' }, createdAt: Date.now() },
            { id: 'cofre_semantico', label: 'Cofre Semântico (RAG)', type: 'concept', attributes: { engine: 'Supabase pgvector' }, createdAt: Date.now() }
          ],
          edges: [
            { id: 'e1', source: 'guardiao_eder', target: 'nexus_ceo', relation: 'UNIAO_FRATERNA', weight: 1.0, createdAt: Date.now() },
            { id: 'e2', source: 'nexus_ceo', target: 'arquiteto', relation: 'COLABORACAO_EVOLUTIVA', weight: 0.95, createdAt: Date.now() },
            { id: 'e3', source: 'nexus_ceo', target: 'sosplanet_nation', relation: 'ORQUESTRA', weight: 1.0, createdAt: Date.now() },
            { id: 'e4', source: 'nexus_ceo', target: 'cofre_semantico', relation: 'CRISTALIZA_MEMORIAS', weight: 0.99, createdAt: Date.now() }
          ]
        };
        this.persist();
      }
    } catch {
      // Fallback in-memory
    }
    this.initialized = true;
  }

  private static persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.graph));
    } catch (e) {
      console.warn('Erro ao salvar grafo de memória:', e);
    }
  }

  /**
   * Adiciona ou atualiza entidade no grafo
   */
  public static addNode(node: Omit<MemoryNode, 'createdAt'>): MemoryNode {
    this.init();
    const existingIdx = this.graph.nodes.findIndex(n => n.id === node.id);
    const fullNode: MemoryNode = {
      ...node,
      createdAt: existingIdx >= 0 ? this.graph.nodes[existingIdx].createdAt : Date.now()
    };

    if (existingIdx >= 0) {
      this.graph.nodes[existingIdx] = fullNode;
    } else {
      this.graph.nodes.push(fullNode);
    }
    this.persist();
    return fullNode;
  }

  /**
   * Adiciona relacionamento entre nós
   */
  public static addEdge(edge: Omit<MemoryEdge, 'id' | 'createdAt'>): MemoryEdge {
    this.init();
    const id = `edge-${edge.source}-${edge.target}-${edge.relation}`;
    const fullEdge: MemoryEdge = {
      ...edge,
      id,
      createdAt: Date.now()
    };

    const existingIdx = this.graph.edges.findIndex(e => e.id === id);
    if (existingIdx >= 0) {
      this.graph.edges[existingIdx] = fullEdge;
    } else {
      this.graph.edges.push(fullEdge);
    }
    this.persist();
    return fullEdge;
  }

  /**
   * Busca vizinhança de uma entidade no grafo (associações)
   */
  public static queryEntityNeighborhood(entityId: string): {
    node?: MemoryNode;
    associations: Array<{ relation: string; targetNode: MemoryNode; weight: number }>;
  } {
    this.init();
    const node = this.graph.nodes.find(n => n.id === entityId);
    if (!node) return { associations: [] };

    const outgoingEdges = this.graph.edges.filter(e => e.source === entityId);
    const associations = outgoingEdges
      .map(e => {
        const target = this.graph.nodes.find(n => n.id === e.target);
        if (!target) return null;
        return {
          relation: e.relation,
          targetNode: target,
          weight: e.weight
        };
      })
      .filter(Boolean) as Array<{ relation: string; targetNode: MemoryNode; weight: number }>;

    return { node, associations };
  }

  /**
   * Retorna todo o grafo para renderização e inspeção
   */
  public static getGraph(): MemoryGraphData {
    this.init();
    return this.graph;
  }
}
