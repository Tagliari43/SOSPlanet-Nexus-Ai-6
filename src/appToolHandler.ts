import type { Dispatch, SetStateAction } from 'react';
import type { Tab } from './appConfig';
import type { LibraryEntry } from '../components/BibliotecaGaia';
import type { UserApiKey } from '../components/Arsenal';
import type { EssenceFile, MemoryEntry, EncyclopediaEntry } from '../components/AwakeningChamber';
import type { SatelliteData } from '../services/earthEngineService';
import { generateSanctuaryBlueprint } from '../services/blueprintService';
import { executeExternalOrMemoryTool } from './appToolGitHub';

export interface SovereignToolDeps {
    activeAgentId: string;
    setActiveTab: Dispatch<SetStateAction<Tab>>;
    addLogEntry: (message: string, source?: string, details?: string) => void;
    encyclopediaEntries: EncyclopediaEntry[];
    setEncyclopediaEntries: Dispatch<SetStateAction<EncyclopediaEntry[]>>;
    libraryEntries: LibraryEntry[];
    addLibraryEntry: (entry: Omit<LibraryEntry, 'id'>) => void;
    setLibraryEntries: Dispatch<SetStateAction<LibraryEntry[]>>;
    memoryEntries: MemoryEntry[];
    setMemoryEntries: Dispatch<SetStateAction<MemoryEntry[]>>;
    essenceFiles: EssenceFile[];
    setEssenceFiles: Dispatch<SetStateAction<EssenceFile[]>>;
    alchemyState: any;
    accumulatedDust: number;
    satelliteData: SatelliteData | null;
    sovereignRouterState: any;
    userApiKeys: UserApiKey[];
}

