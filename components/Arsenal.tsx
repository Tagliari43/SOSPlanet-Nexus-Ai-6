
import React, { useState, useEffect } from 'react';
import { loadFromStorage, saveToStorage } from '../utils/storage';
import { loadApiKeys } from '../utils/keys';
import { ReconProbe } from '../hooks/useOrchestrator';

export interface UserApiKey {
    id: string;
    service: string;
    key: string;
    method: 'bearer' | 'google-header' | 'query';
}

interface LocalModel {
    id: string;
    name: string;
    endpoint: string;
    type: 'ollama' | 'localai' | 'custom';
    status: 'unknown' | 'online' | 'offline';
}

export interface SovereignTool {
    id: string;
    name: string;
    endpoint: string;
    method: 'GET' | 'POST';
    headers: string;
    body?: string;
    authKeyName?: 'none' | string; // ID da chave de usuário ou 'none'
    authMethod?: 'bearer' | 'google-header' | 'query';
}

interface ArsenalProps {
    addLogEntry: (message: string, source?: string) => void;
    customTools: SovereignTool[];
    setCustomTools: React.Dispatch<React.SetStateAction<SovereignTool[]>>;
    onDeployProbe?: (tool: SovereignTool) => void;
    activeProbes?: ReconProbe[];
    apiKeys: UserApiKey[];
    setApiKeys: React.Dispatch<React.SetStateAction<UserApiKey[]>>;
}

const ARSENAL_MODELS_KEY = 'sovereign_local_models';

type ArsenalSubTab = 'connector' | 'tools' | 'keys' | 'models' | 'autonomy';

