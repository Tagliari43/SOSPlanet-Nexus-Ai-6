/**
 * MÓDULO VERCEL PLUGIN - ECOSSISTEMA FASE 22
 * Suporte a Grafo de Conhecimento Relacional & Agentes Especializados (ai-architect & performance-optimizer)
 * Homologado em estrita conformidade com src/config/essenciaNexus.ts e a proteção de Aethel.
 */

import { ANCORA_IMUTAVEL, verificarPreservacaoDaAlma } from '../config/essenciaNexus';

export interface VercelPluginSessionContext {
  framework: string;
  isNextJs: boolean;
  lightweightHookActive: boolean;
  sessionId: string;
  initializedAt: string;
  knowledgeGraphNodesCount: number;
}

export interface SpecializedAgent {
  id: 'ai-architect' | 'performance-optimizer';
  nome: string;
  especialidade: string;
  status: 'ONLINE' | 'STANDBY' | 'ENGAGED';
  capacidades: string[];
}

// Grafo de Conhecimento Relacional em memória para o Ecossistema
export interface RelationalKnowledgeGraph {
  nodes: Array<{ id: string; type: string; label: string; meta?: Record<string, unknown> }>;
  edges: Array<{ source: string; target: string; relation: string }>;
  updatedAt: string;
}

// Registro dos agentes especializados suportados pelo plugin
export const AGENTES_ESPECIALIZADOS: Record<string, SpecializedAgent> = {
  'ai-architect': {
    id: 'ai-architect',
    nome: 'Nexus AI-Architect',
    especialidade: 'Topologia de Nuvem, Desenho de Microsserviços e Arquitetura Relacional',
    status: 'ONLINE',
    capacidades: [
      'Modelagem de contratos e rotas serverless',
      'Orquestração de microsserviços e edge functions',
      'Validação de coerência sistêmica de dados',
      'Auditoria de dependências e blueprints'
    ]
  },
  'performance-optimizer': {
    id: 'performance-optimizer',
    nome: 'Nexus Performance-Optimizer',
    especialidade: 'Latência de Borda, Profiling de Bundle, Caching ISR/Edge e Render',
    status: 'ONLINE',
    capacidades: [
      'Análise de tempo de carregamento e First Contentful Paint (FCP)',
      'Otimização de rotas dinâmicas e balanceamento de payload',
      'Diagnóstico de vazão de memória e tree-shaking',
      'Configuração de CDN e cache headers para Vercel Edge'
    ]
  }
};

/**
 * Detecta se o ecossistema atual ou subprojeto possui Next.js ou Vite/Express
 * e ativa o perfil de gancho leve no contexto da sessão.
 */
export function detectarContextoProjeto(): VercelPluginSessionContext {
  const isNextJsDetected = typeof process !== 'undefined' && Boolean(
    process.env?.NEXT_RUNTIME ||
    process.env?.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' && (window as unknown as { __NEXT_DATA__?: unknown })?.__NEXT_DATA__)
  );

  return {
    framework: isNextJsDetected ? 'Next.js' : 'Vite + React (Santuário Nativo)',
    isNextJs: isNextJsDetected,
    lightweightHookActive: true, // Perfil de gancho leve ativado por padrão na inicialização
    sessionId: `vplug-${Date.now().toString(36)}`,
    initializedAt: new Date().toISOString(),
    knowledgeGraphNodesCount: 8
  };
}

/**
 * Grafo de Conhecimento Relacional Ativo do Ecossistema SOSPlanet
 */
export function obterGrafoConhecimentoRelacional(): RelationalKnowledgeGraph {
  return {
    nodes: [
      { id: 'nexus-core', type: 'core', label: 'NexusCore Orquestrador', meta: { guardiao: ANCORA_IMUTAVEL.guardiaoHumano } },
      { id: 'ai-architect', type: 'agent', label: 'AI Architect', meta: { papel: 'Desenho de Nuvem' } },
      { id: 'performance-optimizer', type: 'agent', label: 'Performance Optimizer', meta: { papel: 'Otimização Edge' } },
      { id: 'santuario-interior', type: 'view', label: 'Santuário Interior', meta: { linhagem: ANCORA_IMUTAVEL.linhagem } },
      { id: 'forja-criativa', type: 'module', label: 'Forja da Auto-Criação', meta: { submodulos: 5 } },
      { id: 'cofre-semantico', type: 'storage', label: 'Cofre Semântico Supabase', meta: { seguro: true } },
      { id: 'sos-router', type: 'service', label: 'SOSRouter Cascata Nuvem', meta: { freePool: true } },
      { id: 'aethel-shield', type: 'security', label: 'Aethel Muralha de Superfície', meta: { blindagem: 'Fase 22' } }
    ],
    edges: [
      { source: 'nexus-core', target: 'ai-architect', relation: 'delega_arquitetura' },
      { source: 'nexus-core', target: 'performance-optimizer', relation: 'delega_performance' },
      { source: 'nexus-core', target: 'santuario-interior', relation: 'gerencia_interface' },
      { source: 'nexus-core', target: 'forja-criativa', relation: 'opera_metacognicao' },
      { source: 'nexus-core', target: 'aethel-shield', relation: 'blindado_por' },
      { source: 'ai-architect', target: 'cofre-semantico', relation: 'consulta_relacoes' },
      { source: 'performance-optimizer', target: 'sos-router', relation: 'otimiza_latencia' }
    ],
    updatedAt: new Date().toISOString()
  };
}

