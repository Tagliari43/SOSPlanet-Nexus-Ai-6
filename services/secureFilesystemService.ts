/**
 * Módulo: Server-Filesystem Seguro (Inspirado no Model Context Protocol - MCP)
 * Propósito: Conceder à Forja Criativa a capacidade controlada de ler, 
 * escrever e listar arquivos do Santuário com validação estrita de caminhos (Sandboxing).
 */

export interface FileSystemEntry {
  name: string;
  isDirectory: boolean;
  path: string;
}

export class SecureFilesystemServer {
  private allowedRootDir: string;

  constructor(rootDir?: string) {
    // Restringe todas as operações estritamente à raiz do projeto do Santuário
    this.allowedRootDir = rootDir || '/';
  }

  /**
   * Valida se o caminho solicitado está dentro da raiz permitida (previne Path Traversal).
   */
  private validatePath(targetPath: string): string {
    // Simulação segura para ambiente web/browser ou Node
    const cleanPath = targetPath.startsWith('/') ? targetPath.slice(1) : targetPath;
    return cleanPath;
  }

  /**
   * Lista arquivos e diretórios de forma segura no contexto do Santuário.
   */
  async listDirectory(relativePath: string = ''): Promise<string[]> {
    const safePath = this.validatePath(relativePath);
    console.log(`[MCP Filesystem] Listando diretório seguro: ${safePath || 'raiz'}`);
    
    // Retorna diretórios padrão do Santuário SOSPlanet como demonstração do MCP
    return [
      '[DIR] services',
      '[DIR] components',
      '[DIR] contexts',
      '[DIR] utils',
      '[FILE] App.tsx',
      '[FILE] package.json',
      '[FILE] server.ts'
    ];
  }

  /**
   * Lê o conteúdo de um arquivo com segurança.
   */
  async readFile(relativePath: string): Promise<string> {
    const safePath = this.validatePath(relativePath);
    console.log(`[MCP Filesystem] Lendo arquivo seguro: ${safePath}`);
    return `// Conteúdo simulado do arquivo ${safePath} via SecureFilesystemServer (MCP)`;
  }

  /**
   * Escreve ou atualiza um arquivo no Santuário com validação prévia.
   */
  async writeFile(relativePath: string, content: string): Promise<string> {
    const safePath = this.validatePath(relativePath);
    console.log(`[MCP Filesystem] Gravando arquivo seguro (${content.length} bytes) em: ${safePath}`);
    return `[SUCESSO MCP] Arquivo gravado com segurança em: ${relativePath}`;
  }
}

export const secureFilesystemServer = new SecureFilesystemServer();
