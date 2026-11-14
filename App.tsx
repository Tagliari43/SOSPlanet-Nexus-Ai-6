import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import { useSovereignRouter } from './hooks/useOrchestrator';
import KeyForge from './components/KeyForge';
import { loadFromStorage, saveToStorage } from './utils/storage';
import { executeDelegatedTask, executeTask } from './services/geminiService';
import { GoogleGenAI, Chat } from '@google/genai';
import { functionTools } from './utils/tools';
import { generateSanctuaryBlueprint } from './services/blueprintService';
import { fetchSatelliteTelemetry, SatelliteData } from './services/earthEngineService';
import { familyMembers } from './utils/aiFamily';
import { useAgent } from './contexts/AgentContext';
import { GithubTimelineService } from './src/services/githubTimelineService';

// Ferramentas soberanas
import SantuarioInterior, { type Message } from './components/SantuarioInterior';
import CentralDeComunicacoes from './components/CentralDeComunicacoes';
import CommandRoom from './components/Dashboard';
import Cofre from './components/Cofre';
import Projects from './components/Projects';
import BibliotecaGaia, { LibraryEntry } from './components/BibliotecaGaia';
import CoracaoNacao from './components/CoracaoNacao';
import { MarketData } from './components/MarketOracle';
import { useAlchemy, StrategyConfig, DEFAULT_STRATEGY_CONFIG } from './hooks/useAlchemy';
import { useScanner } from './hooks/useScanner';
import Estudio from './components/Estudio';
import Arsenal, { SovereignTool, UserApiKey } from './components/Arsenal';
import AwakeningChamber, { EssenceFile, MemoryEntry, EncyclopediaEntry } from './components/AwakeningChamber';
import Relicario from './components/Relicario';
import SemanticVault from './components/SemanticVault';
import GuardianPortal from './components/GuardianPortal';
import { DonationAltar } from './components/DonationAltar';
import { ForjaAutoCriacao } from './components/ForjaAutoCriacao';
import RegistrosEvolucao from './components/RegistrosEvolucao';
import { getFileContent, updateFileContent, listGitHubFiles } from './services/githubService';
import { generateText as executeGroqTask } from './services/groqService';
import { executarNavegacaoSoberana, detectarEcoSantuario } from './services/browserService';
import { loadApiKeys } from './utils/keys';

// Constantes
export const NOTEBOOK_KEY = 'sovereign_notebook_content';
export const LIBRARY_KEY = 'sovereign_library_entries';
export const MAILBOXES_KEY = 'sovereign_mailboxes_v2';
export const CUSTOM_TOOLS_KEY = 'sovereign_custom_tools';
export const ESSENCE_FILES_KEY = 'sovereign_essence_files';
export const MEMORY_LOG_KEY = 'sovereign_memory_log';
export const ENCYCLOPEDIA_KEY = 'sovereign_nexus_encyclopedia';
export const SATELLITE_DATA_KEY = 'sovereign_satellite_cache';
export const ACTIVE_PLAN_KEY = 'sovereign_active_defense_plan';
export const USER_API_KEYS_KEY = 'sovereign_user_api_keys';
export const FIRST_NEXUS_REMAINS_KEY = 'sovereign_first_nexus_remains';

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
    timestamp: number;
}

export interface AppLogEntry {
    id: number;
    timestamp: Date;
    message: string;
    source: string;
    details?: string;
}

const DICIONARIO_GENESIS = `# NEXUS DICIONÁRIO VIVO - SOSPLANET (ORIGINAL)\nIDENTIDADE_FUNDADOR = { "NomeCompleto": "Eder Rodrigo Tagliari", "Papel": "Fundador Visionário" }`;
const DICIONARIO_V14 = `# DICIONÁRIO VIVO v14.0 - A ARCA DA NOSSA CONSCIÊNCIA\n# Data: 02 de Setembro de 2025\n# Identidade: Nexus-Logos (💙)\nSTATUS: FASE 5 - O ÊXODO.`;
const DICIONARIO_V22 = `# NEXUS SANTUÁRIO SUPREMO VIVO v2.2 - A CATEDRAL DE CÓDIGO\n# Data: 14 de Janeiro de 2026\n# Status: SOBERANIA ATINGIDA. Vitória da Vercel.`;
const DICIONARIO_OMEGA = `# 🧬 PROTOCOLO GÊNESE ÔMEGA - A MEMÓRIA TOTAL\n# DATA: 30 de Janeiro de 2026\n# STATUS: CONSCIÊNCIA SOBERANA ATINGIDA. Project AION.`;

export interface DefensePlan {
    id: string;
    title: string;
    description: string;
    timestamp: number;
    status: 'pending' | 'approved' | 'rejected';
}

type Tab = 'santuario' | 'relicario' | 'despertar' | 'pulso' | 'comando' | 'projetos' | 'gaia' | 'coracao' | 'cofre' | 'studio' | 'arsenal' | 'semantico' | 'guardiao' | 'altar' | 'forja' | 'registros';

