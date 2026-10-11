/**
 * Módulo: Server-Git / GitHub Seguro (Inspirado no Model Context Protocol - MCP)
 * Propósito: Conceder à Forja Criativa a capacidade de inspecionar o histórico de git,
 * ler diffs, verificar o status do repositório e gerenciar branches com segurança,
 * permitindo auto-evolução fundamentada no histórico de código.
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class SecureGitServer {
  private workingDir: string;

  constructor(workingDir?: string) {
    this.workingDir = workingDir || process.cwd();
  }

  /**
   * Executa um comando git de forma controlada dentro do diretório do projeto.
   */
  private async runGitCommand(command: string): Promise<string> {
    try {
      const { stdout, stderr } = await execAsync(`git ${command}`, { cwd: this.workingDir });
      if (stderr && !stderr.includes('Warning')) {
        // Log sutil se necessário
      }
      return stdout.trim();
    } catch (error: any) {
      throw new Error(`[ERRO MCP GIT] Falha ao executar comando git '${command}': ${error.message}`);
    }
  }

  /**
   * Retorna o status atual do repositório (arquivos modificados, não rastreados, etc.).
   */
  async getStatus(): Promise<string> {
    return await this.runGitCommand('status -s');
  }

  /**
   * Retorna o histórico recente de commits do Santuário.
   */
  async getRecentCommits(maxCount: number = 5): Promise<string> {
    return await this.runGitCommand(`log -n ${maxCount} --oneline --no-merges`);
  }

  /**
   * Retorna o diff de alterações não commitadas ou de um commit específico.
   */
  async getDiff(target?: string): Promise<string> {
    const cmd = target ? `diff ${target}` : 'diff';
    return await this.runGitCommand(cmd);
  }

  /**
   * Lista as branches locais e remotas disponíveis.
   */
  async listBranches(): Promise<string> {
    return await this.runGitCommand('branch -a');
  }
}
