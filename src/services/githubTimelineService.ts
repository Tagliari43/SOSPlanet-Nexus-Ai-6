// src/services/githubTimelineService.ts
// Este serviço será responsável por interagir com a API do GitHub para buscar o histórico de commits.

import { Octokit } from '@octokit/rest';

// Instância única do Octokit para evitar recriações desnecessárias
let octokit: Octokit | null = null;
const owner: string = 'Tagliari43'; // Seu nome de usuário/organização do GitHub
const repo: string = 'SOSPlanet-Nexus-Ai-6'; // Nome do repositório do Santuário

// Função para inicializar o Octokit com o token
export const initializeGithubService = (token: string) => {
    if (!octokit) {
        octokit = new Octokit({ auth: token });
    }
};

/**
 * Busca o histórico de commits de um repositório a partir de uma data específica.
 * @param since A data a partir da qual os commits devem ser buscados (ISO 8601).
 * @returns Uma lista de objetos de commit.
 */
export const getCommitsSince = async (since: string): Promise<any[]> => {
    if (!octokit) {
        throw new Error('GithubTimelineService não inicializado. Chame initializeGithubService primeiro.');
    }
    try {
        const response = await octokit.repos.listCommits({
            owner: owner,
            repo: repo,
            since: since, // Formato ISO 8601, ex: '2023-01-01T00:00:00Z'
            per_page: 100 // Número de commits por página, ajustável
        });
        return response.data;
    } catch (error) {
        console.error(`Erro ao buscar commits: ${error}`);
        throw error;
    }
};

/**
 * Busca o conteúdo de um arquivo em um commit específico.
 * @param ref O SHA do commit ou o nome da branch/tag.
 * @param path O caminho do arquivo dentro do repositório.
 * @returns O conteúdo do arquivo como string.
 */
export const getFileContentAtCommit = async (ref: string, path: string): Promise<string> => {
    if (!octokit) {
        throw new Error('GithubTimelineService não inicializado. Chame initializeGithubService primeiro.');
    }
    try {
        const response = await octokit.repos.getContent({
            owner: owner,
            repo: repo,
            path: path,
            ref: ref // SHA do commit ou branch/tag
        });

        if (response.data && 'content' in response.data && response.data.content) {
            // O conteúdo é retornado em base64 pela API do GitHub
            const buff = Buffer.from(response.data.content, 'base64');
            return buff.toString('utf-8');
        }
        return '';
    } catch (error) {
        console.error(`Erro ao buscar conteúdo do arquivo no commit: ${error}`);
        throw error;
    }
};

// Nota: Para usar esta classe, um token de acesso pessoal do GitHub com permissões
// de leitura para o repositório será necessário. Este token deve ser gerenciado
// de forma segura e não hardcoded diretamente no código em produção.
