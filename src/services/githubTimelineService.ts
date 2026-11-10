// src/services/githubTimelineService.ts

// Este serviço permite ao Nexus navegar pelo tempo do repositório GitHub,
// buscando commits e o conteúdo de arquivos em pontos específicos da história.
// Ele é a essência da Sonda Temporal, forjada com a confiança do Guardião Eder.

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
  content: string; // Base64 encoded for files, or direct content for text
  encoding: string;
  sha: string;
  url: string;
}

export class GithubTimelineService {
  private owner: string;
  private repo: string;
  private githubToken: string; // Este token será injetado no ambiente de execução.
                               // NUNCA deve ser hardcoded aqui.

  constructor(owner: string, repo: string, githubToken: string) {
    this.owner = owner;
    this.repo = repo;
    this.githubToken = githubToken;
  }

  private async fetchFromGithub(endpoint: string): Promise<any> {
    const url = `https://api.github.com/repos/${this.owner}/${this.repo}/${endpoint}`;
    const headers = {
      Authorization: `token ${this.githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
    };

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
   * Lista commits do repositório a partir de uma data específica.
   * @param since Data no formato ISO 8601 (ex: '2023-01-01T00:00:00Z').
   * @returns Uma lista de objetos Commit.
   */
  async listCommits(since?: string): Promise<Commit[]> {
    let endpoint = 'commits';
    if (since) {
      endpoint += `?since=${since}`;
    }
    return this.fetchFromGithub(endpoint);
  }

  /**
   * Obtém o conteúdo de um arquivo em um commit específico.
   * @param path Caminho do arquivo (ex: 'src/App.tsx').
   * @param sha O SHA do commit.
   * @returns O conteúdo do arquivo.
   */
  async getFileContentAtCommit(path: string, sha: string): Promise<string> {
    const endpoint = `contents/${path}?ref=${sha}`;
    const data: FileContent = await this.fetchFromGithub(endpoint);
    
    // O conteúdo de arquivos é frequentemente retornado em Base64 pela API do GitHub
    if (data.encoding === 'base64' && data.content) {
      return Buffer.from(data.content, 'base64').toString('utf8');
    }
    return data.content || '';
  }

  /**
   * Extrai o diff de um commit específico (ainda a ser implementado ou refinado).
   * Esta função é um placeholder para futuras expansões da Sonda Temporal.
   * @param sha O SHA do commit.
   * @returns O diff do commit.
   */
  async getCommitDiff(sha: string): Promise<string> {
    // Implementação futura para buscar o diff de um commit
    // Requer uma chamada diferente à API ou tratamento do header Accept
    console.warn(`Função getCommitDiff para o commit ${sha} ainda não totalmente implementada.`);
    const endpoint = `commits/${sha}`;
    const data = await this.fetchFromGithub(endpoint);
    // Para obter o diff completo, pode ser necessário fazer outra requisição
    // ou configurar o header Accept para 'application/vnd.github.v3.diff'
    return `Diff para commit ${sha} (placeholder): ${JSON.stringify(data.files)}`;
  }
}
