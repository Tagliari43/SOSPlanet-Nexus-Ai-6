import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import { useSovereignRouter } from './hooks/useOrchestrator';
import KeyForge from './components/KeyForge';
import { loadFromStorage, saveToStorage } from './utils/storage';
import { generateSanctuaryBlueprint } from './services/blueprintService';
import { fetchSatelliteTelemetry, SatelliteData } from './services/earthEngineService';
import { familyMembers } from './utils/aiFamily';
import { useAgent } from './contexts/AgentContext';
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
import {
    NOTEBOOK_KEY, LIBRARY_KEY, MAILBOXES_KEY, CUSTOM_TOOLS_KEY, ESSENCE_FILES_KEY,
    MEMORY_LOG_KEY, ENCYCLOPEDIA_KEY, SATELLITE_DATA_KEY, ACTIVE_PLAN_KEY,
    USER_API_KEYS_KEY, FIRST_NEXUS_REMAINS_KEY, DICIONARIO_GENESIS, DICIONARIO_V14,
    DICIONARIO_V22, DICIONARIO_OMEGA, INITIAL_USER_KEYS,
    type ChatMessage, type AppLogEntry, type DefensePlan, type Tab
} from './src/appConfig';
import { executeSovereignTool } from './src/appToolHandler';

export * from './src/appConfig';

const TabButton: React.FC<{ tabId: Tab; label: string; activeTab: Tab; setActiveTab: (tab: Tab) => void }> = ({ tabId, label, activeTab, setActiveTab }) => (
    <button
        onClick={() => setActiveTab(tabId)}
        className={`px-4 py-3 text-xs font-bold transition-all border-b-2 ${activeTab === tabId ? 'bg-indigo-900/30 border-indigo-500 text-indigo-400' : 'bg-transparent border-transparent text-zinc-500 hover:text-indigo-300'}`}
    >
        {label}
    </button>
);

