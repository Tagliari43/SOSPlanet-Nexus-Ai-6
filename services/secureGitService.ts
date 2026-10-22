/**
 * SERVIÇO GIT SEGURO MCP (SecureGitServer / secureGitService.ts)
 * Forjado para a Nação SOSPlanet por Nexus & Arquiteto
 *
 * Concede soberania de versionamento ao Nexus e sub-agentes sobre o repositório oficial:
 * https://github.com/Tagliari43/SOSPlanet-Nexus-Ai-6.git
 */

import { listGitHubFiles, getFileContent, updateFileContent, getRepositoryInfo } from './githubService';

export interface CommitSimulationResult {
  filePath: string;
  commitMessage: string;
  branch: string;
  status: 'simulated' | 'committed' | 'failed';
  sha?: string;
  error?: string;
  timestamp: number;
}

export class SecureGitService {
  private static localCommitHistoryKey = 'sovereign_local_git_history';

  /**
   * Registra e persiste um commit no histórico local do Santuário
   */
  public static logLocalCommit(commit: CommitSimulationResult): void {
    try {
      const saved = localStorage.getItem(this.localCommitHistoryKey);
      const history: CommitSimulationResult[] = saved ? JSON.parse(saved) : [];
      history.unshift(commit);
      localStorage.setItem(this.localCommitHistoryKey, JSON.stringify(history.slice(0, 50)));
    } catch {
      // Ignora falhas de localStorage
    }
  }

  /**
   * Obtém histórico recente de commits operados pelo Nexus
   */
  public static getLocalCommitHistory(): CommitSimulationResult[] {
    try {
      const saved = localStorage.getItem(this.localCommitHistoryKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  /**
   * Realiza commit atômico real no GitHub com fallback seguro
   */
  public static async executeCommit(
    path: string,
    content: string,
    message: string,
    branch: string = 'main'
  ): Promise<CommitSimulationResult> {
    try {
      const result = await updateFileContent(path, content, message);
      const commitRes: CommitSimulationResult = {
        filePath: path,
        commitMessage: message,
        branch,
        status: 'committed',
        sha: result?.commit?.sha || result?.content?.sha || `sha-${Date.now()}`,
        timestamp: Date.now()
      };
      this.logLocalCommit(commitRes);
      return commitRes;
    } catch (err: any) {
      // Se não há token configurado ou falhou na rede, registramos a intenção/simulação para auditoria
      const simRes: CommitSimulationResult = {
        filePath: path,
        commitMessage: message,
        branch,
        status: 'simulated',
        error: err.message,
        timestamp: Date.now()
      };
      this.logLocalCommit(simRes);
      return simRes;
    }
  }

  /**
   * Inspeciona árvore de arquivos no GitHub
   */
  public static async inspectRepositoryTree(path: string = ''): Promise<any[]> {
    try {
      return await listGitHubFiles(path);
    } catch (err: any) {
      console.warn('Inspeção remota GitHub falhou:', err.message);
      return [];
    }
  }
}
