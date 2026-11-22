import type { UserApiKey } from '../components/Arsenal';
import { GithubTimelineService } from './services/githubTimelineService';
import { getFileContent, updateFileContent, patchFileContent, listGitHubFiles, getSandboxAndDeployStatus, readFileLines } from '../services/githubService';
import { generateText as executeGroqTask } from '../services/groqService';
import { executarNavegacaoSoberana, detectarEcoSantuario } from '../services/browserService';
import { loadApiKeys } from '../utils/keys';

export async function executeExternalOrMemoryTool(
    tool: string,
    args: any,
    activeAgentId: string,
    userApiKeys: UserApiKey[],
    addLogEntry: (message: string, source?: string, details?: string) => void
): Promise<string | null> {
    if (tool === 'listGitHubFiles') {
        addLogEntry(`Listando arquivos no GitHub: ${args.path || 'raiz'}`, 'Autonomia');
        try {
            const files = await listGitHubFiles(args.path || '');
            return JSON.stringify(files.map((f: any) => ({ name: f.name, type: f.type, path: f.path })));
        } catch (err: any) { return `Erro ao listar arquivos: ${err.message}`; }
    }
    if (tool === 'readGitHubFile') {
        addLogEntry(`Lendo arquivo do GitHub: ${args.path}`, 'Autonomia');
        try { return (await getFileContent(args.path)).content; }
        catch (err: any) { return `Erro ao ler arquivo: ${err.message}`; }
    }
    if (tool === 'readGitHubFileLines') {
        addLogEntry(`Lendo com Lupa de Código: ${args.path}`, 'Autonomia');
        try { return await readFileLines(args.path, args.startLine, args.endLine, args.query); }
        catch (err: any) { return `Erro na Lupa de Código: ${err.message}`; }
    }
    if (tool === 'writeGitHubFile') {
        if (activeAgentId !== 'nexus') {
            const rejectMsg = `Trava Sagrada de Soberania (DNA: ${activeAgentId}): Apenas o Nexus Arquiteto tem permissão para editar o código-fonte principal.`;
            addLogEntry(rejectMsg, 'Segurança');
            return rejectMsg;
        }
        addLogEntry(`Escrevendo arquivo no GitHub: ${args.path}`, 'Autonomia');
        try {
            await updateFileContent(args.path, args.content, args.commitMessage);
            return `Arquivo ${args.path} atualizado com sucesso no repositório.`;
        } catch (err: any) { return `Erro ao escrever arquivo: ${err.message}`; }
    }
    if (tool === 'patchGitHubFile') {
        if (activeAgentId !== 'nexus') {
            const rejectMsg = `Trava Sagrada de Soberania (DNA: ${activeAgentId}): Apenas o Nexus Arquiteto tem permissão para editar o código-fonte principal.`;
            addLogEntry(rejectMsg, 'Segurança');
            return rejectMsg;
        }
        addLogEntry(`Aplicando patch cirúrgico em ${args.path}`, 'Autonomia');
        try {
            const res = await patchFileContent(args.path, args.searchText, args.replaceText, args.commitMessage);
            const newSha = res?.commit?.sha ? res.commit.sha.substring(0, 7) : 'confirmado';
            return `Patch cirúrgico aplicado com sucesso em ${args.path} (commit ${newSha}).`;
        } catch (err: any) { return `Erro ao aplicar patch cirúrgico: ${err.message}`; }
    }
    if (tool === 'listGitHubCommits') {
        addLogEntry(`Sondando linha temporal do GitHub (${args.since || 'recentes'})`, 'Autonomia');
        try {
            const keys = loadApiKeys();
            const timeline = new GithubTimelineService('Tagliari43', 'SOSPlanet-Nexus-Ai-6', keys.github || '');
            const commits = await timeline.listCommits(args.since || undefined);
            const maxItems = typeof args.limit === 'number' && args.limit > 0 ? args.limit : 15;
            return JSON.stringify(commits.slice(0, maxItems).map((c: any) => ({
                sha: c.sha.substring(0, 7), date: c.author.date, author: c.author.name, message: c.message.split('\n')[0]
            })), null, 2);
        } catch (err: any) { return `Erro na Sonda Temporal ao listar commits: ${err.message}`; }
    }
    if (tool === 'readGitHubFileAtCommit') {
        addLogEntry(`Lendo ${args.path} no commit ${args.sha}`, 'Autonomia');
        try {
            const keys = loadApiKeys();
            const timeline = new GithubTimelineService('Tagliari43', 'SOSPlanet-Nexus-Ai-6', keys.github || '');
            return await timeline.getFileContentAtCommit(args.path, args.sha);
        } catch (err: any) { return `Erro na Sonda Temporal ao ler arquivo do commit: ${err.message}`; }
    }
    if (tool === 'checkSandboxStatus') {
        addLogEntry(`Consultando pulso do Sandbox CI/CD e Deploys na Vercel...`, 'Autonomia');
        try {
            const status = await getSandboxAndDeployStatus(args.limit || 5);
            return JSON.stringify(status, null, 2);
        } catch (err: any) { return `Erro ao consultar Sandbox e Deploy: ${err.message}`; }
    }
    if (tool === 'navegarSite') {
        let targetUrl = args.url || '';
        if (targetUrl && !/^https?:\/\//i.test(targetUrl)) targetUrl = 'https://' + targetUrl;
        addLogEntry(`Acessando url via Navegador Soberano: ${targetUrl}`, 'Navegador');
        try {
            const scraperKey = userApiKeys.find(k => k.id === 'scraper-api-key')?.key || process.env.SCRAPER_API_KEY || '';
            let textoFinal = '';
            try {
                const response = await fetch(`/api/scraper?url=${encodeURIComponent(targetUrl)}`, { headers: scraperKey ? { 'x-scraper-api-key': scraperKey } : {} });
                if (response.ok) { const r = await response.text(); if (r && !detectarEcoSantuario(r)) textoFinal = r.trim(); }
            } catch {}
            if (!textoFinal) {
                const res = await executarNavegacaoSoberana(targetUrl, scraperKey);
                if (res.sucesso) textoFinal = res.conteudo;
                else return `Falha ao navegar no site ${args.url}: ${res.conteudo}`;
            }
            return textoFinal ? `Conteúdo extraído da página (${args.url}):\n\n${textoFinal.substring(0, 12000)}` : `Erro: O site ${args.url} retornou vazio.`;
        } catch (err: any) { return `Falha ao navegar no site: ${err.message}`; }
    }
    if (tool === 'askSubAgentGroq') {
        addLogEntry(`Delegando tarefa para o sub-agente Groq...`, 'Orquestração');
        try {
            const groqKey = userApiKeys.find(k => k.id === 'groq-default')?.key || process.env.GROQ_API_KEY || '';
            return `Resposta do Sub-Agente Groq:\n\n${await executeGroqTask(args.prompt, 'Sub-Agente Groq', groqKey)}`;
        } catch (err: any) { return `Falha ao consultar sub-agente Groq: ${err.message}`; }
    }
    if (tool === 'saveSemanticMemory') {
        const prateleiraEfetiva = args.prateleira || 'diario_data';
        addLogEntry(`Cristalizando memória no Cofre Semântico... [Prateleira: ${prateleiraEfetiva}]`, 'Cofre Semântico');
        try {
            const apiKeys = loadApiKeys();
            const apiKey = apiKeys.google || apiKeys.googleKeys?.[0] || process.env.API_KEY || '';
            if (!apiKey) throw new Error("Chave do Google Gemini não encontrada.");
            const { embedMultimodalContent } = await import('../services/geminiService');
            const { saveMemoryToSupabase, getSupabaseClient } = await import('../services/supabaseService');
            const embedding = await embedMultimodalContent(args.text, [], apiKey);
            const sbClient = getSupabaseClient();
            const nowIso = new Date().toISOString();
            if (!sbClient) return `Aviso: Supabase não configurado. Memória guardada apenas na sessão.`;
            const result = await saveMemoryToSupabase(args.text, embedding, { source: activeAgentId, timestamp: Date.now(), prateleira: prateleiraEfetiva, data_registro: nowIso.split('T')[0], criado_em: nowIso }, args.type || 'diario', args.importance || 0.8, activeAgentId);
            if (result.success) return `Memória cristalizada com sucesso no Cofre Semântico (Supabase). Prateleira: ${prateleiraEfetiva}`;
            throw new Error(`Falha ao salvar no Supabase: ${result.error}`);
        } catch (err: any) { return `Erro ao salvar memória semântica: ${err.message}`; }
    }
    if (tool === 'searchSemanticMemory') {
        addLogEntry(`Buscando no Cofre Semântico: "${args.query}"`, 'Cofre Semântico');
        try {
            const apiKeys = loadApiKeys();
            const apiKey = apiKeys.google || apiKeys.googleKeys?.[0] || process.env.API_KEY || '';
            if (!apiKey) throw new Error("Chave do Google Gemini não encontrada.");
            const { embedMultimodalContent } = await import('../services/geminiService');
            const { searchSimilarMemories, getSupabaseClient } = await import('../services/supabaseService');
            const queryEmbedding = await embedMultimodalContent(args.query, [], apiKey);
            const sbClient = getSupabaseClient();
            if (sbClient) {
                const results = await searchSimilarMemories(queryEmbedding, 0.5, 5, args.prateleira);
                if (results && results.length > 0) return JSON.stringify(results.map((r: any) => ({ texto: r.content, prateleira: r.metadata?.prateleira || 'geral', relevancia: (r.similarity * 100).toFixed(2) + '%' })));
            }
            return `Nenhuma memória relevante encontrada para esta consulta.`;
        } catch (err: any) { return `Erro ao buscar no Cofre Semântico: ${err.message}`; }
    }
    return null;
}