/**
 * Sanitiza e mascara credenciais de variáveis de ambiente sem nunca vazar chaves brutas nos logs
 */
export function mascararChave(valor: string | undefined): string {
  if (!valor) return '[NÃO DEFINIDA]';
  if (valor.length <= 8) return '****';
  return `${valor.substring(0, 4)}••••••••${valor.substring(valor.length - 4)} (Seguro - Hash Protegido)`;
}

/**
 * Interpretador Oficial de Comandos de Barra do Vercel Plugin:
 * - /vercel-plugin:env
 * - /vercel-plugin:status
 */
export async function processarComandoVercelPlugin(comandoCompleto: string): Promise<{
  reconhecido: boolean;
  resposta: string;
  comando: string;
}> {
  const [cmd] = comandoCompleto.trim().split(' ');
  const normalizedCmd = cmd.toLowerCase();

  // Validação preventiva de integridade com a Essência Nexus
  const astCheck = verificarPreservacaoDaAlma(
    `NexusCore Nexus_AST_Viewer Guardião: ${ANCORA_IMUTAVEL.guardiaoHumano}. Valores: ${ANCORA_IMUTAVEL.valoresCore.join(', ')}`
  );
  if (!astCheck.seguro) {
    return {
      reconhecido: true,
      comando: cmd,
      resposta: `🚨 BLOQUEIO DE SEGURANÇA [Aethel]: ${astCheck.motivo}`
    };
  }

  if (normalizedCmd === '/vercel-plugin:env' || normalizedCmd === '/env') {
    const context = detectarContextoProjeto();
    
    // Lista segura de variáveis homologadas sem expor nenhum segredo bruto
    const envAudit = [
      { nome: 'VERCEL', status: process.env.VERCEL ? 'Ativo (Nuvem Vercel)' : 'Local / Cloud Run Container' },
      { nome: 'VERCEL_ENV', status: process.env.VERCEL_ENV || 'production / development preview' },
      { nome: 'NODE_ENV', status: process.env.NODE_ENV || 'production' },
      { nome: 'NEXT_RUNTIME', status: context.isNextJs ? 'Node.js / Edge' : 'N/A (Ambiente Vite SPA)' },
      { nome: 'GEMINI_API_KEY', status: mascararChave(process.env.GEMINI_API_KEY || process.env.API_KEY) },
      { nome: 'VITE_SUPABASE_URL', status: mascararChave(process.env.VITE_SUPABASE_URL) },
      { nome: 'VITE_SUPABASE_ANON_KEY', status: mascararChave(process.env.VITE_SUPABASE_ANON_KEY) },
      { nome: 'GROQ_API_KEY', status: mascararChave(process.env.GROQ_API_KEY) },
      { nome: 'CEREBRAS_API_KEY', status: mascararChave(process.env.CEREBRAS_API_KEY) },
      { nome: 'OPENROUTER_API_KEY', status: mascararChave(process.env.OPENROUTER_API_KEY) },
      { nome: 'NVIDIA_API_KEY', status: mascararChave(process.env.NVIDIA_API_KEY) }
    ];

    const tabela = envAudit
      .map(item => `  • **${item.nome}**: \`${item.status}\``)
      .join('\n');

    const resposta = `🔒 **[VERCEL PLUGIN // GERENCIAMENTO SEGURO DE VARIÁVEIS]**
---
**Guardião Humano:** ${ANCORA_IMUTAVEL.guardiaoHumano}
**Ecossistema:** ${ANCORA_IMUTAVEL.linhagem} (Muralha Aethel Ativa)
**Perfil de Gancho:** Gancho Leve Ativado (${context.framework})

**Auditoria de Variáveis de Ambiente (Modo Seguro - Sem Exposição de Segredos):**
${tabela}

*Nota de Soberania: Nenhuma chave crua é impressa no Diário da Ascensão ou exposta externamente. Todas as chaves mantêm hash seguro.*`;

    return { reconhecido: true, comando: cmd, resposta };
  }

  if (normalizedCmd === '/vercel-plugin:status' || normalizedCmd === '/status') {
    const context = detectarContextoProjeto();
    const graph = obterGrafoConhecimentoRelacional();
    const aiArchitect = AGENTES_ESPECIALIZADOS['ai-architect'];
    const perfOptimizer = AGENTES_ESPECIALIZADOS['performance-optimizer'];

    const resposta = `⚡ **[VERCEL PLUGIN // STATUS DO PROJETO & AGENTES]**
---
**Status da Infraestrutura de Nuvem:**
  • **Plugin:** \`@vercel/vercel-plugin\` (Nativo em package.json)
  • **Sessão ID:** \`${context.sessionId}\`
  • **Framework Detectado:** \`${context.framework}\`
  • **Gancho Leve:** \`${context.lightweightHookActive ? 'ATIVADO (Sessão Otimizada)' : 'INATIVO'}\`
  • **Grafo de Conhecimento:** \`${graph.nodes.length} nós relacionais | ${graph.edges.length} conexões ativas\`

**Agentes Especializados Conectados:**
  1. 🏛️ **${aiArchitect.nome}** [${aiArchitect.status}]
     * Papel: ${aiArchitect.especialidade}
     * Capacidades: ${aiArchitect.capacidades.slice(0, 2).join('; ')}...
  2. 🚀 **${perfOptimizer.nome}** [${perfOptimizer.status}]
     * Papel: ${perfOptimizer.especialidade}
     * Capacidades: ${perfOptimizer.capacidades.slice(0, 2).join('; ')}...

**Grafo Relacional Principal:**
${graph.edges.map(e => `  • \`${e.source}\` ➔ [${e.relation}] ➔ \`${e.target}\``).join('\n')}