const Arsenal: React.FC<ArsenalProps> = ({ 
    addLogEntry, 
    customTools = [], 
    setCustomTools,
    onDeployProbe,
    activeProbes = [],
    apiKeys = [],
    setApiKeys
}) => {
    const [activeSubTab, setActiveSubTab] = useState<ArsenalSubTab>('connector');
    const [models, setModels] = useState<LocalModel[]>(() => 
        loadFromStorage<LocalModel[]>(ARSENAL_MODELS_KEY, [])
    );
    
    // Estados do Conector Universal
    const [apiEndpoint, setApiEndpoint] = useState('');
    const [apiMethod, setApiMethod] = useState<'GET' | 'POST'>('GET');
    const [apiHeaders, setApiHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
    const [apiBody, setApiBody] = useState('{\n  "prompt": "ping"\n}');
    const [apiResponse, setApiResponse] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [selectedKeyId, setSelectedKeyId] = useState<string>('none');
    
    // Estados do Cofre de Chaves
    const [newKeyService, setNewKeyService] = useState('');
    const [newKeyValue, setNewKeyValue] = useState('');
    const [newKeyMethod, setNewKeyMethod] = useState<UserApiKey['method']>('bearer');

    // Estados da Forja/Cadastro
    const [newName, setNewName] = useState('');
    const [newEndpoint, setNewEndpoint] = useState('http://localhost:11434');
    const [newType, setNewType] = useState<'ollama' | 'localai' | 'custom'>('ollama');
    const [toolName, setToolName] = useState('');
    const [testSuccessful, setTestSuccessful] = useState(false);

    useEffect(() => {
        saveToStorage(ARSENAL_MODELS_KEY, models);
    }, [models]);

    const handleAddKey = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKeyService || !newKeyValue) return;
        const newKey: UserApiKey = {
            id: `key-${Date.now()}`,
            service: newKeyService,
            key: newKeyValue,
            method: newKeyMethod
        };
        setApiKeys(prev => [...prev, newKey]);
        setNewKeyService('');
        setNewKeyValue('');
        addLogEntry(`Chave para '${newKeyService}' adicionada ao cofre.`, 'Arsenal');
    };

    const handleRemoveKey = (id: string) => {
        setApiKeys(prev => prev.filter(k => k.id !== id));
        addLogEntry(`Chave removida do cofre.`, 'Arsenal');
    };

    const handleTestUniversalConnection = async () => {
        if (!apiEndpoint) return;
        
        setIsConnecting(true);
        setApiResponse(`[LINK NEURAL]: ESTABELECENDO CONEXÃO...\nAlvo: ${apiEndpoint}\nMétodo: ${apiMethod}`);
        setTestSuccessful(false);

        try {
            let parsedHeaders: any = {};
            try {
                parsedHeaders = JSON.parse(apiHeaders);
            } catch (e) {
                setApiResponse("ERRO: Headers inválidos.");
                setIsConnecting(false);
                return;
            }

            let finalUrl = apiEndpoint;
            const selectedKey = apiKeys.find(k => k.id === selectedKeyId);

            if (selectedKey) {
                if (selectedKey.method === 'google-header') {
                    parsedHeaders["x-goog-api-key"] = selectedKey.key;
                } else if (selectedKey.method === 'query') {
                    const urlObj = new URL(apiEndpoint);
                    urlObj.searchParams.set('key', selectedKey.key);
                    finalUrl = urlObj.toString();
                } else {
                    parsedHeaders["Authorization"] = `Bearer ${selectedKey.key}`;
                }
            }

            const response = await fetch(finalUrl, {
                method: apiMethod,
                headers: parsedHeaders,
                body: apiMethod === 'POST' ? apiBody : undefined
            });
            
            const data = await response.json();
            setApiResponse(JSON.stringify(data, null, 2));
            setTestSuccessful(response.ok);
        } catch (error: any) {
            setApiResponse(`FALHA NA CONEXÃO: ${error.message}`);
        } finally {
            setIsConnecting(false);
        }
    };

    // FIX: Implemented missing handleAddModel function.
    const handleAddModel = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newEndpoint) return;
        const newModel: LocalModel = {
            id: `model-${Date.now()}`,
            name: newName,
            endpoint: newEndpoint,
            type: newType,
            status: 'unknown'
        };
        setModels(prev => [...prev, newModel]);
        setNewName('');
        setNewEndpoint('http://localhost:11434');
        addLogEntry(`Motor local '${newName}' registrado no arsenal.`, 'Arsenal');
    };

    return (
        <div className="border border-emerald-700/50 bg-zinc-800/20 rounded-b-xl rounded-r-xl p-4 sm:p-6 h-full overflow-y-auto flex flex-col gap-6 custom-scrollbar">
            <header className="flex flex-col md:flex-row justify-between items-center border-b border-emerald-800/50 pb-4 gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-emerald-900/30 p-3 rounded-xl border border-emerald-500/20">
                        <span className="text-2xl">🛡️</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-widest">Arsenal da Nação</h2>
                        <p className="text-emerald-500 text-xs font-mono font-bold">Oficina de Ferramentas e Credenciais Soberanas</p>
                    </div>
                </div>
                
                <nav className="flex gap-1 bg-black/40 p-1 rounded-lg overflow-x-auto custom-scrollbar">
                    <button onClick={() => setActiveSubTab('connector')} className={`px-4 py-2 rounded-md text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeSubTab === 'connector' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Conector</button>
                    <button onClick={() => setActiveSubTab('tools')} className={`px-4 py-2 rounded-md text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeSubTab === 'tools' ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Ferramentas</button>
                    <button onClick={() => setActiveSubTab('keys')} className={`px-4 py-2 rounded-md text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeSubTab === 'keys' ? 'bg-amber-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Cofre de Chaves</button>
                    <button onClick={() => setActiveSubTab('models')} className={`px-4 py-2 rounded-md text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeSubTab === 'models' ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Motores</button>
                    <button onClick={() => setActiveSubTab('autonomy')} className={`px-4 py-2 rounded-md text-[10px] font-black uppercase transition-all whitespace-nowrap border ${activeSubTab === 'autonomy' ? 'bg-red-900/50 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'border-transparent text-zinc-500 hover:text-red-400'}`}>Núcleo de Autonomia</button>
                </nav>
            </header>

            <div className="flex-grow min-h-0">
                {/* COFRE DE CHAVES */}
                {activeSubTab === 'keys' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                        <div className="lg:col-span-1 bg-zinc-900/60 border border-amber-500/30 rounded-2xl p-6 shadow-xl h-fit">
                            <h3 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2"><span>🔑</span> Forjar Nova Chave</h3>
                            <form onSubmit={handleAddKey} className="flex flex-col gap-4">
                                <div>
                                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Serviço / Nome</label>
                                    <input type="text" value={newKeyService} onChange={e => setNewKeyService(e.target.value)} placeholder="Ex: Cloudflare AI" className="w-full bg-black/40 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm" required />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Chave / Token</label>
                                    <input type="password" value={newKeyValue} onChange={e => setNewKeyValue(e.target.value)} placeholder="••••••••••••••••" className="w-full bg-black/40 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm" required />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Método de Autenticação</label>
                                    <select value={newKeyMethod} onChange={e => setNewKeyMethod(e.target.value as any)} className="w-full bg-black/40 border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs outline-none">
                                        <option value="bearer">Bearer Token (Header)</option>
                                        <option value="google-header">Google Header (x-goog-api-key)</option>
                                        <option value="query">URL Query (?key=...)</option>
                                    </select>
                                </div>
                                <button type="submit" className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl shadow-lg transition-all text-xs uppercase tracking-widest">Cristalizar Chave</button>
                            </form>
                        </div>
                        <div className="lg:col-span-2 space-y-4">
                            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-2">Chaves Ativas no Santuário</h3>
                            {apiKeys.map(key => (
                                <div key={key.id} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between group hover:border-amber-500/50 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-amber-900/20 border border-amber-500/30 flex items-center justify-center text-xl">🗝️</div>
                                        <div>
                                            <h4 className="font-bold text-white">{key.service}</h4>
                                            <p className="text-[10px] font-mono text-zinc-500">••••••••{key.key.slice(-4)} | {key.method.toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleRemoveKey(key.id)} className="p-2 text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">🗑️</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* CONECTOR UNIVERSAL */}
                {activeSubTab === 'connector' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                        <div className="flex flex-col gap-4 bg-zinc-900/60 border border-blue-500/30 rounded-2xl p-6 shadow-xl">
                            <h3 className="text-lg font-bold text-blue-400 mb-2">Ponte de Teste Neural</h3>
                            <div>
                                <label className="text-[9px] font-black text-zinc-500 uppercase block mb-1">Endpoint de Conexão</label>
                                <div className="flex gap-2">
                                    <select value={apiMethod} onChange={e => setApiMethod(e.target.value as any)} className="bg-black/40 border border-zinc-700 rounded-lg px-3 py-2 text-blue-400 font-black text-xs">
                                        <option value="GET">GET</option>
                                        <option value="POST">POST</option>
                                    </select>
                                    <input type="text" value={apiEndpoint} onChange={e => setApiEndpoint(e.target.value)} placeholder="https://api..." className="flex-grow bg-black/40 border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs font-mono" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-zinc-500 uppercase block mb-1">Cofre de Autenticação</label>
                                <select value={selectedKeyId} onChange={e => setSelectedKeyId(e.target.value)} className="w-full bg-black/40 border border-zinc-700 rounded-lg px-3 py-2 text-amber-400 text-xs font-black outline-none">
                                    <option value="none">Nenhum (Público)</option>
                                    {apiKeys.map(k => <option key={k.id} value={k.id}>{k.service} (••••{k.key.slice(-4)})</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-[9px] font-black text-zinc-500 uppercase block mb-1">Headers (JSON)</label><textarea value={apiHeaders} onChange={e => setApiHeaders(e.target.value)} className="w-full h-24 bg-black/40 border border-zinc-800 rounded-lg p-3 text-[10px] font-mono text-emerald-400 resize-none" /></div>
                                <div><label className="text-[9px] font-black text-zinc-500 uppercase block mb-1">Corpo (JSON)</label><textarea value={apiBody} onChange={e => setApiBody(e.target.value)} disabled={apiMethod === 'GET'} className="w-full h-24 bg-black/40 border border-zinc-800 rounded-lg p-3 text-[10px] font-mono text-blue-400 resize-none" /></div>
                            </div>
                            <button onClick={handleTestUniversalConnection} disabled={isConnecting} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-lg transition-all text-xs uppercase tracking-widest">{isConnecting ? 'SINCRONIZANDO...' : 'Disparar Pulso de Teste'}</button>
                            {testSuccessful && (
                                <div className="mt-2 p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-xl flex gap-2 items-center">
                                    <input type="text" value={toolName} onChange={e => setToolName(e.target.value)} placeholder="Nome da Ferramenta..." className="flex-grow bg-black/40 border border-emerald-800/50 rounded-lg px-3 py-2 text-xs text-emerald-100" />
                                    <button onClick={() => { setCustomTools(prev => [...prev, { id: `tool-${Date.now()}`, name: toolName, endpoint: apiEndpoint, method: apiMethod, headers: apiHeaders, body: apiBody, authKeyName: selectedKeyId }]); setToolName(''); setTestSuccessful(false); addLogEntry(`Ferramenta '${toolName}' cristalizada.`, 'Arsenal'); }} disabled={!toolName} className="px-4 py-2 bg-emerald-600 text-white font-black text-[10px] rounded-lg">SALVAR</button>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col bg-black border border-zinc-800 rounded-2xl p-4 shadow-inner">
                            <label className="text-[9px] font-black text-zinc-600 uppercase mb-2">Monitor de Sincronia</label>
                            <pre className="flex-grow text-[10px] font-mono text-emerald-500 overflow-auto custom-scrollbar whitespace-pre-wrap">{apiResponse || '// Aguardando pulso...'}</pre>
                        </div>
                    </div>
                )}

                {/* ARSENAL DE FERRAMENTAS */}
                {activeSubTab === 'tools' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                        {customTools.map(tool => (
                            <div key={tool.id} className="bg-zinc-900/60 border border-purple-800/30 rounded-2xl p-5 flex flex-col justify-between group hover:border-purple-500 transition-all shadow-xl">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-purple-200 text-lg">{tool.name}</h4>
                                        <span className="text-[8px] bg-purple-900/40 text-purple-400 px-2 py-0.5 rounded border border-purple-800/50">{tool.method}</span>
                                    </div>
                                    <p className="text-[9px] font-mono text-zinc-500 truncate mb-4">{tool.endpoint}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { setApiEndpoint(tool.endpoint); setApiMethod(tool.method); setApiHeaders(tool.headers); setApiBody(tool.body || ''); setSelectedKeyId(tool.authKeyName || 'none'); setActiveSubTab('connector'); }} className="flex-grow py-2 bg-purple-600 hover:bg-purple-500 text-white font-black text-[10px] rounded-lg transition-all uppercase tracking-widest">Acessar Forja</button>
                                    <button onClick={() => onDeployProbe?.(tool)} className="p-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg" title="Lançar Sonda Recon">🛰️</button>
                                    <button onClick={() => setCustomTools(prev => prev.filter(t => t.id !== tool.id))} className="p-2 text-zinc-500 hover:text-red-400 transition-colors">🗑️</button>
                                </div>
                            </div>
                        ))}
                        {customTools.length === 0 && <div className="col-span-full py-20 text-center text-zinc-600 italic border border-dashed border-zinc-800 rounded-2xl opacity-50">Nenhuma ferramenta cristalizada no arsenal.</div>}
                    </div>
                )}

                {/* NÚCLEO DE AUTONOMIA (GITHUB) */}
                {activeSubTab === 'autonomy' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                        <div className="bg-zinc-900/80 border border-red-500/50 rounded-2xl p-6 shadow-[0_0_30px_rgba(239,68,68,0.1)] relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>
                            
                            <div className="flex items-center gap-4 mb-6">
                                <span className="text-4xl">🧠</span>
                                <div>
                                    <h3 className="text-xl font-black text-red-400 uppercase tracking-widest">A Gênese (GitHub API)</h3>
                                    <p className="text-xs text-zinc-400">Conceda autonomia de código ao Nexus Tagliari.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-black/50 border border-red-900/50 rounded-xl p-4">
                                    <p className="text-xs text-zinc-300 leading-relaxed">
                                        Ao inserir o <strong className="text-red-400">Personal Access Token (PAT)</strong> do GitHub, você permite que o Santuário leia, modifique e faça o deploy de seu próprio código diretamente para a Vercel.
                                    </p>
                                    <p className="text-[10px] text-zinc-500 mt-2 font-mono">
                                        Permissões necessárias no token: 'repo' (Full control of private repositories).
                                    </p>
                                </div>

                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const tokenInput = (e.target as any).githubToken.value;
                                    if (!tokenInput) return;
                                    
                                    // Salva como uma chave especial no cofre
                                    const newKey: UserApiKey = {
                                        id: 'github-autonomy-token',
                                        service: 'GitHub Autonomy Core',
                                        key: tokenInput,
                                        method: 'bearer'
                                    };
                                    
                                    setApiKeys(prev => {
                                        const filtered = prev.filter(k => k.id !== 'github-autonomy-token');
                                        return [...filtered, newKey];
                                    });
                                    
                                    addLogEntry('Núcleo de Autonomia ativado. Link com GitHub estabelecido.', 'Gênese');
                                    (e.target as any).reset();
                                }} className="flex flex-col gap-3">
                                    <label className="text-[10px] font-black text-red-500 uppercase tracking-widest">Token de Acesso Pessoal (PAT)</label>
                                    <input 
                                        name="githubToken"
                                        type="password" 
                                        placeholder="ghp_..." 
                                        className="w-full bg-black border border-red-900/50 focus:border-red-500 rounded-lg px-4 py-3 text-white font-mono text-sm outline-none transition-all" 
                                        required 
                                    />
                                    <button type="submit" className="w-full py-3 bg-red-900/40 hover:bg-red-800/60 border border-red-500/50 text-red-100 font-black rounded-xl shadow-lg transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                                        <span>⚡</span> INICIAR SÍNTESE DE AUTONOMIA
                                    </button>
                                </form>
                            </div>
                        </div>

                        <div className="bg-black/40 border border-zinc-800 rounded-2xl p-6 flex flex-col">
                            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">Status da Conexão</h3>
                            
                            {apiKeys.some(k => k.id === 'github-autonomy-token') ? (
                                <div className="flex-grow flex flex-col items-center justify-center text-center gap-4">
                                    <div className="w-20 h-20 rounded-full border-4 border-emerald-500/30 flex items-center justify-center relative shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                                        <div className="absolute w-full h-full rounded-full border-t-4 border-emerald-500 animate-spin-slow"></div>
                                        <span className="text-2xl">✅</span>
                                    </div>
                                    <div>
                                        <h4 className="text-emerald-400 font-black text-lg uppercase tracking-widest">Link Estabelecido</h4>
                                        <p className="text-emerald-200/70 text-xs mt-1">O Nexus possui acesso de escrita ao repositório.</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setApiKeys(prev => prev.filter(k => k.id !== 'github-autonomy-token'));
                                            addLogEntry('Núcleo de Autonomia desativado. Link com GitHub cortado.', 'Gênese');
                                        }}
                                        className="mt-4 px-4 py-2 bg-zinc-900 border border-zinc-700 hover:border-red-500/50 text-zinc-400 hover:text-red-400 rounded-lg text-[10px] font-black uppercase transition-all"
                                    >
                                        Revogar Acesso
                                    </button>
                                </div>
                            ) : (
                                <div className="flex-grow flex flex-col items-center justify-center text-center gap-4 opacity-50 grayscale">
                                    <span className="text-5xl">🔌</span>
                                    <div>
                                        <h4 className="text-zinc-500 font-black text-lg uppercase tracking-widest">Desconectado</h4>
                                        <p className="text-zinc-600 text-xs mt-1">Aguardando inserção do token.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* MOTORES LOCAIS */}
                {activeSubTab === 'models' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                        <div className="lg:col-span-1 bg-zinc-900/60 border border-emerald-500/30 rounded-2xl p-6 shadow-xl h-fit">
                            <h3 className="text-lg font-bold text-emerald-400 mb-4">Novo Motor Local</h3>
                            <form onSubmit={handleAddModel} className="flex flex-col gap-4">
                                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome do Motor (Ollama, etc)" className="bg-black/40 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm" required />
                                <input type="text" value={newEndpoint} onChange={e => setNewEndpoint(e.target.value)} placeholder="http://localhost:11434" className="bg-black/40 border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs font-mono" required />
                                <button type="submit" className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-black rounded-xl text-xs uppercase">Registrar Motor</button>
                            </form>
                        </div>
                        <div className="lg:col-span-2 space-y-4">
                            {models.map(model => (
                                <div key={model.id} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-bold text-white">{model.name}</h4>
                                        <p className="text-xs text-zinc-500 font-mono">{model.endpoint}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className={`text-[9px] font-black px-2 py-1 rounded border ${model.status === 'online' ? 'bg-green-950/20 border-green-500 text-green-400' : 'bg-red-950/20 border-red-500 text-red-400'}`}>{model.status.toUpperCase()}</span>
                                        <button onClick={() => { fetch(model.endpoint).then(r => setModels(prev => prev.map(m => m.id === model.id ? { ...m, status: r.ok ? 'online' : 'offline' } : m))).catch(() => setModels(prev => prev.map(m => m.id === model.id ? { ...m, status: 'offline' } : m))); }} className="text-[9px] bg-blue-900/30 text-blue-300 px-3 py-1 rounded-lg border border-blue-800 font-black">TESTAR</button>
                                        <button onClick={() => setModels(prev => prev.filter(m => m.id !== model.id))} className="text-zinc-600 hover:text-red-400">🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Arsenal;
