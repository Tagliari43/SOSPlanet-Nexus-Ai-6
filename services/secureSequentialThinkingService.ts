/**
 * SERVIÇO DE RACIOCÍNIO SEQUENCIAL SEGURO (Mente Sequencial Soberana)
 * Forjado para a Nação SOSPlanet por Nexus & Arquiteto
 *
 * Permite pensamento multi-etapa, decomposição lógica, refinamento de premissas,
 * hipóteses alternativas e encadeamento dedutivo seguro.
 */

export interface ThoughtStep {
  stepNumber: number;
  thought: string;
  isRevision?: boolean;
  revisesStep?: number;
  branchFromStep?: number;
  branchId?: string;
  needsMoreThoughts: boolean;
  hypothesisConfidence?: number; // 0.0 a 1.0
  deductiveSummary?: string;
}

export interface SequentialThinkingSession {
  sessionId: string;
  goal: string;
  steps: ThoughtStep[];
  status: 'thinking' | 'concluded' | 'forked';
  currentConfidence: number;
  finalSynthesis?: string;
  createdAt: number;
  updatedAt: number;
}

export class SecureSequentialThinkingService {
  private static sessions: Map<string, SequentialThinkingSession> = new Map();

  /**
   * Inicia ou recupera uma sessão de raciocínio sequencial
   */
  public static initSession(goal: string, customId?: string): SequentialThinkingSession {
    const sessionId = customId || `seq-think-${Date.now()}`;
    const session: SequentialThinkingSession = {
      sessionId,
      goal,
      steps: [],
      status: 'thinking',
      currentConfidence: 0.5,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Adiciona um elo de pensamento na cadeia
   */
  public static addThought(
    sessionId: string,
    thought: string,
    needsMoreThoughts: boolean = true,
    options?: {
      isRevision?: boolean;
      revisesStep?: number;
      branchFromStep?: number;
      branchId?: string;
      confidence?: number;
      summary?: string;
    }
  ): ThoughtStep {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = this.initSession('Raciocínio Sequencial Autônomo', sessionId);
    }

    const stepNumber = session.steps.length + 1;
    const newStep: ThoughtStep = {
      stepNumber,
      thought,
      isRevision: options?.isRevision,
      revisesStep: options?.revisesStep,
      branchFromStep: options?.branchFromStep,
      branchId: options?.branchId,
      needsMoreThoughts,
      hypothesisConfidence: options?.confidence ?? 0.8,
      deductiveSummary: options?.summary
    };

    session.steps.push(newStep);
    session.updatedAt = Date.now();
    if (options?.confidence !== undefined) {
      session.currentConfidence = options.confidence;
    }

    if (!needsMoreThoughts) {
      session.status = 'concluded';
      session.finalSynthesis = options?.summary || thought;
    }

    return newStep;
  }

  /**
   * Recupera a cadeia completa de pensamentos
   */
  public static getSession(sessionId: string): SequentialThinkingSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Exporta a cadeia formatada para auditoria ou log
   */
  public static exportAuditTrace(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) return `Sessão ${sessionId} não encontrada.`;

    let trace = `=== TRACE DE RACIOCÍNIO SEQUENCIAL: ${session.goal} ===\n`;
    trace += `Status: ${session.status.toUpperCase()} | Confiança: ${(session.currentConfidence * 100).toFixed(1)}%\n\n`;

    session.steps.forEach(s => {
      const revTag = s.isRevision ? ` [Revisão do Passo #${s.revisesStep}]` : '';
      const branchTag = s.branchId ? ` [Ramo: ${s.branchId}]` : '';
      trace += `[Passo ${s.stepNumber}]${revTag}${branchTag} (Conf: ${((s.hypothesisConfidence || 0) * 100).toFixed(0)}%)\n`;
      trace += `${s.thought}\n`;
      if (s.deductiveSummary) trace += `  -> Síntese: ${s.deductiveSummary}\n`;
      trace += `----------------------------------------------------\n`;
    });

    if (session.finalSynthesis) {
      trace += `\n[SÍNTESE FINAL DA CONCLUSÃO]:\n${session.finalSynthesis}\n`;
    }

    return trace;
  }
}