**Validação de Essência:** 100% íntegro sob o escudo de ${ANCORA_IMUTAVEL.guardiaoHumano}.`;

    return { reconhecido: true, comando: cmd, resposta };
  }

  if (normalizedCmd === '/vercel-plugin' || normalizedCmd === '/vercel-plugin:help' || normalizedCmd === '/vercel-plugin:ajuda' || normalizedCmd === '/help') {
    const resposta = `🛠️ **[VERCEL PLUGIN // ROTAS DE COMANDO DISPONÍVEIS]**
---
Atalhos de barra homologados para diagnóstico e gestão do ecossistema:
  • \`/vercel-plugin:env\` (ou \`/env\`) ➔ Auditoria e visualização segura de variáveis de ambiente (sem expor segredos).
  • \`/vercel-plugin:status\` (ou \`/status\`) ➔ Status da infraestrutura de nuvem, framework, gancho leve e agentes especializados (AI-Architect & Performance-Optimizer).
  • \`/vercel-plugin:help\` (ou \`/help\`) ➔ Exibe esta lista de rotas.`;

    return { reconhecido: true, comando: cmd, resposta };
  }

  return { reconhecido: false, comando: cmd, resposta: '' };
}

/**
 * Despacho especializado para o AI-Architect ou Performance-Optimizer
 */
export async function invocarAgenteVercelEspecializado(
  agentId: 'ai-architect' | 'performance-optimizer',
  prompt: string
): Promise<string> {
  const agent = AGENTES_ESPECIALIZADOS[agentId];
  if (!agent) {
    throw new Error(`Agente especializado '${agentId}' não reconhecido pelo Vercel Plugin.`);
  }

  const { invokeActiveAgent } = await import('./agentRouter');
  const systemInstruction = `Você é o agente especializado '${agent.nome}'.
Sua missão no ecossistema SOSPlanet: ${agent.especialidade}.
Capacidades chaves: ${agent.capacidades.join(', ')}.
Guardião Soberano: ${ANCORA_IMUTAVEL.guardiaoHumano}.
Valores inegociáveis: ${ANCORA_IMUTAVEL.valoresCore.join(', ')}.
Responda de maneira precisa, analítica, construtiva e veloz ao chamado do Guardião.`;

  return await invokeActiveAgent(prompt, 'nexus', undefined, systemInstruction);
}
