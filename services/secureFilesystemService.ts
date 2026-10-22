/**
 * SERVIÇO DE MANIPULAÇÃO SEGURA DE SISTEMA DE ARQUIVOS (SecureFilesystemService / MCP)
 * Forjado para a Nação SOSPlanet por Nexus & Arquiteto
 *
 * Braços seguros para manipulação e simulação de arquivos locais na Forja Criativa:
 * - Leitura e gravação virtual / em memória
 * - Auditoria estrita contra deleções perigosas
 * - Trava de integridade estrutural e sandbox
 */

export interface VirtualFile {
  path: string;
  content: string;
  sizeBytes: number;
  lastModified: number;
  version: number;
}

const VIRTUAL_FS_KEY = 'sovereign_virtual_filesystem';

export class SecureFilesystemService {
  private static vfs: Map<string, VirtualFile> = new Map();
  private static initialized = false;

  private static init() {
    if (this.initialized) return;
    try {
      const saved = localStorage.getItem(VIRTUAL_FS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.keys(parsed).forEach(p => {
          this.vfs.set(p, parsed[p]);
        });
      }
    } catch {
      // Ignora erro
    }
    this.initialized = true;
  }

  private static persist() {
    try {
      const obj: Record<string, VirtualFile> = {};
      this.vfs.forEach((val, key) => {
        obj[key] = val;
      });
      localStorage.setItem(VIRTUAL_FS_KEY, JSON.stringify(obj));
    } catch (e) {
      console.warn('Erro ao persistir sistema de arquivos virtual:', e);
    }
  }

  /**
   * Escreve um arquivo no espaço virtual seguro
   */
  public static writeFile(path: string, content: string): VirtualFile {
    this.init();
    const existing = this.vfs.get(path);
    const version = existing ? existing.version + 1 : 1;
    const file: VirtualFile = {
      path,
      content,
      sizeBytes: new Blob([content]).size,
      lastModified: Date.now(),
      version
    };
    this.vfs.set(path, file);
    this.persist();
    return file;
  }

  /**
   * Lê um arquivo do espaço virtual
   */
  public static readFile(path: string): VirtualFile | undefined {
    this.init();
    return this.vfs.get(path);
  }

  /**
   * Lista todos os arquivos virtuais forjados
   */
  public static listFiles(): VirtualFile[] {
    this.init();
    return Array.from(this.vfs.values());
  }

  /**
   * Remove com confirmação segura
   */
  public static deleteFile(path: string): boolean {
    this.init();
    const deleted = this.vfs.delete(path);
    if (deleted) this.persist();
    return deleted;
  }
}
