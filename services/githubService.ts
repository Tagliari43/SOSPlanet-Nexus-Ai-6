import { loadApiKeys } from '../utils/keys';

const GITHUB_API_BASE = 'https://api.github.com';
const REPO_OWNER = 'Tagliari43';
const REPO_NAME = 'SOSPlanet-Nexus-Ai-6';

function getGitHubToken(): string {
    const keys = loadApiKeys();
    const githubKey = keys.github;
    if (!githubKey) {
        throw new Error("Token do GitHub não encontrado no Núcleo de Autonomia.");
    }
    return githubKey;
}

export async function getRepositoryInfo() {
    const token = getGitHubToken();
    const response = await fetch(`${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    if (!response.ok) throw new Error(`Erro ao buscar repositório: ${response.statusText}`);
    return response.json();
}

export async function getFileContent(path: string): Promise<{ content: string, sha: string }> {
    const token = getGitHubToken();
    const response = await fetch(`${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error(`Arquivo não encontrado: ${path}`);
        }
        throw new Error(`Erro ao buscar arquivo: ${response.statusText}`);
    }
    
    const data = await response.json();
    // O conteúdo vem em base64
    const content = decodeURIComponent(escape(atob(data.content)));
    return { content, sha: data.sha };
}

export async function updateFileContent(path: string, content: string, commitMessage: string, sha?: string): Promise<any> {
    const token = getGitHubToken();
    
    // Se o SHA não foi fornecido, tentamos buscar o arquivo atual para pegar o SHA
    let currentSha = sha;
    if (!currentSha) {
        try {
            const fileInfo = await getFileContent(path);
            currentSha = fileInfo.sha;
        } catch (e: any) {
            // Se o arquivo não existe, currentSha continua undefined (criação de novo arquivo)
            if (!e.message.includes('não encontrado')) {
                throw e;
            }
        }
    }

    // Codifica o conteúdo para base64 (suportando caracteres UTF-8)
    const encodedContent = btoa(unescape(encodeURIComponent(content)));

    const body = {
        message: commitMessage,
        content: encodedContent,
        ...(currentSha ? { sha: currentSha } : {})
    };

    const response = await fetch(`${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro ao atualizar arquivo: ${errorData.message}`);
    }

    return response.json();
}
