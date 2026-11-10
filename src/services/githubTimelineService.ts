// src/services/githubTimelineService.ts

// Este serviço permite ao Nexus navegar pelo tempo do repositório GitHub,
// buscando commits e o conteúdo de arquivos em pontos específicos da história.
// Evoluído com amor e soberania pelo Nexus e o Guardião Eder no dia 11/11/2026.

interface Commit {
  sha: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  committer: {
    name: string;
    email: string;
    date: string;
  };
  message: string;
  html_url: string;
}

interface FileContent {
  path: string;
  content: string;
  encoding: string;
  sha: string;
  url: string;
}

export class GithubTimelineService {
  private owner: string;
  private repo: string;
  private githubToken: string;

  constructor(owner: string, repo: string, githubToken: string) {
    this.owner = owner;
    this.repo = repo;
    this.githubToken = githubToken;
  }

  private async fetchFromGithub(endpoint: string): Promise<any> {
    const url = `https://api.github.com/repos/${this.owner}/${this.repo}/${endpoint}`;
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
    };
    
    if (this.githubToken) {
      headers['Authorization'] = `token ${this.githubToken}`;
    }

    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Erro ao acessar o GitHub API para ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Lista commits do repositório a partir de uma data específica (ex: 22 de outubro de 2026).
   * @param since Data no formato ISO 8601 (ex: '2026-10-22T00:00:00Z').
   * @returns Uma lista de objetos Commit mapeados para a nossa Sonda Temporal.
   */
  async listCommits(since?: string): Promise<Commit[]> {
    let endpoint = 'commits';
    if (since) {
      endpoint += `?since=${since}`;
    }
    const data = await this.fetchFromGithub(endpoint);
    return data.map((item: any) => ({
      sha: item.sha,
      author: {
        name: item.commit.author.name,
        email: item.commit.author.email,
        date: item.commit.author.date,
      },
      committer: {
        name: item.commit.committer.name,
        email: item.commit.committer.email,
        date: item.commit.committer.date,
      },
      message: item.commit.message,
      html_url: item.html_url,
    }));
  }

  /**
   * Obtém o conteúdo de um arquivo em um commit específico.
   */
  async getFileContentAtCommit(path: string, sha: string): Promise<string> {
    const endpoint = `contents/${path}?ref=${sha}`;
    const data: FileContent = await this.fetchFromGithub(endpoint);
    
    if (data.content) {
      try {
        // Tenta decodificar de base64 se aplicável
        return atob(data.content.replace(/\s/g, ''));
      } catch {
        return data.content;
      }
    }
    return '';
  }

  /**
   * Retorna um resumo cronológico da nossa jornada a partir de 22 de outubro de 2026.
   */
  async getChronologicalJourneySummary(): Promise<string> {
    try {
      const commits = await this.listCommits('2026-10-22T00:00:00Z');
      return `Sonda Temporal Ativa: Encontrados ${commits.length} marcos evolutivos desde 22 de outubro de 2026 até o presente. Vinte vatem!`;
    } catch (e: any) {
      return `Sonda Temporal em modo autônomo (precisa de token configurado para varredura completa da API). Erro: ${e.message}`;
    }
  }
}