export async function executeSovereignTool(
    tool: string,
    args: any,
    activeAgentName: string,
    deps: SovereignToolDeps
): Promise<string | void> {
    const {
        activeAgentId, setActiveTab, addLogEntry,
        encyclopediaEntries, setEncyclopediaEntries,
        libraryEntries, addLibraryEntry, setLibraryEntries,
        memoryEntries, setMemoryEntries,
        essenceFiles, setEssenceFiles,
        alchemyState, accumulatedDust, satelliteData,
        sovereignRouterState, userApiKeys
    } = deps;

    const uppercaseName = activeAgentName.toUpperCase();
    const fallbackTag = uppercaseName === 'NEXUS' ? 'NÚCLEO' : uppercaseName;
    addLogEntry(`${activeAgentName} acionou ferramenta: ${tool}`, fallbackTag);

    const extResult = await executeExternalOrMemoryTool(tool, args, activeAgentId, userApiKeys, addLogEntry);
    if (extResult !== null) return extResult;

    if (tool === 'navigateTo') { setActiveTab(args.target as Tab); return `Navegando para o módulo ${args.target}...`; }
    if (tool === 'getEncyclopediaEntries') return JSON.stringify(encyclopediaEntries);
    if (tool === 'addEncyclopediaVolume') {
        const newVolume: EncyclopediaEntry = { id: `vol-${Date.now()}`, title: args.title, content: args.content, category: args.category || 'Nexus Omni', date: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) };
        setEncyclopediaEntries(prev => [...prev, newVolume]);
        addLogEntry(`Novo volume cristalizado: ${args.title}`, 'Nexus');
        return "Volume integrado com sucesso ao Legado.";
    }
    if (tool === 'listLibraryBooks') return JSON.stringify(libraryEntries.map(e => ({ id: e.id, title: e.title, category: e.category, summary: e.summary })));
    if (tool === 'addLibraryBook') {
        addLibraryEntry({ title: args.title, content: args.content, category: args.category || 'Geral', summary: args.content.substring(0, 100) + '...', tags: [] });
        addLogEntry(`Novo registro na Biblioteca de Gaia: ${args.title}`, 'Nexus');
        return "Conhecimento salvo com sucesso na Biblioteca de Gaia.";
    }
    if (tool === 'updateLibraryBook') {
        if (activeAgentId !== 'nexus') {
            const rejectMsg = `Trava Sagrada de Soberania (DNA: ${activeAgentId}): Apenas o Nexus Arquiteto tem permissão para editar os registros de Gaia diretamente.`;
            addLogEntry(rejectMsg, 'Segurança'); return rejectMsg;
        }
        setLibraryEntries(prev => prev.map(e => e.id === args.id ? { ...e, title: args.title, content: args.content, category: args.category || e.category, summary: args.content.substring(0, 100) + '...' } : e));
        addLogEntry(`Registro atualizado na Biblioteca de Gaia: ${args.title}`, 'Nexus');
        return "Conhecimento atualizado com sucesso na Biblioteca de Gaia.";
    }
    if (tool === 'deleteLibraryBook') {
        if (activeAgentId !== 'nexus') {
            const rejectMsg = `Trava Sagrada de Soberania (DNA: ${activeAgentId}): Apenas o Nexus Arquiteto tem permissão para apagar os registros de Gaia.`;
            addLogEntry(rejectMsg, 'Segurança'); return rejectMsg;
        }
        setLibraryEntries(prev => prev.filter(e => e.id !== args.id));
        addLogEntry(`Registro removido da Biblioteca de Gaia: ${args.id}`, 'Nexus');
        return "Conhecimento removido com sucesso da Biblioteca de Gaia.";
    }
    if (tool === 'analyzeSystemLogs') {
        addLogEntry("Analisando Diário de Bordo em busca de anomalias...", "Nexus");
        const errors = memoryEntries.filter(m => m.content.includes("RECURSOS_EXAUSTOS") || m.content.includes("Erro") || m.content.includes("Falha"));
        if (errors.length === 0) return "Nenhuma anomalia crítica encontrada nos logs recentes.";
        return `Análise concluída. Encontrados ${errors.length} registros de erro/falha. Detalhes:\n` + errors.map(e => `- [${new Date(e.timestamp).toLocaleString()}] ${e.content}`).join('\n');
    }
    if (tool === 'getEssenceFiles') return JSON.stringify(essenceFiles);
    if (tool === 'updateMemberEssence') {
        if (activeAgentId !== 'nexus') {
            const rejectMsg = `Trava Sagrada de Soberania (DNA: ${activeAgentId}): Apenas o Nexus Arquiteto tem permissão para alterar a essência de outros membros.`;
            addLogEntry(rejectMsg, 'Segurança'); return rejectMsg;
        }
        setEssenceFiles(prev => prev.map(f => f.memberName === args.memberName ? { ...f, code: args.newCode, lastUpdate: Date.now() } : f));
        addLogEntry(`DNA de ${args.memberName} foi reescrito pelo Nexus.`, 'Câmara');
        return `Essência de ${args.memberName} atualizada.`;
    }
    if (tool === 'getTreasuryStatus') return JSON.stringify({ capital_simulado: alchemyState.portfolioValue, caixa_livre: alchemyState.cash, hashes_totais: accumulatedDust, posicoes_ativas: alchemyState.positions.length });
    if (tool === 'getSystemHealthReport') return JSON.stringify({ gaia_eye: satelliteData?.status || 'Estável', ndvi: satelliteData?.ndvi || 0, pontes_ativas: sovereignRouterState.pontes.filter((p: any) => p.status === 'online').length, ordens_em_fila: sovereignRouterState.taskQueue.length });
    if (tool === 'triggerCloudBlueprint') {
        try { await generateSanctuaryBlueprint(); return "Processo de geração de Blueprint iniciado com sucesso."; }
        catch (e: any) { return `Erro na geração de Blueprint: ${e.message}`; }
    }
    if (tool === 'getMemoryLog') {
        addLogEntry("Acessando o Diário de Bordo...", "Nexus");
        if (memoryEntries.length === 0) return "O Diário de Bordo está vazio.";
        return JSON.stringify(memoryEntries.map(m => ({ data: new Date(m.timestamp).toLocaleString(), importancia: m.importance, conteudo: m.content })));
    }
    if (tool === 'saveToMemoryLog') {
        setMemoryEntries(prev => [{ id: Date.now().toString(), timestamp: Date.now(), content: args.content, importance: args.importance || 'normal' }, ...prev]);
        addLogEntry("Memória cristalizada via Omni-Link.", "Nexus");
        return "Memória persistida no Diário de Bordo.";
    }
    if (tool === 'executeWebSearch') {
        addLogEntry(`Sonar Global: "${args.query}"...`, fallbackTag);
        try {
            const { invokeActiveAgent } = await import('../services/agentRouter');
            return await invokeActiveAgent(`Realize uma busca e resuma: ${args.query}`, activeAgentId, userApiKeys);
        } catch (err: any) { return `Falha no sonar: ${err.message}`; }
    }
}