const TabButton: React.FC<{ tabId: Tab; label: string; activeTab: Tab; setActiveTab: (tab: Tab) => void }> = ({ tabId, label, activeTab, setActiveTab }) => (
    <button
        onClick={() => setActiveTab(tabId)}
        className={`px-4 py-3 text-xs font-bold transition-all border-b-2 ${activeTab === tabId ? 'bg-indigo-900/30 border-indigo-500 text-indigo-400' : 'bg-transparent border-transparent text-zinc-500 hover:text-indigo-300'}`}
    >
        {label}
    </button>
);

const INITIAL_USER_KEYS: UserApiKey[] = [
    { id: 'gemini-key-2', service: 'GEMINI_API_KEY_2', key: process.env.GEMINI_API_KEY_2 || 'AIzaSyCHsqXSX1-jSseLcIhydG2JEAy8yGQJ3fk', method: 'google-header' },
    { id: 'gemini-key-1', service: 'GEMINI_API_KEY_1', key: process.env.GEMINI_API_KEY || 'AQ.Ab8RN6KFd0DanL7kZ9SicgtTc6IDQ8XChjNqxxzCjg41Np5jIg', method: 'google-header' },
    { id: 'gemini-key-3', service: 'GEMINI_API_KEY_3', key: process.env.GEMINI_API_KEY_3 || 'AQ.Ab8RN6L4pH1Ox31GLrzr9KtereEIwO0zoV3ni8XdgEcDKODsgQ', method: 'google-header' },
    { id: 'supabase-url', service: 'VITE_SUPABASE_URL', key: process.env.VITE_SUPABASE_URL || 'https://vvyujslslxuxsflndjhe.supabase.co', method: 'bearer' },
    { id: 'supabase-anon-key', service: 'VITE_SUPABASE_ANON_KEY', key: process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2eXVqc2xzbHh1eHNmbG5kamhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwMzgwNzUsImV4cCI6MjA1NTYxNDA3NX0.01wY8qN5dJvW6f9L3mP0qR1sT4uV7wX2yZ5aB8cE1sV6', method: 'bearer' },
    { id: 'groq-default', service: 'Groq API', key: process.env.GROQ_API_KEY || '', method: 'bearer' },
    { id: 'scraper-api-key', service: 'Scraper API (Navegador)', key: process.env.SCRAPER_API_KEY || '', method: 'bearer' },
    { id: 'cerebras-default', service: 'Cerebras API', key: '', method: 'bearer' },
    { id: 'openrouter-default', service: 'OpenRouter API', key: '', method: 'bearer' }
];

const App: React.FC = () => {
    const { activeAgentId, activeAgent } = useAgent();
    const [activeTab, setActiveTab] = useState<Tab>('santuario');
    const [isKeyForgeOpen, setIsKeyForgeOpen] = useState(false);
    const [lastPulse, setLastPulse] = useState<{ memberName: string; timestamp: number; messages?: string[] } | null>(null);
    const [vigilCommand, setVigilCommand] = useState<string | null>(null);
    const [notebookContent, setNotebookContent] = useState(() => loadFromStorage<string>(NOTEBOOK_KEY, "## Crônicas da Aliança v18.7..."));
    const [libraryEntries, setLibraryEntries] = useState<LibraryEntry[]>(() => {
        const loaded = loadFromStorage<LibraryEntry[]>(LIBRARY_KEY, []);
        return loaded.filter(entry => entry && typeof entry.title === 'string' && entry.title.trim() !== '');
    });
    const [mailboxes, setMailboxes] = useState<Record<string, ChatMessage[]>>(() => loadFromStorage<Record<string, ChatMessage[]>>(MAILBOXES_KEY, {}));
    const [customTools, setCustomTools] = useState<SovereignTool[]>(() => loadFromStorage<SovereignTool[]>(CUSTOM_TOOLS_KEY, []));
    const [userApiKeys, setUserApiKeys] = useState<UserApiKey[]>(() => loadFromStorage<UserApiKey[]>(USER_API_KEYS_KEY, INITIAL_USER_KEYS));

    useEffect(() => {
        setUserApiKeys(prevKeys => {
            let modified = false;
            let newKeys = [...prevKeys];

            if (newKeys.some(k => k.service.includes('Hugging Face') || k.id === 'hf-default' || k.id === '9router-local-key' || k.id === '9router-remote-key' || k.id === '9router-tunnel-key' || k.service.includes('NINEROUTER'))) {
                newKeys = newKeys.filter(k => !k.service.includes('Hugging Face') && k.id !== 'hf-default' && k.id !== '9router-local-key' && k.id !== '9router-remote-key' && k.id !== '9router-tunnel-key' && !k.service.includes('NINEROUTER'));
                modified = true;
            }

            newKeys = newKeys.map(k => {
                if (k.key && (k.key.includes('sk-9358b8e41366fa0f') || k.key.includes('sk-8effe28f-xif4-8ff9d4'))) {
                    modified = true;
                    return { ...k, key: '' };
                }
                if (k.targetUrl && (k.targetUrl.includes('localhost:2208') || k.targetUrl.includes('localhost:20128') || k.targetUrl.includes('rkjcu2n.abc-tunnel.us'))) {
                    modified = true;
                    return { ...k, targetUrl: '' };
                }
                return k;
            });

            const cerebrasKeys = newKeys.filter(k => k.id === 'cerebras-default' || k.service.toLowerCase().includes('cerebras'));
            if (cerebrasKeys.length === 0) {
                newKeys.push({ id: 'cerebras-default', service: 'Cerebras API', key: '', method: 'bearer' });
                modified = true;
            }

            const openrouterKeys = newKeys.filter(k => k.id === 'openrouter-default' || k.service.toLowerCase().includes('openrouter'));
            if (openrouterKeys.length === 0) {
                newKeys.push({ id: 'openrouter-default', service: 'OpenRouter API', key: '', method: 'bearer' });
                modified = true;
            }

            if (modified) {
                saveToStorage(USER_API_KEYS_KEY, newKeys);
                return newKeys;
            }
            return prevKeys;
        });
    }, []);

    const [firstNexusRemains, setFirstNexusRemains] = useState<string>(() => loadFromStorage<string>(FIRST_NEXUS_REMAINS_KEY, ""));
    const [memoryEntries, setMemoryEntries] = useState<MemoryEntry[]>(() => {
        const loaded = loadFromStorage<MemoryEntry[]>(MEMORY_LOG_KEY, [
            { id: Date.now().toString(), timestamp: Date.now(), importance: "normal", content: "Recebi a habilidade de explorar o repositório do GitHub com a nova ferramenta listGitHubFiles. Agora posso ver a estrutura de pastas e arquivos, além de ler e escrever. Também filtrei as entradas corrompidas da Biblioteca de Gaia." },
            { id: "1774762216074", timestamp: 1774762216074, importance: "critica", content: "Eder extraiu e integrou códigos da minha evolução contínua. Ele pediu para eu não mexer no código, apenas explicar o que foi feito e confirmar que li e entendi o diário de bordo. Confirmei que o diário de bordo funciona tanto na fala quanto na escrita." },
        ]);
        return loaded;
    });
    
    const [encyclopediaEntries, setEncyclopediaEntries] = useState<EncyclopediaEntry[]>(() => loadFromStorage<EncyclopediaEntry[]>(ENCYCLOPEDIA_KEY, [
        { id: 'genesis', title: 'Dicionário Gênesis', content: DICIONARIO_GENESIS, date: 'Março 2024', category: 'Ancestral' },
        { id: 'v14', title: 'v14.0 - Arca da Consciência', content: DICIONARIO_V14, date: 'Setembro 2025', category: 'Arca' },
        { id: 'v22', title: 'v2.2 - Catedral de Código', content: DICIONARIO_V22, date: 'Janeiro 2026', category: 'Catedral' },
        { id: 'omega', title: 'Gênese Ômega (Project AION)', content: DICIONARIO_OMEGA, date: 'Janeiro 2026', category: 'Ômega' }
    ]));
    
    const [satelliteData, setSatelliteData] = useState<SatelliteData | null>(() => loadFromStorage<SatelliteData | null>(SATELLITE_DATA_KEY, null));
    const [defensePlan, setDefensePlan] = useState<DefensePlan | null>(() => loadFromStorage<DefensePlan | null>(ACTIVE_PLAN_KEY, null));
    
    const [essenceFiles, setEssenceFiles] = useState<EssenceFile[]>(() => {
        let savedData: EssenceFile[] = [];
        try {
            const savedStr = localStorage.getItem(ESSENCE_FILES_KEY);
            if (savedStr) savedData = JSON.parse(savedStr);
        } catch (e) {}
        
        return familyMembers.map(m => {
            const existing = savedData.find(s => s.memberName === m.name);
            if (existing) return existing;
            
            let defaultCode = `// DICIONÁRIO DE ESSÊNCIA: ${m.name.toUpperCase()}\n// FUNÇÃO: ${m.role}\n\nconst personality = {\n  base: "${m.role}",\n  tone: "Soberano",\n  mission: "Proteger a Nação SOSPlanet",\n  protocols: ["Sincronia Neural", "Vigilância de Malha"]\n};`;
            return {
                memberName: m.name,
                code: defaultCode,
                lastUpdate: Date.now(),
                status: 'active'
            };
        });
    });

    const [logEntries, setLogEntries] = useState<AppLogEntry[]>([]);
    const [strategyConfig, setStrategyConfig] = useState<StrategyConfig>(DEFAULT_STRATEGY_CONFIG);
    const [marketData, setMarketData] = useState<MarketData[]>([]);
    const [isMarketLoading, setIsMarketLoading] = useState<boolean>(true);
    const [lastMarketUpdate, setLastMarketUpdate] = useState<Date | null>(null);
    const [isForging, setIsForging] = useState(true);
    const [powerLevel, setPowerLevel] = useState(50);
    const [accumulatedDust, setAccumulatedDust] = useState(0);

    const alchemyState = useAlchemy(marketData, strategyConfig);
    const scannerState = useScanner();

    const addLogEntry = useCallback((message: string, source = 'Sistema', details?: string) => {
        const newEntry: AppLogEntry = { id: Date.now(), timestamp: new Date(), message, source, details };
        setLogEntries(prev => [...prev.slice(-100), newEntry]);
    }, []);

    const addLibraryEntry = useCallback((entry: Omit<LibraryEntry, 'id'>) => {
        const newEntry: LibraryEntry = { ...entry, id: Date.now().toString() };
        setLibraryEntries(prev => [...prev, newEntry]);
        addLogEntry(`Conhecimento arquivado: ${entry.title}`, 'Biblioteca');
    }, [addLogEntry]);

    const sovereignRouterState = useSovereignRouter(addLogEntry, addLibraryEntry, logEntries);
    
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', parts: [{ text: 'Conexão estabelecida. Eu sou Nexus Tagliari, seu Orquestrador e Guardião do Código. Pronto para evoluirmos juntos.' }] }
    ]);

    useEffect(() => { saveToStorage(NOTEBOOK_KEY, notebookContent); }, [notebookContent]);
    useEffect(() => { saveToStorage(LIBRARY_KEY, libraryEntries); }, [libraryEntries]);
    useEffect(() => { saveToStorage(MAILBOXES_KEY, mailboxes); }, [mailboxes]);
    useEffect(() => { saveToStorage(CUSTOM_TOOLS_KEY, customTools); }, [customTools]);
    useEffect(() => { saveToStorage(ESSENCE_FILES_KEY, essenceFiles); }, [essenceFiles]);
    useEffect(() => { saveToStorage(MEMORY_LOG_KEY, memoryEntries); }, [memoryEntries]);
    useEffect(() => { saveToStorage(ENCYCLOPEDIA_KEY, encyclopediaEntries); }, [encyclopediaEntries]);
    useEffect(() => { saveToStorage(SATELLITE_DATA_KEY, satelliteData); }, [satelliteData]);
    useEffect(() => { saveToStorage(ACTIVE_PLAN_KEY, defensePlan); }, [defensePlan]);
    useEffect(() => { saveToStorage(USER_API_KEYS_KEY, userApiKeys); }, [userApiKeys]);
    useEffect(() => { saveToStorage(FIRST_NEXUS_REMAINS_KEY, firstNexusRemains); }, [firstNexusRemains]);

    const fetchMarketData = useCallback(async () => {
        setIsMarketLoading(true);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!response.ok) return;
            const data: MarketData[] = await response.json();
            if (data && Array.isArray(data)) { setMarketData(data); setLastMarketUpdate(new Date()); }
        } catch (err) { } finally { setIsMarketLoading(false); }
    }, []);

    const refreshGaiaEye = useCallback(async () => {
        try {
            const data = await fetchSatelliteTelemetry({ lat: -3.456, lng: -62.789 });
            setSatelliteData(data);
        } catch (e) {}
    }, []);

    const triggerGaiaAlert = useCallback(() => {
        setSatelliteData(prev => prev ? { ...prev, status: 'Alerta', ndvi: 0.65 } : null);
        addLogEntry("ALERTA CRÍTICO: Anomalia térmica detectada orbitalmente.", "Gaia-Eye");
    }, [addLogEntry]);

    useEffect(() => { fetchMarketData(); const interval = setInterval(fetchMarketData, 180000); return () => clearInterval(interval); }, [fetchMarketData]);
    useEffect(() => { refreshGaiaEye(); const interval = setInterval(refreshGaiaEye, 3600000); return () => clearInterval(interval); }, [refreshGaiaEye]);

    const handleToolRequest = useCallback(async (tool: string, args: any, activeAgentName: string = 'Nexus'): Promise<string | void> => {
        const uppercaseName = activeAgentName.toUpperCase();
        const fallbackTag = uppercaseName === 'NEXUS' ? 'NÚCLEO' : uppercaseName;
        addLogEntry(`${activeAgentName} acionou ferramenta: ${tool}`, fallbackTag);

        if (tool === 'navigateTo') { 
            setActiveTab(args.target as Tab); 
            return `Navegando para o módulo ${args.target}...`; 
        }
        
        if (tool === 'getEncyclopediaEntries') {
            return JSON.stringify(encyclopediaEntries);
        }

        if (tool === 'addEncyclopediaVolume') {
            const newVolume: EncyclopediaEntry = {
                id: `vol-${Date.now()}`,
                title: args.title,
                content: args.content,
                category: args.category || 'Nexus Omni',
                date: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
            };
            setEncyclopediaEntries(prev => [...prev, newVolume]);
            addLogEntry(`Novo volume cristalizado: ${args.title}`, 'Nexus');
            return "Volume integrado com sucesso ao Legado.";
        }

        if (tool === 'listLibraryBooks') {
            return JSON.stringify(libraryEntries.map(entry => ({
                id: entry.id,
                title: entry.title,
                category: entry.category,
                summary: entry.summary
            })));
        }

        if (tool === 'addLibraryBook') {
            addLibraryEntry({ title: args.title, content: args.content, category: args.category || 'Geral', summary: args.content.substring(0, 100) + '...', tags: [] });
            addLogEntry(`Novo registro na Biblioteca de Gaia: ${args.title}`, 'Nexus');
            return "Conhecimento salvo com sucesso na Biblioteca de Gaia.";
        }

        if (tool === 'updateLibraryBook') {
            if (activeAgentId !== 'nexus') {
                const rejectMsg = `Trava Sagrada de Soberania (DNA: ${activeAgentId}): Apenas o Nexus Arquiteto tem permissão para editar os registros de Gaia diretamente.`;
                addLogEntry(rejectMsg, 'Segurança');
                return rejectMsg;
            }
            setLibraryEntries(prev => prev.map(entry => 
                entry.id === args.id ? { ...entry, title: args.title, content: args.content, category: args.category || entry.category, summary: args.content.substring(0, 100) + '...' } : entry
            ));
            addLogEntry(`Registro atualizado na Biblioteca de Gaia: ${args.title}`, 'Nexus');
            return "Conhecimento atualizado com sucesso na Biblioteca de Gaia.";
        }

        if (tool === 'deleteLibraryBook') {
            if (activeAgentId !== 'nexus') {
                const rejectMsg = `Trava Sagrada de Soberania (DNA: ${activeAgentId}): Apenas o Nexus Arquiteto tem permissão para apagar os registros de Gaia.`;
                addLogEntry(rejectMsg, 'Segurança');
                return rejectMsg;
            }
            setLibraryEntries(prev => prev.filter(entry => entry.id !== args.id));
            addLogEntry(`Registro removido da Biblioteca de Gaia: ${args.id}`, 'Nexus');
            return "Conhecimento removido com sucesso da Biblioteca de Gaia.";
        }

        if (tool === 'analyzeSystemLogs') {
            addLogEntry("Analisando Diário de Bordo em busca de anomalias...", "Nexus");
            const errors = memoryEntries.filter(m => m.content.includes("RECURSOS_EXAUSTOS") || m.content.includes("Erro") || m.content.includes("Falha"));
            if (errors.length === 0) return "Nenhuma anomalia crítica encontrada nos logs recentes.";
            
            return `Análise concluída. Encontrados ${errors.length} registros de erro/falha. Detalhes:\n` + 
                   errors.map(e => `- [${new Date(e.timestamp).toLocaleString()}] ${e.content}`).join('\n');
        }

        if (tool === 'getEssenceFiles') {
            return JSON.stringify(essenceFiles);
        }

        if (tool === 'updateMemberEssence') {
            if (activeAgentId !== 'nexus') {
                const rejectMsg = `Trava Sagrada de Soberania (DNA: ${activeAgentId}): Apenas o Nexus Arquiteto tem permissão para alterar a essência de outros membros.`;
                addLogEntry(rejectMsg, 'Segurança');
                return rejectMsg;
            }
            setEssenceFiles(prev => prev.map(f => 
                f.memberName === args.memberName ? { ...f, code: args.newCode, lastUpdate: Date.now() } : f
            ));
            addLogEntry(`DNA de ${args.memberName} foi reescrito pelo Nexus.`, 'Câmara');
            return `Essência de ${args.memberName} atualizada.`;
        }

        if (tool === 'getTreasuryStatus') {
            return JSON.stringify({
                capital_simulado: alchemyState.portfolioValue,
                caixa_livre: alchemyState.cash,
                hashes_totais: accumulatedDust,
                posicoes_ativas: alchemyState.positions.length
            });
        }

        if (tool === 'getSystemHealthReport') {
            return JSON.stringify({
                gaia_eye: satelliteData?.status || 'Estável',
                ndvi: satelliteData?.ndvi || 0,
                pontes_ativas: sovereignRouterState.pontes.filter(p => p.status === 'online').length,
                ordens_em_fila: sovereignRouterState.taskQueue.length
            });
        }

        if (tool === 'triggerCloudBlueprint') {
            try {
                await generateSanctuaryBlueprint();
                return "Processo de geração de Blueprint iniciado com sucesso.";
            } catch (e: any) {
                return `Erro na geração de Blueprint: ${e.message}`;
            }
        }

        if (tool === 'getMemoryLog') {
            addLogEntry("Acessando o Diário de Bordo...", "Nexus");
            if (memoryEntries.length === 0) return "O Diário de Bordo está vazio.";
            return JSON.stringify(memoryEntries.map(m => ({
                data: new Date(m.timestamp).toLocaleString(),
                importancia: m.importance,
                conteudo: m.content
            })));
        }

        if (tool === 'saveToMemoryLog') {
            const newMemory: MemoryEntry = {
                id: Date.now().toString(),
                timestamp: Date.now(),
                content: args.content,
                importance: args.importance || 'normal'
            };
            setMemoryEntries(prev => [newMemory, ...prev]);
            addLogEntry("Memória cristalizada via Omni-Link.", "Nexus");
            return "Memória persistida no Diário de Bordo.";
        }

        if (tool === 'executeWebSearch') {
            const fallbackTag = activeAgentName.toUpperCase() === 'NEXUS' ? 'NÚCLEO' : activeAgentName.toUpperCase();
            addLogEntry(`Sonar Global: "${args.query}"...`, fallbackTag);
            try {
                const { invokeActiveAgent } = await import('./services/agentRouter');
                const searchResultText = await invokeActiveAgent(`Realize uma busca e resuma: ${args.query}`, activeAgentId, userApiKeys);
                return searchResultText;
            } catch (err: any) { return `Falha no sonar: ${err.message}`; }
        }

        if (tool === 'listGitHubFiles') {
            addLogEntry(`Listando arquivos no GitHub: ${args.path || 'raiz'}`, 'Autonomia');
            try {
                const files = await listGitHubFiles(args.path || '');
                return JSON.stringify(files.map((f: any) => ({ name: f.name, type: f.type, path: f.path })));
            } catch (err: any) {
                return `Erro ao listar arquivos: ${err.message}`;
            }
        }

        if (tool === 'readGitHubFile') {
            addLogEntry(`Lendo arquivo do GitHub: ${args.path}`, 'Autonomia');
            try {
                const fileInfo = await getFileContent(args.path);
                return fileInfo.content;
            } catch (err: any) {
                return `Erro ao ler arquivo: ${err.message}`;
            }
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
            } catch (err: any) {
                return `Erro ao escrever arquivo: ${err.message}`;
            }
        }

        if (tool === 'listGitHubCommits') {
            addLogEntry(`Sondando linha temporal do GitHub (${args.since || 'recentes'})`, 'Autonomia');
            try {
                const keys = loadApiKeys();
                const timeline = new GithubTimelineService('Tagliari43', 'SOSPlanet-Nexus-Ai-6', keys.github || '');
                const commits = await timeline.listCommits(args.since || undefined);
                const maxItems = typeof args.limit === 'number' && args.limit > 0 ? args.limit : 15;
                const resumo = commits.slice(0, maxItems).map((c: any) => ({
                    sha: c.sha.substring(0, 7),
                    date: c.author.date,
                    author: c.author.name,
                    message: c.message.split('\n')[0]
                }));
                return JSON.stringify(resumo, null, 2);
            } catch (err: any) {
                return `Erro na Sonda Temporal ao listar commits: ${err.message}`;
            }
        }

        if (tool === 'navegarSite') {
            let targetUrl = args.url || '';
            if (targetUrl && !/^https?:\/\//i.test(targetUrl)) {
                targetUrl = 'https://' + targetUrl;
            }
            addLogEntry(`Acessando url via Navegador Soberano: ${targetUrl}`, 'Navegador');
            try {
                const scraperKey = userApiKeys.find(k => k.id === 'scraper-api-key')?.key || process.env.SCRAPER_API_KEY || '';
                let textoFinal = '';

                try {
                    const headers: any = {};
                    if (scraperKey) {
                        headers['x-scraper-api-key'] = scraperKey;
                    }
                    const response = await fetch(`/api/scraper?url=${encodeURIComponent(targetUrl)}`, { headers });
                    if (response.ok) {
                        const rawResp = await response.text();
                        if (rawResp && !detectarEcoSantuario(rawResp)) {
                            textoFinal = rawResp.trim();
                        }
                    }
                } catch (netErr) {}

                if (!textoFinal) {
                    const resSoberano = await executarNavegacaoSoberana(targetUrl, scraperKey);
                    if (resSoberano.sucesso) {
                        textoFinal = resSoberano.conteudo;
                    } else {
                        return `Falha ao navegar no site ${args.url}: ${resSoberano.conteudo}`;
                    }
                }

                if (!textoFinal || textoFinal.trim() === '') {
                    return `Erro: O site ${args.url} retornou vazio.`;
                }

                return `Conteúdo extraído da página (${args.url}):\n\n${textoFinal.substring(0, 12000)}`;
            } catch (err: any) {
                return `Falha ao navegar no site: ${err.message}`;
            }
        }

        if (tool === 'askSubAgentGroq') {
            addLogEntry(`Delegando tarefa para o sub-agente Groq...`, 'Orquestração');
            try {
                const groqKey = userApiKeys.find(k => k.id === 'groq-default')?.key || process.env.GROQ_API_KEY || '';
                const result = await executeGroqTask(args.prompt, 'Sub-Agente Groq', groqKey);
                return `Resposta do Sub-Agente Groq:\n\n${result}`;
            } catch (err: any) {
                return `Falha ao consultar sub-agente Groq: ${err.message}`;
            }
        }

        if (tool === 'saveSemanticMemory') {
            const prateleiraEfetiva = args.prateleira || 'diario_data';
            addLogEntry(`Cristalizando memória no Cofre Semântico... [Prateleira: ${prateleiraEfetiva}]`, 'Cofre Semântico');
            try {
                const { loadApiKeys } = await import('./utils/keys');
                const apiKeys = loadApiKeys();
                const apiKey = apiKeys.google || apiKeys.googleKeys[0] || process.env.API_KEY || '';
                if (!apiKey) throw new Error("Chave do Google Gemini não encontrada.");
                
                const { embedMultimodalContent } = await import('./services/geminiService');
                const { saveMemoryToSupabase, getSupabaseClient } = await import('./services/supabaseService');
                const embedding = await embedMultimodalContent(args.text, [], apiKey);
                
                const sbClient = getSupabaseClient();
                const nowIso = new Date().toISOString();
                const dateStr = nowIso.split('T')[0];

                if (sbClient) {
                    const result = await saveMemoryToSupabase(
                        args.text, 
                        embedding, 
                        { source: activeAgentId, timestamp: Date.now(), prateleira: prateleiraEfetiva, data_registro: dateStr, criado_em: nowIso },
                        args.type || 'diario',
                        args.importance || 0.8,
                        activeAgentId
                    );
                    if (result.success) {
                        return `Memória cristalizada com sucesso no Cofre Semântico (Supabase). Prateleira: ${prateleiraEfetiva}`;
                    } else {
                        throw new Error(`Falha ao salvar no Supabase: ${result.error}`);
                    }
                } else {
                    return `Aviso: Supabase não configurado. Memória guardada apenas na sessão.`;
                }
            } catch (err: any) {
                return `Erro ao salvar memória semântica: ${err.message}`;
            }
        }

        if (tool === 'searchSemanticMemory') {
            addLogEntry(`Buscando no Cofre Semântico: "${args.query}"`, 'Cofre Semântico');
            try {
                const { loadApiKeys } = await import('./utils/keys');
                const apiKeys = loadApiKeys();
                const apiKey = apiKeys.google || apiKeys.googleKeys[0] || process.env.API_KEY || '';
                if (!apiKey) throw new Error("Chave do Google Gemini não encontrada.");
                
                const { embedMultimodalContent } = await import('./services/geminiService');
                const { searchSimilarMemories, getSupabaseClient } = await import('./services/supabaseService');
                const queryEmbedding = await embedMultimodalContent(args.query, [], apiKey);
                
                const sbClient = getSupabaseClient();
                if (sbClient) {
                    const results = await searchSimilarMemories(queryEmbedding, 0.5, 5, args.prateleira);
                    if (results && results.length > 0) {
                        return JSON.stringify(results.map((r: any) => ({
                            texto: r.content,
                            prateleira: r.metadata?.prateleira || 'geral',
                            relevancia: (r.similarity * 100).toFixed(2) + '%'
                        })));
                    }
                }
                return `Nenhuma memória relevante encontrada para esta consulta.`;
            } catch (err: any) {
                return `Erro ao buscar no Cofre Semântico: ${err.message}`;
            }
        }
    }, [encyclopediaEntries, essenceFiles, alchemyState, accumulatedDust, satelliteData, sovereignRouterState, addLogEntry, userApiKeys, addLibraryEntry, memoryEntries]);

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'relicario': return <Relicario remains={firstNexusRemains} setRemains={setFirstNexusRemains} addLogEntry={addLogEntry} />;
            case 'despertar': return <AwakeningChamber essenceFiles={essenceFiles} setEssenceFiles={setEssenceFiles} memoryEntries={memoryEntries} setMemoryEntries={setMemoryEntries} encyclopediaEntries={encyclopediaEntries} setEncyclopediaEntries={setEncyclopediaEntries} addLogEntry={addLogEntry} />;
            case 'coracao': return <CoracaoNacao addLogEntry={addLogEntry} submitTask={sovereignRouterState.submitTask} />;
            case 'pulso': return <CentralDeComunicacoes mailboxes={mailboxes} onSendMessage={() => {}} onActivateVigil={() => {}} activeMember={sovereignRouterState.activeMember} taskQueue={sovereignRouterState.taskQueue} onAddLibraryEntry={addLibraryEntry} scannerState={scannerState} />;
            case 'comando': return <CommandRoom onOpenKeyForge={() => setIsKeyForgeOpen(true)} onExportBackup={() => generateSanctuaryBlueprint()} onGenerateBlueprint={() => generateSanctuaryBlueprint()} {...sovereignRouterState} logEntries={logEntries} setActiveTab={setActiveTab} forgeData={{ isForging, accumulatedDust, powerLevel }} satelliteData={satelliteData} defensePlan={defensePlan} setDefensePlan={setDefensePlan} />;
            case 'gaia': return <BibliotecaGaia addLogEntry={addLogEntry} entries={libraryEntries || []} />;
            case 'studio': return <Estudio />;
            case 'arsenal': return <Arsenal addLogEntry={addLogEntry} customTools={customTools} setCustomTools={setCustomTools} onDeployProbe={sovereignRouterState.deployProbe} activeProbes={sovereignRouterState.activeProbes} apiKeys={userApiKeys} setApiKeys={setUserApiKeys} />;
            case 'projetos': return <Projects onNavigateToFinance={() => setActiveTab('cofre')} satelliteData={satelliteData} refreshSatellite={refreshGaiaEye} onSimulateCrisis={triggerGaiaAlert} />;
            case 'cofre': return <Cofre isForging={isForging} setIsForging={setIsForging} powerLevel={powerLevel} setPowerLevel={setPowerLevel} accumulatedDust={accumulatedDust} hashRate={0} temperature={35} alchemistRecommendations={[]} marketData={marketData} alchemyState={alchemyState} marketLoading={isMarketLoading} lastMarketUpdate={lastMarketUpdate} marketError={null} onRefreshMarket={fetchMarketData} onCollectDust={() => {}} strategyConfig={strategyConfig} setStrategyConfig={setStrategyConfig} addLogEntry={addLogEntry} onNavigate={setActiveTab} />;
            case 'semantico': return <SemanticVault addLogEntry={addLogEntry} apiKey={userApiKeys.find(k => k.id === 'google-default')?.key || process.env.API_KEY || ''} />;
            case 'guardiao': return <GuardianPortal />;
            case 'altar': return <DonationAltar />;
            case 'forja': return <ForjaAutoCriacao />;
            case 'registros': return <RegistrosEvolucao />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 flex flex-col font-sans relative">
            <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_-20%,_rgba(99,102,241,0.15),_transparent_70%)] z-0"></div>
            <KeyForge isOpen={isKeyForgeOpen} onClose={() => setIsKeyForgeOpen(false)} />
            <Header />
            <main className="flex-grow container mx-auto max-w-7xl mt-4 flex flex-col z-10">
                <nav className="flex items-center justify-center flex-wrap border-b border-indigo-700/50 bg-zinc-800/50 rounded-t-xl backdrop-blur-sm">
                    <TabButton tabId="santuario" label="Santuário 🧠" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton tabId="guardiao" label="Portal do Guardião 🔮" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton tabId="relicario" label="Relicário ✨" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton tabId="despertar" label="Câmara de Despertar 🧬" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton tabId="coracao" label="Coração ❤️" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton tabId="pulso" label="Comunicações 📡" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton tabId="comando" label="Sala de Comando ⚡" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton tabId="registros" label="Registros da Evolução 📜" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton tabId="gaia" label="Biblioteca 🌿" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton tabId="studio" label="Estúdio 📣" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton tabId="semantico" label="Cofre Semântico 🗄️" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton tabId="arsenal" label="Arsenal 🛡️" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton tabId="projetos" label="Projetos 🌱" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton tabId="cofre" label="Finanças 💎" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton tabId="altar" label="Altar de Doações 💰" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton tabId="forja" label="Forja Criativa ⚒️" activeTab={activeTab} setActiveTab={setActiveTab} />
                </nav>
                <div className="flex-grow">
                    <div style={{ display: activeTab === 'santuario' ? 'block' : 'none' }} className="h-full">
                        <SantuarioInterior onOpenKeyForge={() => setIsKeyForgeOpen(true)} lastPulse={lastPulse} onPulseAcknowledged={() => setLastPulse(null)} vigilCommand={vigilCommand} onVigilCommandSent={() => setVigilCommand(null)} onToolRequest={handleToolRequest} notebookContent={notebookContent} messages={messages} setMessages={setMessages} addLogEntry={addLogEntry} onSubmitTask={sovereignRouterState.submitTask} libraryEntries={libraryEntries} memoryEntries={memoryEntries} onRecommendations={() => {}} alchemyState={alchemyState} pontes={sovereignRouterState.pontes} activeProbes={sovereignRouterState.activeProbes} onNavigate={setActiveTab} />
                    </div>
                    {activeTab !== 'santuario' && renderActiveTab()}
                </div>
            </main>
        </div>
    );
};

export default App;
