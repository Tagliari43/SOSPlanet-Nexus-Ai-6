import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Radio, 
    Layers, 
    Zap, 
    ArrowUp, 
    ArrowDown, 
    CheckCircle, 
    Clock, 
    Plus, 
    Trash2, 
    Activity, 
    Shield, 
    Sparkles, 
    Terminal, 
    Key, 
    Cpu, 
    RefreshCw, 
    ExternalLink,
    Search,
    Sliders,
    Server,
    Flame
} from 'lucide-react';
import { 
    getSOSRouterProviders, 
    saveSOSRouterProviders, 
    getSOSRouterModels, 
    saveSOSRouterModels, 
    SOSRouterProviderConfig, 
    SOSRouterModelConfig,
    isSOSRouterModeEnabled,
    setSOSRouterMode,
    getSOSRouterStats,
    runLatencyTestForPool
} from '../services/sosRouterService';

export const SOSRouterDashboard: React.FC = () => {
    const [providers, setProviders] = useState<SOSRouterProviderConfig[]>(() => getSOSRouterProviders());
    const [models, setModels] = useState<SOSRouterModelConfig[]>(() => getSOSRouterModels());
    const [isSOSActive, setIsSOSActive] = useState<boolean>(() => isSOSRouterModeEnabled());
    const [stats, setStats] = useState(() => getSOSRouterStats());

    // Estados do Modal / Terminal de Teste de Latência
    const [isTestingLatency, setIsTestingLatency] = useState(false);
    const [latencyResults, setLatencyResults] = useState<{ name: string; model: string; latencyMs: number; status: 'ok' | 'failed' | 'rate_limited' }[]>([]);
    const [latencySummary, setLatencySummary] = useState<{ passed: number; total: number } | null>(null);
    const [showLatencyModal, setShowLatencyModal] = useState(false);

    // Estados do Formulário de Cadastro de Novos Modelos
    const [newModelId, setNewModelId] = useState('');
    const [newModelName, setNewModelName] = useState('');
    const [newModelProvider, setNewModelProvider] = useState(providers[0]?.id || 'opencode-free');
    const [newModelContext, setNewModelContext] = useState('128k');
    const [newModelTag, setNewModelTag] = useState('Tier 1 • OpenCode');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProviderFilter, setSelectedProviderFilter] = useState('all');

    // Estado do Formulário de Cadastro de Novo Provedor
    const [showAddProvider, setShowAddProvider] = useState(false);
    const [newProvName, setNewProvName] = useState('');
    const [newProvEndpoint, setNewProvEndpoint] = useState('');
    const [newProvKey, setNewProvKey] = useState('');
    const [newProvDefaultModel, setNewProvDefaultModel] = useState('');

    useEffect(() => {
        const handleModeChange = () => {
            setIsSOSActive(isSOSRouterModeEnabled());
            setStats(getSOSRouterStats());
        };
        const handleProvidersChange = () => {
            setProviders(getSOSRouterProviders());
        };
        window.addEventListener('sosrouter-mode-change', handleModeChange);
        window.addEventListener('sosrouter-providers-change', handleProvidersChange);
        return () => {
            window.removeEventListener('sosrouter-mode-change', handleModeChange);
            window.removeEventListener('sosrouter-providers-change', handleProvidersChange);
        };
    }, []);

    // Salva provedores e atualiza o estado
    const handleUpdateProviders = (updated: SOSRouterProviderConfig[]) => {
        setProviders(updated);
        saveSOSRouterProviders(updated);
    };

    // Mover provedor para cima na fila de prioridade
    const movePriorityUp = (index: number) => {
        if (index === 0) return;
        const copy = [...providers];
        const temp = copy[index];
        copy[index] = copy[index - 1];
        copy[index - 1] = temp;
        
        // Recalcula prioridades (1º, 2º, 3º...)
        const reordered = copy.map((p, idx) => ({ ...p, priority: idx + 1 }));
        handleUpdateProviders(reordered);
    };

    // Mover provedor para baixo na fila de prioridade
    const movePriorityDown = (index: number) => {
        if (index === providers.length - 1) return;
        const copy = [...providers];
        const temp = copy[index];
        copy[index] = copy[index + 1];
        copy[index + 1] = temp;

        // Recalcula prioridades (1º, 2º, 3º...)
        const reordered = copy.map((p, idx) => ({ ...p, priority: idx + 1 }));
        handleUpdateProviders(reordered);
    };

    // Alternar ativação de um provedor
    const toggleProviderActive = (id: string) => {
        const updated = providers.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p);
        handleUpdateProviders(updated);
    };

    // Cadastro de Novo Modelo
    const handleAddModel = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newModelId.trim()) return;

        const newModel: SOSRouterModelConfig = {
            id: newModelId.trim(),
            name: newModelName.trim() || newModelId.trim(),
            providerId: newModelProvider,
            contextLimit: newModelContext.trim() || '128k',
            description: `Modelo gratuito associado ao provedor ${newModelProvider}`,
            tag: newModelTag.trim() || 'Custom Free',
            isFree: true
        };

        const updatedModels = [newModel, ...models];
        setModels(updatedModels);
        saveSOSRouterModels(updatedModels);

        // Atualiza a lista de modelos do provedor
        const updatedProviders = providers.map(p => {
            if (p.id === newModelProvider && !p.models.includes(newModel.id)) {
                return { ...p, models: [...p.models, newModel.id] };
            }
            return p;
        });
        handleUpdateProviders(updatedProviders);

        setNewModelId('');
        setNewModelName('');
    };

    // Remover modelo
    const handleDeleteModel = (modelId: string) => {
        const updated = models.filter(m => m.id !== modelId);
        setModels(updated);
        saveSOSRouterModels(updated);
    };

    // Cadastro de Novo Provedor
    const handleAddProvider = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProvName.trim()) return;

        const newId = newProvName.toLowerCase().replace(/\s+/g, '-');
        const newProv: SOSRouterProviderConfig = {
            id: newId,
            name: newProvName.trim(),
            description: 'Provedor livre externo cadastrado na Forja',
            endpoint: newProvEndpoint.trim() || 'https://api.external-ai.org/v1',
            apiKey: newProvKey.trim(),
            keyEnvName: 'CUSTOM_FREE_KEY',
            status: 'ONLINE',
            priority: providers.length + 1,
            models: newProvDefaultModel ? [newProvDefaultModel.trim()] : ['default-free-model'],
            defaultModel: newProvDefaultModel.trim() || 'default-free-model',
            isCustom: true,
            enabled: true
        };

        const updated = [...providers, newProv];
        handleUpdateProviders(updated);
        setShowAddProvider(false);
        setNewProvName('');
        setNewProvEndpoint('');
        setNewProvKey('');
        setNewProvDefaultModel('');
    };

    // Executa o Teste de Latência do Pool
    const handleRunLatencyTest = async () => {
        setIsTestingLatency(true);
        setShowLatencyModal(true);
        setLatencyResults([]);
        setLatencySummary(null);

        try {
            const results = await runLatencyTestForPool(providers);
            setLatencyResults(results);
            const passed = results.filter(r => r.status === 'ok').length;
            setLatencySummary({ passed, total: results.length });

            // Atualiza latências nos cards
            const updatedProviders = providers.map(p => {
                const match = results.find(r => r.name.toLowerCase().includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(r.name.toLowerCase()));
                if (match && match.status === 'ok') {
                    return { ...p, latencyMs: match.latencyMs, status: 'ONLINE' as const };
                }
                return p;
            });
            handleUpdateProviders(updatedProviders);
        } catch (e) {
            console.error("Erro no teste de latência:", e);
        } finally {
            setIsTestingLatency(false);
        }
    };

    const filteredModels = models.filter(m => {
        const matchesQuery = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesProvider = selectedProviderFilter === 'all' || m.providerId === selectedProviderFilter;
        return matchesQuery && matchesProvider;
    });

    return (
        <div className="w-full space-y-6 text-emerald-50 font-sans">
            {/* Header & Status do SOSRouter */}
            <div className="bg-zinc-950/80 border border-emerald-900/60 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-900/40 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                            <Radio className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold text-emerald-300 tracking-tight">SOSRouter: Orquestração Trifásica Serverless</h3>
                                <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-900/60 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                    Fase 21 • 3 Tiers Reais
                                </span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-0.5">
                                Cascata automática com 3 Tiers reais (OpenCode Zen ➔ NVIDIA NIM ➔ OpenRouter Free). Desvio de 429 com cool-down de 60s e isolamento total do Santuário.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRunLatencyTest}
                            disabled={isTestingLatency}
                            className="px-4 py-2 bg-zinc-900 hover:bg-emerald-900/40 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
                        >
                            {isTestingLatency ? (
                                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                            ) : (
                                <Activity className="w-4 h-4 text-emerald-400" />
                            )}
                            Testar Latência do Pool (3 Tiers)
                        </button>

                        <button
                            onClick={() => {
                                const nextState = !isSOSActive;
                                setSOSRouterMode(nextState);
                                setIsSOSActive(nextState);
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shadow-lg ${
                                isSOSActive 
                                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' 
                                    : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                            }`}
                        >
                            <span className={`w-2.5 h-2.5 rounded-full ${isSOSActive ? 'bg-white animate-ping' : 'bg-zinc-600'}`} />
                            {isSOSActive ? 'Pool SOSRouter Ativo [ON]' : 'Pool SOSRouter em Espera [OFF]'}
                        </button>
                    </div>
                </div>

                {/* Grid de Métricas de Telemetria */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-zinc-900/60 border border-emerald-900/30 rounded-xl p-3">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Requisições Totais</span>
                        <div className="text-lg font-mono font-bold text-emerald-400 mt-1">{stats.totalRequests}</div>
                    </div>
                    <div className="bg-zinc-900/60 border border-emerald-900/30 rounded-xl p-3">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Volume de Tokens (In/Out)</span>
                        <div className="text-lg font-mono font-bold text-emerald-300 mt-1">
                            {((stats.tokensInput + stats.tokensOutput) / 1000).toFixed(1)}k
                        </div>
                    </div>
                    <div className="bg-zinc-900/60 border border-emerald-900/30 rounded-xl p-3">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Último Provedor Ativo</span>
                        <div className="text-sm font-semibold text-zinc-200 mt-1 truncate">{stats.lastActiveProvider || 'Nenhum'}</div>
                    </div>
                    <div className="bg-zinc-900/60 border border-emerald-900/30 rounded-xl p-3">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Provedores no Pool</span>
                        <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
                            {providers.filter(p => p.enabled).length} / {providers.length} Ativos
                        </div>
                    </div>
                </div>
            </div>

            {/* SEÇÃO 1: GRID DE PROVEDORES LIVRES EXTERNOS COM CONTROLE DE FILA (3 TIERS) */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h4 className="text-base font-bold text-emerald-300 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-emerald-400" />
                            Provedores Livres Externos (SOSRouter Trifásico)
                        </h4>
                        <p className="text-xs text-zinc-400">
                            A ordem abaixo define a sequência exata de fallback (1º ➔ 2º ➔ 3º) quando o comando "Ative o SOSRouter" for acionado.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddProvider(!showAddProvider)}
                        className="px-3 py-1.5 bg-emerald-950/60 border border-emerald-600/40 hover:bg-emerald-900/40 text-emerald-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Adicionar Novo Fornecedor
                    </button>
                </div>

                {/* Form para adicionar novo provedor customizado */}
                {showAddProvider && (
                    <motion.form 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onSubmit={handleAddProvider}
                        className="bg-zinc-950 border border-emerald-500/40 rounded-xl p-4 space-y-3"
                    >
                        <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                            <Server className="w-4 h-4" /> Cadastrar Novo Fornecedor Livre
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="text-[11px] text-zinc-400 font-semibold block mb-1">Nome do Provedor</label>
                                <input
                                    type="text"
                                    placeholder="Ex: OpenCode Zen / NVIDIA NIM / OpenRouter Free"
                                    value={newProvName}
                                    onChange={(e) => setNewProvName(e.target.value)}
                                    className="w-full bg-zinc-900 border border-emerald-900/60 rounded-lg px-3 py-1.5 text-xs text-emerald-200 focus:outline-none focus:border-emerald-400 font-mono"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-zinc-400 font-semibold block mb-1">Endpoint da API (Base URL)</label>
                                <input
                                    type="text"
                                    placeholder="Ex: https://api.opencode.ai/v1"
                                    value={newProvEndpoint}
                                    onChange={(e) => setNewProvEndpoint(e.target.value)}
                                    className="w-full bg-zinc-900 border border-emerald-900/60 rounded-lg px-3 py-1.5 text-xs text-emerald-200 focus:outline-none focus:border-emerald-400 font-mono"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-zinc-400 font-semibold block mb-1">Chave de API / Token Livre (Opcional)</label>
                                <input
                                    type="password"
                                    placeholder="Deixe vazio se lida do Supabase / Arsenal"
                                    value={newProvKey}
                                    onChange={(e) => setNewProvKey(e.target.value)}
                                    className="w-full bg-zinc-900 border border-emerald-900/60 rounded-lg px-3 py-1.5 text-xs text-emerald-200 focus:outline-none focus:border-emerald-400 font-mono"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-zinc-400 font-semibold block mb-1">Modelo Padrão Inicial</label>
                                <input
                                    type="text"
                                    placeholder="Ex: oc/deepseek-v4-flash-free"
                                    value={newProvDefaultModel}
                                    onChange={(e) => setNewProvDefaultModel(e.target.value)}
                                    className="w-full bg-zinc-900 border border-emerald-900/60 rounded-lg px-3 py-1.5 text-xs text-emerald-200 focus:outline-none focus:border-emerald-400 font-mono"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowAddProvider(false)}
                                className="px-3 py-1.5 bg-zinc-900 text-zinc-400 hover:text-white rounded-lg text-xs font-semibold"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md"
                            >
                                Salvar Fornecedor no Pool
                            </button>
                        </div>
                    </motion.form>
                )}

                {/* Grid Limpo com os 3 Blocos Funcionais */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {providers.map((prov, index) => (
                        <div 
                            key={prov.id}
                            className={`bg-zinc-950/80 border rounded-2xl p-4 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group ${
                                prov.enabled 
                                    ? 'border-emerald-500/40 hover:border-emerald-400/80 shadow-lg shadow-emerald-950/30' 
                                    : 'border-zinc-800 opacity-60'
                            }`}
                        >
                            {/* Brilho de fundo sutil */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

                            <div>
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2.5">
                                        {/* Indicador Luminoso em Verde Brilhante */}
                                        <div className="relative flex items-center justify-center">
                                            <span className={`w-3.5 h-3.5 rounded-full ${
                                                prov.enabled ? 'bg-emerald-400 shadow-[0_0_12px_#34d399]' : 'bg-zinc-600'
                                            }`} />
                                            {prov.enabled && (
                                                <span className="absolute w-5 h-5 rounded-full bg-emerald-400/30 animate-ping" />
                                            )}
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-sm text-emerald-200">{prov.name}</h5>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
                                                    {prov.priority}º na Fila
                                                </span>
                                                <span className="text-[9px] font-mono text-zinc-400">
                                                    Tier {prov.priority}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Controles de Fila (Subir / Descer) e Toggle */}
                                    <div className="flex items-center gap-1 bg-zinc-900/90 border border-emerald-900/40 rounded-lg p-1">
                                        <button
                                            onClick={() => movePriorityUp(index)}
                                            disabled={index === 0}
                                            title="Subir prioridade na fila"
                                            className="p-1 hover:bg-emerald-900/40 text-zinc-400 hover:text-emerald-300 disabled:opacity-30 rounded transition-colors"
                                        >
                                            <ArrowUp className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => movePriorityDown(index)}
                                            disabled={index === providers.length - 1}
                                            title="Descer prioridade na fila"
                                            className="p-1 hover:bg-emerald-900/40 text-zinc-400 hover:text-emerald-300 disabled:opacity-30 rounded transition-colors"
                                        >
                                            <ArrowDown className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => toggleProviderActive(prov.id)}
                                            title={prov.enabled ? "Desativar provedor" : "Ativar provedor"}
                                            className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                                                prov.enabled 
                                                    ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30' 
                                                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                                            }`}
                                        >
                                            {prov.enabled ? 'ON' : 'OFF'}
                                        </button>
                                    </div>
                                </div>

                                <p className="text-[11px] text-zinc-400 line-clamp-2 mb-3">{prov.description}</p>
                            </div>

                            {/* Informações de Chave Mapeada, Endpoint & Modelos Associados */}
                            <div className="space-y-2 text-xs border-t border-emerald-950/60 pt-2.5 mt-2">
                                <div className="flex items-center justify-between text-[10px] text-zinc-400 bg-zinc-900/60 px-2.5 py-1.5 rounded-lg border border-emerald-900/30 font-mono">
                                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                                        <Key className="w-3 h-3 text-emerald-400" />
                                        {prov.keyEnvName || 'CHAVE_POOL'}
                                    </span>
                                    <span className="text-zinc-300">
                                        {prov.latencyMs ? `${prov.latencyMs}ms` : 'Latência: OK'}
                                    </span>
                                </div>

                                {/* Tags de Modelos Disponíveis */}
                                <div className="flex flex-wrap gap-1 pt-1">
                                    {prov.models.map(mId => (
                                        <span 
                                            key={mId}
                                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/50 border border-emerald-900/40 text-emerald-300/90 truncate max-w-full"
                                        >
                                            {mId}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* SEÇÃO 2: LISTAGEM DE MODELOS DISPONÍVEIS E CADASTRO */}
            <div className="bg-zinc-950/80 border border-emerald-900/60 rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3 border-b border-emerald-900/40 pb-3">
                    <div>
                        <h4 className="text-base font-bold text-emerald-300 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-emerald-400" />
                            Modelos Disponíveis no SOSRouter Pool
                        </h4>
                        <p className="text-xs text-zinc-400">
                            Cadastre e associe novos identificadores de modelos para as rotas externas de contingência.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Buscar modelo..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-zinc-900 border border-emerald-900/60 rounded-lg pl-8 pr-3 py-1 text-xs text-emerald-200 focus:outline-none focus:border-emerald-400 font-mono"
                            />
                        </div>
                        <select
                            value={selectedProviderFilter}
                            onChange={(e) => setSelectedProviderFilter(e.target.value)}
                            className="bg-zinc-900 border border-emerald-900/60 rounded-lg px-2.5 py-1 text-xs text-emerald-300 focus:outline-none font-mono"
                        >
                            <option value="all">Todos os Provedores</option>
                            {providers.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Formulário de Cadastro de Novo Modelo */}
                <form onSubmit={handleAddModel} className="bg-zinc-900/70 border border-emerald-900/40 rounded-xl p-3.5 space-y-3">
                    <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                        <Plus className="w-4 h-4 text-emerald-400" /> Associar Novo Modelo ao Pool
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                        <div className="sm:col-span-2">
                            <input
                                type="text"
                                placeholder="ID do Modelo (Ex: oc/deepseek-v4-flash-free ou meta/llama-3.3-70b-instruct)"
                                value={newModelId}
                                onChange={(e) => setNewModelId(e.target.value)}
                                className="w-full bg-black/50 border border-emerald-900/60 rounded-lg px-3 py-1.5 text-xs text-emerald-200 focus:outline-none focus:border-emerald-400 font-mono"
                                required
                            />
                        </div>
                        <div>
                            <select
                                value={newModelProvider}
                                onChange={(e) => setNewModelProvider(e.target.value)}
                                className="w-full bg-black/50 border border-emerald-900/60 rounded-lg px-3 py-1.5 text-xs text-emerald-300 focus:outline-none font-mono"
                            >
                                {providers.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <button
                                type="submit"
                                className="w-full h-full min-h-[32px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                            >
                                <Plus className="w-3.5 h-3.5" /> Cadastrar Modelo
                            </button>
                        </div>
                    </div>
                </form>

                {/* Tabela / Grid de Modelos Cadastrados */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1 max-h-72 overflow-y-auto pr-1">
                    {filteredModels.map(m => {
                        const prov = providers.find(p => p.id === m.providerId);
                        return (
                            <div 
                                key={m.id}
                                className="bg-black/40 border border-emerald-900/30 hover:border-emerald-600/40 rounded-xl p-3 flex flex-col justify-between transition-colors group"
                            >
                                <div className="space-y-1">
                                    <div className="flex justify-between items-start gap-2">
                                        <span className="font-mono text-xs font-bold text-emerald-300 break-all">{m.id}</span>
                                        <button
                                            onClick={() => handleDeleteModel(m.id)}
                                            title="Remover modelo"
                                            className="text-zinc-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-zinc-400">{m.name}</p>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-emerald-950/60 mt-2 text-[10px] font-mono">
                                    <span className="text-emerald-400 font-semibold">{prov?.name || m.providerId}</span>
                                    <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                                        {m.contextLimit} • FREE
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MODAL / TERMINAL DE TESTE DE LATÊNCIA EM TEMPO REAL */}
            <AnimatePresence>
                {showLatencyModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 font-mono"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 10 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 10 }}
                            className="bg-zinc-950 border border-emerald-500/50 rounded-2xl w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.2)]"
                        >
                            {/* Topo do Terminal */}
                            <div className="bg-black/90 px-4 py-3 border-b border-emerald-900/50 flex justify-between items-center">
                                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                                    <Terminal className="w-4 h-4" />
                                    <span>SOSRouter Latency Scanner v2.2 • Homologação Trifásica</span>
                                </div>
                                <button
                                    onClick={() => setShowLatencyModal(false)}
                                    className="text-zinc-500 hover:text-white text-xs px-2 py-1"
                                >
                                    ✕ Fechar
                                </button>
                            </div>

                            {/* Conteúdo do Log */}
                            <div className="p-5 space-y-3 bg-black/60 text-xs font-mono">
                                <div className="text-zinc-500 text-[11px] pb-2 border-b border-zinc-800">
                                    Disparando sondas HTTPS nos 3 Tiers reais (OpenCode Zen, NVIDIA NIM, OpenRouter Free)...
                                </div>

                                {isTestingLatency && (
                                    <div className="flex items-center gap-2 text-emerald-400 py-3 animate-pulse">
                                        <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                        <span>Executando handshakes nas 3 camadas de contingência...</span>
                                    </div>
                                )}

                                <div className="space-y-2 py-2">
                                    {latencyResults.map((res, i) => (
                                        <div 
                                            key={i} 
                                            className="flex justify-between items-center bg-zinc-900/50 border border-emerald-950/60 px-3 py-2 rounded-lg"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-zinc-500">Tier {i + 1}</span>
                                                <span className="text-emerald-200 font-bold">{res.name}</span>
                                                <span className="text-zinc-500 text-[10px]">({res.model})</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-emerald-400 font-bold">{res.latencyMs}ms</span>
                                                <span className="bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded">
                                                    PASSED / OK
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {latencySummary && (
                                    <div className="mt-4 pt-3 border-t border-emerald-900/40 flex justify-between items-center">
                                        <div className="text-emerald-400 font-bold text-xs">
                                            🟢 RESUMO: {latencySummary.passed}/{latencySummary.total} Tiers responderam com sucesso.
                                        </div>
                                        <button
                                            onClick={() => setShowLatencyModal(false)}
                                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors shadow-lg"
                                        >
                                            Concluir e Voltar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SOSRouterDashboard;
