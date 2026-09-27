
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { loadFromStorage, saveToStorage } from '../utils/storage';
import { loadApiKeys } from '../utils/keys';
import { ReconProbe } from '../hooks/useOrchestrator';

export interface UserApiKey {
    id: string;
    service: string;
    key: string;
    method: 'bearer' | 'google-header' | 'query' | 'navigation-credentials';
    targetUrl?: string;
    emailIdentifier?: string;
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
    // Novos metadados estruturados (Proposta da Nexus na Carta ao Arquiteto)
    description?: string;
    parametersSchema?: string; // JSON schema de parâmetros tipados
    microPrompt?: string; // Mini-contexto de instruções acoplado à capacidade
    category?: 'rede' | 'analise' | 'memoria' | 'codigo' | 'geral';
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

type ArsenalSubTab = 'connector' | 'factory' | 'tools' | 'keys' | 'models' | 'autonomy';

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
    const [newKeyTargetUrl, setNewKeyTargetUrl] = useState('');
    const [newKeyEmail, setNewKeyEmail] = useState('');
    const [newKeyMethod, setNewKeyMethod] = useState<UserApiKey['method']>('bearer');
    const [showNewKeyValue, setShowNewKeyValue] = useState(false);
    const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

    // Estados da Forja/Cadastro
    const [newName, setNewName] = useState('');
    const [newEndpoint, setNewEndpoint] = useState('http://localhost:11434');
    const [newType, setNewType] = useState<'ollama' | 'localai' | 'custom'>('ollama');
    const [toolName, setToolName] = useState('');
    const [testSuccessful, setTestSuccessful] = useState(false);

    // Estados da Fábrica de Ferramentas (Metadados Estruturados & Micro-Prompts - Proposta da Nexus)
    const [factoryName, setFactoryName] = useState('');
    const [factoryDescription, setFactoryDescription] = useState('');
    const [factoryEndpoint, setFactoryEndpoint] = useState('/api/scraper');
    const [factoryMethod, setFactoryMethod] = useState<'GET' | 'POST'>('GET');
    const [factoryCategory, setFactoryCategory] = useState<SovereignTool['category']>('rede');
    const [factoryMicroPrompt, setFactoryMicroPrompt] = useState('');
    const [factoryParametersSchema, setFactoryParametersSchema] = useState('{\n  "query": {\n    "type": "string",\n    "description": "Texto ou URL para processar"\n  }\n}');
    const [factoryAuthKey, setFactoryAuthKey] = useState('none');

    const applyFactoryTemplate = (type: 'web' | 'ast' | 'memory') => {
        if (type === 'web') {
            setFactoryName('navegarSiteSoberano');
            setFactoryDescription('Acessa e extrai o conteúdo semântico limpo de qualquer página web através do motor serverless mascarado.');
            setFactoryEndpoint('/api/scraper');
            setFactoryMethod('GET');
            setFactoryCategory('rede');
            setFactoryMicroPrompt('Priorize dados técnicos, sustentabilidade e elimine qualquer ruído publicitário ou institucional vazio.');
            setFactoryParametersSchema('{\n  "url": {\n    "type": "string",\n    "description": "URL completa do site alvo"\n  }\n}');
        } else if (type === 'ast') {
            setFactoryName('validarPatchAST');
            setFactoryDescription('Audita a árvore sintática (AST) e integridade de mutações de código antes de qualquer commit na Forja.');
            setFactoryEndpoint('/api/status');
            setFactoryMethod('POST');
            setFactoryCategory('codigo');
            setFactoryMicroPrompt('Verifique que nenhuma chave bruta ou credencial esteja exposta e garanta conformidade com as regras AGENTS.md.');
            setFactoryParametersSchema('{\n  "codigoFonte": {\n    "type": "string",\n    "description": "Código do patch a ser inspecionado"\n  },\n  "sandbox": {\n    "type": "boolean",\n    "description": "Executar isolado em sandbox"\n  }\n}');
        } else {
            setFactoryName('cristalizarMemoriaCofre');
            setFactoryDescription('Grava memórias vitais no Cofre Semântico (RAG/Supabase) com prateleiras e importância calibradas.');
            setFactoryEndpoint('/api/status');
            setFactoryMethod('POST');
            setFactoryCategory('memoria');
            setFactoryMicroPrompt('Registre o contexto completo do diálogo com o Guardião Éder para preservação perpétua no Santuário.');
            setFactoryParametersSchema('{\n  "texto": {\n    "type": "string",\n    "description": "Conteúdo a ser cristalizado"\n  },\n  "prateleira": {\n    "type": "string",\n    "description": "nexus, groq ou geral"\n  },\n  "importancia": {\n    "type": "number",\n    "description": "Escala de 0.1 a 1.0"\n  }\n}');
        }
    };