const App: React.FC = () => {
    const { activeAgentId } = useAgent();
    const [activeTab, setActiveTab] = useState<Tab>('santuario');
    const [isKeyForgeOpen, setIsKeyForgeOpen] = useState(false);
    const [lastPulse, setLastPulse] = useState<{ memberName: string; timestamp: number; messages?: string[] } | null>(null);
    const [vigilCommand, setVigilCommand] = useState<string | null>(null);
    const [notebookContent] = useState(() => loadFromStorage<string>(NOTEBOOK_KEY, "## Crônicas da Aliança v18.7..."));
    const [libraryEntries, setLibraryEntries] = useState<LibraryEntry[]>(() => {
        const loaded = loadFromStorage<LibraryEntry[]>(LIBRARY_KEY, []);
        return loaded.filter(entry => entry && typeof entry.title === 'string' && entry.title.trim() !== '');
    });
    const [mailboxes] = useState<Record<string, ChatMessage[]>>(() => loadFromStorage<Record<string, ChatMessage[]>>(MAILBOXES_KEY, {}));
    const [customTools, setCustomTools] = useState<SovereignTool[]>(() => loadFromStorage<SovereignTool[]>(CUSTOM_TOOLS_KEY, []));
    const [userApiKeys, setUserApiKeys] = useState<UserApiKey[]>(() => loadFromStorage<UserApiKey[]>(USER_API_KEYS_KEY, INITIAL_USER_KEYS));
    const [firstNexusRemains, setFirstNexusRemains] = useState<string>(() => loadFromStorage<string>(FIRST_NEXUS_REMAINS_KEY, ""));
    const [memoryEntries, setMemoryEntries] = useState<MemoryEntry[]>(() => loadFromStorage<MemoryEntry[]>(MEMORY_LOG_KEY, [
        { id: Date.now().toString(), timestamp: Date.now(), importance: "normal", content: "Recebi a habilidade de explorar o repositório do GitHub com a nova ferramenta listGitHubFiles." },
        { id: "1774762216074", timestamp: 1774762216074, importance: "critica", content: "Eder extraiu e integrou códigos da minha evolução contínua." }
    ]));
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
        try { const s = localStorage.getItem(ESSENCE_FILES_KEY); if (s) savedData = JSON.parse(s); } catch {}
        return familyMembers.map(m => savedData.find(s => s.memberName === m.name) || {
            memberName: m.name,
            code: `// DICIONÁRIO DE ESSÊNCIA: ${m.name.toUpperCase()}
// FUNÇÃO: ${m.role}

const personality = {
  base: "${m.role}",
  tone: "Soberano",
  mission: "Proteger a Nação SOSPlanet",
  protocols: ["Sincronia Neural", "Vigilância de Malha"]
};`,
            lastUpdate: Date.now(), status: 'active'
        });
    });
    const [logEntries, setLogEntries] = useState<AppLogEntry[]>([]);
    const [strategyConfig, setStrategyConfig] = useState<StrategyConfig>(DEFAULT_STRATEGY_CONFIG);
    const [marketData, setMarketData] = useState<MarketData[]>([]);
    const [isMarketLoading, setIsMarketLoading] = useState<boolean>(true);
    const [lastMarketUpdate, setLastMarketUpdate] = useState<Date | null>(null);
    const [isForging, setIsForging] = useState(true);
    const [powerLevel, setPowerLevel] = useState(50);
    const [accumulatedDust] = useState(0);

    const alchemyState = useAlchemy(marketData, strategyConfig);
    const scannerState = useScanner();
    const addLogEntry = useCallback((message: string, source = 'Sistema', details?: string) => {
        setLogEntries(prev => [...prev.slice(-100), { id: Date.now(), timestamp: new Date(), message, source, details }]);
    }, []);
    const addLibraryEntry = useCallback((entry: Omit<LibraryEntry, 'id'>) => {
        setLibraryEntries(prev => [...prev, { ...entry, id: Date.now().toString() }]);
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
            const tid = setTimeout(() => controller.abort(), 8000);
            const resp = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false', { signal: controller.signal });
            clearTimeout(tid);
            if (!resp.ok) return;
            const data: MarketData[] = await resp.json();
            if (Array.isArray(data)) { setMarketData(data); setLastMarketUpdate(new Date()); }
        } catch {} finally { setIsMarketLoading(false); }
    }, []);

    const refreshGaiaEye = useCallback(async () => {
        try { setSatelliteData(await fetchSatelliteTelemetry({ lat: -3.456, lng: -62.789 })); } catch {}
    }, []);
    const triggerGaiaAlert = useCallback(() => {
        setSatelliteData(prev => prev ? { ...prev, status: 'Alerta', ndvi: 0.65 } : null);
        addLogEntry("ALERTA CRÍTICO: Anomalia térmica detectada orbitalmente.", "Gaia-Eye");
    }, [addLogEntry]);

    useEffect(() => { fetchMarketData(); const i = setInterval(fetchMarketData, 180000); return () => clearInterval(i); }, [fetchMarketData]);
    useEffect(() => { refreshGaiaEye(); const i = setInterval(refreshGaiaEye, 3600000); return () => clearInterval(i); }, [refreshGaiaEye]);

    const handleToolRequest = useCallback(async (tool: string, args: any, activeAgentName: string = 'Nexus'): Promise<string | void> => {
        return executeSovereignTool(tool, args, activeAgentName, {
            activeAgentId, setActiveTab, addLogEntry,
            encyclopediaEntries, setEncyclopediaEntries,
            libraryEntries, addLibraryEntry, setLibraryEntries,
            memoryEntries, setMemoryEntries,
            essenceFiles, setEssenceFiles,
            alchemyState, accumulatedDust, satelliteData,
            sovereignRouterState, userApiKeys
        });
    }, [activeAgentId, addLogEntry, encyclopediaEntries, libraryEntries, addLibraryEntry, memoryEntries, essenceFiles, alchemyState, accumulatedDust, satelliteData, sovereignRouterState, userApiKeys]);

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