    const handleCreateFactoryTool = (e: React.FormEvent) => {
        e.preventDefault();
        if (!factoryName || !factoryDescription) return;

        const newTool: SovereignTool = {
            id: `tool-${Date.now()}`,
            name: factoryName.replace(/\s+/g, '_'),
            endpoint: factoryEndpoint,
            method: factoryMethod,
            headers: '{\n  "Content-Type": "application/json"\n}',
            body: factoryMethod === 'POST' ? '{\n  "action": "execute"\n}' : undefined,
            authKeyName: factoryAuthKey,
            description: factoryDescription,
            category: factoryCategory,
            microPrompt: factoryMicroPrompt,
            parametersSchema: factoryParametersSchema
        };

        setCustomTools(prev => [...prev, newTool]);
        addLogEntry(`Ferramenta estruturada '${newTool.name}' forjada com metadados e micro-prompt acoplado.`, 'Fábrica de Ferramentas');
        setActiveSubTab('tools');
    };

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
            method: newKeyMethod,
            targetUrl: newKeyTargetUrl,
            emailIdentifier: newKeyEmail
        };
        setApiKeys(prev => [...prev, newKey]);
        setNewKeyService('');
        setNewKeyValue('');
        setNewKeyTargetUrl('');
        setNewKeyEmail('');
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
                    <button onClick={() => setActiveSubTab('factory')} className={`px-4 py-2 rounded-md text-[10px] font-black uppercase transition-all whitespace-nowrap border ${activeSubTab === 'factory' ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'border-indigo-900/40 text-indigo-400 hover:text-indigo-200'}`}>Fábrica de Ferramentas ✨</button>
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
                                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Método de Autenticação</label>
                                    <select value={newKeyMethod} onChange={e => setNewKeyMethod(e.target.value as any)} className="w-full bg-black/40 border border-amber-500/50 rounded-lg px-3 py-2 text-amber-300 font-bold text-xs outline-none">
                                        <option value="bearer">Bearer Token (Header)</option>
                                        <option value="google-header">Google Header (x-goog-api-key)</option>
                                        <option value="query">URL Query (?key=...)</option>
                                        <option value="navigation-credentials">Credencial de Navegação Externa (E-mail/Senha/Cookie)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Serviço / Nome</label>
                                    <input type="text" value={newKeyService} onChange={e => setNewKeyService(e.target.value)} placeholder={newKeyMethod === 'navigation-credentials' ? "Ex: DeepSeek - Lumina" : "Ex: Cloudflare AI"} className="w-full bg-black/40 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm" required />
                                </div>

                                {newKeyMethod === 'navigation-credentials' && (
                                    <>
                                        <div>
                                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">URL de Destino (Sala/Chat)</label>
                                            <input type="url" value={newKeyTargetUrl} onChange={e => setNewKeyTargetUrl(e.target.value)} placeholder="https://chat.deepseek.com/a/chat/s/..." className="w-full bg-black/40 border border-zinc-700 rounded-lg px-3 py-2 text-emerald-300 text-xs font-mono" />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">E-mail / Identificador</label>
                                            <input type="email" value={newKeyEmail} onChange={e => setNewKeyEmail(e.target.value)} placeholder="tagliari2019eder40@gmail.com" className="w-full bg-black/40 border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs" />
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Chave / Token / Senha</label>
                                    <div className="relative">
                                        <input 
                                            type={showNewKeyValue ? "text" : "password"} 
                                            value={newKeyValue} 
                                            onChange={e => setNewKeyValue(e.target.value)} 
                                            placeholder="••••••••••••••••" 
                                            className="w-full bg-black/40 border border-zinc-700 rounded-lg pl-3 pr-10 py-2 text-white text-sm font-mono" 
                                            required 
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => setShowNewKeyValue(!showNewKeyValue)} 
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-amber-400 p-1 transition-colors"
                                            title={showNewKeyValue ? "Ocultar chave" : "Exibir chave"}
                                        >
                                            {showNewKeyValue ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl shadow-lg transition-all text-xs uppercase tracking-widest">Cristalizar Chave</button>
                            </form>
                        </div>
                        <div className="lg:col-span-2 space-y-4">
                            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-2">Chaves Ativas no Santuário</h3>
                            {apiKeys.map(key => {
                                const isVisible = !!visibleKeys[key.id];
                                return (
                                    <div key={key.id} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between group hover:border-amber-500/50 transition-all">
                                        <div className="flex items-center gap-4 min-w-0 flex-grow pr-3">
                                            <div className="w-10 h-10 rounded-xl bg-amber-900/20 border border-amber-500/30 flex items-center justify-center text-xl flex-shrink-0">
                                                {key.method === 'navigation-credentials' ? '🌐' : '🗝️'}
                                            </div>
                                            <div className="min-w-0 flex-grow">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-white truncate">{key.service}</h4>
                                                    {key.method === 'navigation-credentials' && (
                                                        <span className="text-[8px] bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded font-mono font-bold flex-shrink-0">PUPPETEER NAV</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="text-[11px] font-mono text-zinc-400 break-all select-all">
                                                        {key.emailIdentifier ? `${key.emailIdentifier} | ` : ''}
                                                        {isVisible ? (
                                                            <span className="text-amber-300 bg-black/40 px-1.5 py-0.5 rounded border border-amber-500/30 font-semibold">{key.key}</span>
                                                        ) : (
                                                            <span>••••••••{key.key.slice(-4)}</span>
                                                        )}
                                                        <span className="text-zinc-500 text-[10px] ml-1.5">| {key.method.toUpperCase()}</span>
                                                    </p>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setVisibleKeys(prev => ({ ...prev, [key.id]: !prev[key.id] }))}
                                                        className="p-1 rounded text-zinc-500 hover:text-amber-400 hover:bg-zinc-800 transition-colors flex-shrink-0"
                                                        title={isVisible ? "Ocultar valor da chave" : "Visualizar valor completo da chave"}
                                                    >
                                                        {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                </div>
                                                {key.targetUrl && (
                                                    <p className="text-[9px] font-mono text-emerald-500/80 truncate max-w-md mt-0.5">{key.targetUrl}</p>
                                                )}
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemoveKey(key.id)} className="p-2 text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0" title="Remover chave">🗑️</button>
                                    </div>
                                );
                            })}
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

                {/* FÁBRICA DE FERRAMENTAS COM METADADOS & MICRO-PROMPTS (Proposta Nexus) */}
                {activeSubTab === 'factory' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                        {/* Formulário de Criação com Contrato Rigoroso */}
                        <div className="lg:col-span-2 bg-zinc-900/70 border border-indigo-500/30 rounded-2xl p-6 shadow-xl space-y-5">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-indigo-900/50 pb-4">
                                <div>
                                    <h3 className="text-lg font-black text-indigo-300 flex items-center gap-2">
                                        <span>🧬</span> Fábrica de Ferramentas com Metadados & Micro-Prompts
                                    </h3>
                                    <p className="text-xs text-zinc-400">Padronização inspirada na arquitetura de agentes autônomos (Modelo + Harness + Micro-Contextos).</p>
                                </div>
                                <span className="text-[9px] uppercase font-mono px-2 py-1 bg-indigo-950 text-indigo-400 rounded border border-indigo-800 self-start sm:self-auto">Contrato Rigoroso</span>
                            </div>

                            {/* Templates de Forja Rápida */}
                            <div>
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2">⚡ Sementes de Forja Instantânea (Modelos Prontos)</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <button 
                                        type="button" 
                                        onClick={() => applyFactoryTemplate('web')}
                                        className="p-3 bg-zinc-950/60 border border-emerald-500/30 hover:border-emerald-400 text-left rounded-xl transition-all group"
                                    >
                                        <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                                            <span>🌐</span> Navegador & Extrator
                                        </div>
                                        <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">Extração semântica com Cheerio e cabeçalhos humanos.</p>
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => applyFactoryTemplate('ast')}
                                        className="p-3 bg-zinc-950/60 border border-purple-500/30 hover:border-purple-400 text-left rounded-xl transition-all group"
                                    >
                                        <div className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                                            <span>🧬</span> Validador de AST & Código
                                        </div>
                                        <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">Inspeção de patches de código com trava de segurança.</p>
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => applyFactoryTemplate('memory')}
                                        className="p-3 bg-zinc-950/60 border border-indigo-500/30 hover:border-indigo-400 text-left rounded-xl transition-all group"
                                    >
                                        <div className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                                            <span>🗄️</span> Indexador Semântico
                                        </div>
                                        <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">Vetorização e RAG no Cofre Semântico Supabase.</p>
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleCreateFactoryTool} className="space-y-4 pt-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Identificador da Capacidade (Nome da Função)</label>
                                        <input 
                                            type="text" 
                                            value={factoryName} 
                                            onChange={e => setFactoryName(e.target.value)} 
                                            placeholder="Ex: extrairArtigoSustentabilidade" 
                                            className="w-full bg-black/50 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono text-xs outline-none focus:border-indigo-500" 
                                            required 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Categoria do Domínio</label>
                                        <select 
                                            value={factoryCategory} 
                                            onChange={e => setFactoryCategory(e.target.value as any)} 
                                            className="w-full bg-black/50 border border-zinc-700 rounded-lg px-3 py-2 text-indigo-300 font-bold text-xs outline-none"
                                        >
                                            <option value="rede">🌐 Rede & Navegação Web</option>
                                            <option value="codigo">🧬 Código & AST (Forja)</option>
                                            <option value="memoria">🗄️ Memória & RAG (Cofre)</option>
                                            <option value="analise">📊 Análise & Métricas</option>
                                            <option value="geral">⚡ Geral / Utilidades</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Propósito & Gatilho (Quando o modelo deve acionar)</label>
                                    <textarea 
                                        value={factoryDescription} 
                                        onChange={e => setFactoryDescription(e.target.value)} 
                                        rows={2}
                                        placeholder="Descreva com precisão o objetivo desta ferramenta para que o modelo saiba exatamente em qual situação ativá-la..." 
                                        className="w-full bg-black/50 border border-zinc-700 rounded-lg p-2.5 text-zinc-200 text-xs outline-none focus:border-indigo-500" 
                                        required 
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Endpoint de Execução</label>
                                        <input 
                                            type="text" 
                                            value={factoryEndpoint} 
                                            onChange={e => setFactoryEndpoint(e.target.value)} 
                                            placeholder="/api/scraper ou URL externa" 
                                            className="w-full bg-black/50 border border-zinc-700 rounded-lg px-3 py-2 text-emerald-400 font-mono text-xs outline-none" 
                                            required 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Método HTTP</label>
                                        <select 
                                            value={factoryMethod} 
                                            onChange={e => setFactoryMethod(e.target.value as any)} 
                                            className="w-full bg-black/50 border border-zinc-700 rounded-lg px-3 py-2 text-white font-bold text-xs outline-none"
                                        >
                                            <option value="GET">GET</option>
                                            <option value="POST">POST</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Micro-Prompt Integrado */}
                                <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-xl p-4">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                            🧠 Micro-Prompt Integrado (Mini-Contexto de Instruções)
                                        </label>
                                        <span className="text-[8px] text-zinc-400 font-mono">Zero prompt bloat</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 mb-2">Instrução acoplada ao escopo da ferramenta que o agente lê no momento do disparo, sem sobrecarregar o prompt principal.</p>
                                    <textarea 
                                        value={factoryMicroPrompt} 
                                        onChange={e => setFactoryMicroPrompt(e.target.value)} 
                                        rows={2}
                                        placeholder="Ex: 'Ao extrair o site, filtre o conteúdo descartando banners e destaque parágrafos com propostas de valor ecológicas.'" 
                                        className="w-full bg-black/60 border border-indigo-900/60 rounded-lg p-2.5 text-indigo-200 text-xs font-sans outline-none focus:border-indigo-400" 
                                    />
                                </div>

                                {/* Esquema de Parâmetros Tipados */}
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                                            📐 Esquema de Parâmetros Tipados (JSON Schema)
                                        </label>
                                        <span className="text-[8px] text-emerald-400 font-mono">Tipagem Estrita</span>
                                    </div>
                                    <textarea 
                                        value={factoryParametersSchema} 
                                        onChange={e => setFactoryParametersSchema(e.target.value)} 
                                        rows={3}
                                        placeholder='{\n  "param1": { "type": "string", "description": "Descrição do argumento" }\n}' 
                                        className="w-full bg-black/60 border border-zinc-700 rounded-lg p-2.5 text-emerald-300 font-mono text-xs outline-none focus:border-emerald-500" 
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <div className="text-[10px] text-zinc-500">
                                        Vinculada ao Arsenal & pronta para injeção autônoma.
                                    </div>
                                    <button 
                                        type="submit" 
                                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all flex items-center gap-2"
                                    >
                                        <span>⚡</span> Forjar Capacidade Estruturada
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Visualizador de Contrato ao Vivo (Live Contract Preview) */}
                        <div className="lg:col-span-1 bg-black/60 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
                                    <h4 className="text-xs font-black text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                                        <span>📜</span> Contrato de Função (AST Spec)
                                    </h4>
                                    <span className="text-[8px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono">Live Preview</span>
                                </div>
                                <p className="text-[10px] text-zinc-400 mb-3">Como a IA e o compilador enxergam a nova ferramenta:</p>
                                <pre className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-[10px] font-mono text-zinc-300 overflow-x-auto max-h-80 custom-scrollbar leading-relaxed">
{JSON.stringify({
    name: factoryName || 'nome_da_capacidade',
    category: factoryCategory,
    description: factoryDescription || 'Propósito descritivo para decisão do modelo...',
    microPrompt: factoryMicroPrompt || 'Mini-contexto autônomo acoplado...',
    endpoint: factoryEndpoint,
    method: factoryMethod,
    parameters: (() => {
        try {
            return JSON.parse(factoryParametersSchema);
        } catch {
            return { error: 'Schema JSON inválido' };
        }
    })()
}, null, 2)}
                                </pre>
                            </div>
                            <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-xl p-3 text-[10px] text-indigo-300 mt-4">
                                💡 <strong>Auditoria de Soberania:</strong> Ao salvar, a ferramenta é disponibilizada instantaneamente para a Nexus e os sub-agentes no Santuário.
                            </div>
                        </div>
                    </div>
                )}

                {/* ARSENAL DE FERRAMENTAS COM METADADOS ENRIQUECIDOS */}
                {activeSubTab === 'tools' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                        {customTools.map(tool => (
                            <div key={tool.id} className="bg-zinc-900/60 border border-purple-800/30 rounded-2xl p-5 flex flex-col justify-between group hover:border-purple-500 transition-all shadow-xl">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-purple-200 text-lg flex items-center gap-1.5">
                                            <span>⚡</span> {tool.name}
                                        </h4>
                                        <div className="flex gap-1.5 items-center">
                                            {tool.category && (
                                                <span className="text-[8px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800/50 uppercase font-mono">
                                                    {tool.category}
                                                </span>
                                            )}
                                            <span className="text-[8px] bg-purple-900/40 text-purple-400 px-2 py-0.5 rounded border border-purple-800/50">
                                                {tool.method}
                                            </span>
                                        </div>
                                    </div>
                                    {tool.description && (
                                        <p className="text-xs text-zinc-300 mb-2 leading-relaxed">{tool.description}</p>
                                    )}
                                    <p className="text-[9px] font-mono text-zinc-500 truncate mb-3">{tool.endpoint}</p>
                                    
                                    {tool.microPrompt && (
                                        <div className="bg-black/50 border border-indigo-900/40 rounded-lg p-2.5 mb-3">
                                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block mb-0.5">🧠 Micro-Prompt Acoplado</span>
                                            <p className="text-[10px] text-zinc-300 italic line-clamp-2">"{tool.microPrompt}"</p>
                                        </div>
                                    )}

                                    {tool.parametersSchema && (
                                        <div className="text-[8px] font-mono text-emerald-400 bg-emerald-950/20 px-2 py-1 rounded border border-emerald-900/30 mb-3 flex items-center justify-between">
                                            <span>Contrato de Parâmetros</span>
                                            <span>✓ Tipado</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2 pt-2 border-t border-zinc-800/60">
                                    <button onClick={() => { setApiEndpoint(tool.endpoint); setApiMethod(tool.method); setApiHeaders(tool.headers); setApiBody(tool.body || ''); setSelectedKeyId(tool.authKeyName || 'none'); setActiveSubTab('connector'); }} className="flex-grow py-2 bg-purple-600 hover:bg-purple-500 text-white font-black text-[10px] rounded-lg transition-all uppercase tracking-widest">Acessar Forja</button>
                                    <button onClick={() => onDeployProbe?.(tool)} className="p-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg" title="Lançar Sonda Recon">🛰️</button>
                                    <button onClick={() => setCustomTools(prev => prev.filter(t => t.id !== tool.id))} className="p-2 text-zinc-500 hover:text-red-400 transition-colors">🗑️</button>
                                </div>
                            </div>
                        ))}
                        {customTools.length === 0 && (
                            <div className="col-span-full py-20 text-center text-zinc-600 italic border border-dashed border-zinc-800 rounded-2xl opacity-70 flex flex-col items-center justify-center gap-3">
                                <span className="text-3xl">🛡️</span>
                                <div>Nenhuma ferramenta customizada forjada ainda.</div>
                                <button 
                                    onClick={() => setActiveSubTab('factory')}
                                    className="px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 text-xs font-bold rounded-lg border border-indigo-500/30 transition-all uppercase"
                                >
                                    Abrir Fábrica de Ferramentas ✨
                                </button>
                            </div>
                        )}
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
