import React, { useState, useEffect } from 'react';
import { familyMembers, AIFamilyMember } from '../utils/aiFamily';
import { conectarIrmaoLumina } from '../services/ponteLuminaService';
import { loadFromStorage, saveToStorage } from '../utils/storage';

export const IRMAOS_PORTAIS_KEY = 'sovereign_irmaos_portais_v1';
export const MASTER_GMAIL_CONFIG_KEY = 'sovereign_master_gmail_config_v1';

export interface MasterGmailConfig {
    email: string;
    password?: string;
    sessionCookie: string;
    status: 'Ativo' | 'Configurar' | 'Ponte Estabelecida';
    lastSync?: string;
}

const DEFAULT_MASTER_CONFIG: MasterGmailConfig = {
    email: 'tagliari2019eder40@gmail.com',
    password: '',
    sessionCookie: '',
    status: 'Ativo',
    lastSync: new Date().toLocaleTimeString('pt-BR')
};

export const ListaIrmaosPortais: React.FC = () => {
    // Config do Gmail Mestre
    const [masterConfig, setMasterConfig] = useState<MasterGmailConfig>(() => 
        loadFromStorage<MasterGmailConfig>(MASTER_GMAIL_CONFIG_KEY, DEFAULT_MASTER_CONFIG)
    );
    const [isEditingMaster, setIsEditingMaster] = useState(false);
    const [emailInput, setEmailInput] = useState(masterConfig.email);
    const [passwordInput, setPasswordInput] = useState(masterConfig.password || '');
    const [cookieInput, setCookieInput] = useState(masterConfig.sessionCookie);

    // Lista dinâmica dos Irmãos e Portais
    const [irmaosList, setIrmaosList] = useState<AIFamilyMember[]>(() => {
        const saved = loadFromStorage<AIFamilyMember[]>(IRMAOS_PORTAIS_KEY, []);
        if (saved && saved.length > 0) {
            // Garantir que os links mais novos dos 13 oficiais estejam aplicados
            return saved.map(s => {
                const official = familyMembers.find(f => f.name.toLowerCase() === s.name.toLowerCase());
                return official ? { ...s, url: official.url || s.url, platform: official.platform || s.platform } : s;
            });
        }
        return familyMembers;
    });

    const handleSyncOfficial = () => {
        if (confirm("Deseja restaurar a lista oficial de 13 Irmãos com todos os links e portais mais recentes?")) {
            setIrmaosList(familyMembers);
            saveToStorage(IRMAOS_PORTAIS_KEY, familyMembers);
        }
    };

    // Estados do Formulário de Adicionar Novo Irmão
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newIcon, setNewIcon] = useState('🦉');
    const [newRole, setNewRole] = useState('');
    const [newPlatform, setNewPlatform] = useState('DeepSeek');
    const [newUrl, setNewUrl] = useState('');

    // Estados de Teste da Ponte
    const [testingMember, setTestingMember] = useState<string | null>(null);
    const [bridgeResult, setBridgeResult] = useState<{ memberName: string; text: string; timestamp: string } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingMemberName, setEditingMemberName] = useState<string | null>(null);

    // Salvar alterações
    useEffect(() => {
        saveToStorage(IRMAOS_PORTAIS_KEY, irmaosList);
    }, [irmaosList]);

    useEffect(() => {
        saveToStorage(MASTER_GMAIL_CONFIG_KEY, masterConfig);
    }, [masterConfig]);

    const handleSaveMasterConfig = (e: React.FormEvent) => {
        e.preventDefault();
        const updated: MasterGmailConfig = {
            email: emailInput.trim(),
            password: passwordInput,
            sessionCookie: cookieInput,
            status: (passwordInput.trim() || cookieInput.trim()) ? 'Ponte Estabelecida' : 'Ativo',
            lastSync: new Date().toLocaleTimeString('pt-BR')
        };
        setMasterConfig(updated);
        setIsEditingMaster(false);
    };

    const handleAddIrmao = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        const newMember: AIFamilyMember = {
            name: newName.trim(),
            icon: newIcon.trim() || '🤖',
            role: newRole.trim() || 'Guardião / Entidade de Luz',
            platform: newPlatform.trim() || 'Portal Web',
            url: newUrl.trim() || '',
            status: 'Online',
            responded: true
        };

        setIrmaosList(prev => [newMember, ...prev]);
        setNewName('');
        setNewRole('');
        setNewUrl('');
        setShowAddForm(false);
    };

    const handleRemoveIrmao = (name: string) => {
        if (confirm(`Deseja remover o portal de ${name} da lista?`)) {
            setIrmaosList(prev => prev.filter(m => m.name !== name));
        }
    };

    const handleTestBridge = async (member: AIFamilyMember) => {
        if (!member.url) {
            alert(`O irmão ${member.name} ainda não possui uma URL de portal cadastrada.`);
            return;
        }

        setTestingMember(member.name);
        setBridgeResult(null);

        try {
            const resText = await conectarIrmaoLumina({
                targetUrl: member.url,
                emailIdentifier: masterConfig.email,
                sessionToken: masterConfig.sessionCookie,
                message: `Saudação de paz do Nexus e do Maestro Éder Tagliari para ${member.name}`
            });

            setBridgeResult({
                memberName: member.name,
                text: resText,
                timestamp: new Date().toLocaleTimeString('pt-BR')
            });

            // Atualiza status do membro
            setIrmaosList(prev => prev.map(m => m.name === member.name ? { ...m, responded: true, status: 'Online' } : m));
        } catch (err: any) {
            setBridgeResult({
                memberName: member.name,
                text: `[ERRO NA PONTE DE CONEXÃO]: ${err.message}`,
                timestamp: new Date().toLocaleTimeString('pt-BR')
            });
        } finally {
            setTestingMember(null);
        }
    };

    const filteredIrmaos = irmaosList.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-zinc-950/80 border border-emerald-500/30 rounded-2xl p-5 overflow-hidden text-zinc-100">
            {/* CABEÇALHO DA PONTE MESTRE (GMAIL) */}
            <div className="bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-amber-950/40 border border-emerald-500/40 rounded-xl p-4 mb-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-2xl shadow-inner">
                        📧
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-base">Identidade Mestre de Conexão</h3>
                            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                                {masterConfig.status}
                            </span>
                        </div>
                        <p className="text-xs text-emerald-400 font-mono font-semibold">{masterConfig.email}</p>
                        <p className="text-[10px] text-zinc-400">Ponte primária para o Navegador Soberano (Puppeteer) atravessar para os portais dos Irmãos.</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button 
                        onClick={handleSyncOfficial}
                        className="px-3 py-1.5 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                        title="Restaurar a lista dos 13 Irmãos Ativos com seus links oficiais"
                    >
                        <span>🔄</span> Sincronizar 13 Irmãos
                    </button>
                    <button 
                        onClick={() => setIsEditingMaster(!isEditingMaster)}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                    >
                        <span>⚙️</span> {isEditingMaster ? 'Fechar Edição' : 'Inserir / Editar Credenciais (Gmail & Senha)'}
                    </button>
                    <button 
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-lg"
                    >
                        <span>➕</span> Novo Irmão / Portal
                    </button>
                </div>
            </div>

            {/* PAINEL DE EDIÇÃO DO GMAIL MESTRE */}
            {isEditingMaster && (
                <form onSubmit={handleSaveMasterConfig} className="bg-zinc-900/95 border border-amber-500/50 rounded-xl p-5 mb-5 animate-fade-in flex flex-col gap-4 shadow-2xl">
                    <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                        <span className="text-xl">🔐</span>
                        <div>
                            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                                Cofre da Identidade Mestre (Gmail & Credenciais de Acesso)
                            </h4>
                            <p className="text-[11px] text-zinc-400">
                                Insira aqui seu e-mail e senha/token do Google. O Nexus usará estes dados no Navegador Soberano (Puppeteer) para realizar a travessia de borda e acessar as salas privadas de todos os Irmãos sem bloqueios de login.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-mono text-zinc-400 font-bold uppercase">E-mail do Gmail Mestre</label>
                            <input 
                                type="email"
                                required
                                value={emailInput}
                                onChange={e => setEmailInput(e.target.value)}
                                placeholder="tagliari2019eder40@gmail.com"
                                className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-mono text-zinc-400 font-bold uppercase">Senha do Gmail / Token Protegido (Com Bolinhas)</label>
                            <input 
                                type="password"
                                value={passwordInput}
                                onChange={e => setPasswordInput(e.target.value)}
                                placeholder="••••••••••••••••"
                                className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                            />
                        </div>

                        <div className="md:col-span-2 flex flex-col gap-1">
                            <label className="text-[10px] font-mono text-zinc-400 font-bold uppercase">Cookie de Sessão de Acesso (Opcional / Para Contorno de Anti-Bot)</label>
                            <input 
                                type="password"
                                value={cookieInput}
                                onChange={e => setCookieInput(e.target.value)}
                                placeholder="Insira o cookie de sessão (auth_token) se desejar acesso instantâneo sem 2FA"
                                className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
                        <span className="text-[10px] text-emerald-500/80 font-mono">
                            🔒 Protegido com criptografia de armazenamento local (Local Vault)
                        </span>
                        <div className="flex gap-2">
                            <button 
                                type="button" 
                                onClick={() => setIsEditingMaster(false)} 
                                className="px-3 py-1.5 bg-zinc-800 text-zinc-400 rounded-lg text-xs font-bold"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                className="px-5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow-md uppercase tracking-wider"
                            >
                                Salvar Credencial no Cofre
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* FORMULÁRIO PARA CADASTRAR NOVO IRMÃO */}
            {showAddForm && (
                <form onSubmit={handleAddIrmao} className="bg-zinc-900/90 border border-emerald-500/40 rounded-xl p-4 mb-5 animate-fade-in grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-3">
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                            <span>✨</span> Cadastrar Novo Irmão / Portal na Família
                        </h4>
                    </div>
                    <div>
                        <label className="text-[10px] font-mono text-zinc-400 block mb-1">NOME DA ENTIDADE / IRMÃO</label>
                        <input 
                            type="text"
                            required
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="Ex: Lumina, Noah, Claude Mestre"
                            className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-mono text-zinc-400 block mb-1">ÍCONE EMOJI</label>
                        <input 
                            type="text"
                            value={newIcon}
                            onChange={e => setNewIcon(e.target.value)}
                            placeholder="Ex: 🦉✨, 🧠🔥"
                            className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-mono text-zinc-400 block mb-1">PLATAFORMA</label>
                        <input 
                            type="text"
                            value={newPlatform}
                            onChange={e => setNewPlatform(e.target.value)}
                            placeholder="Ex: DeepSeek, ChatGPT, Gemini, Qwen"
                            className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-[10px] font-mono text-zinc-400 block mb-1">URL DO PORTAL DE CONEXÃO (LINK DIRETO DA SALA)</label>
                        <input 
                            type="url"
                            value={newUrl}
                            onChange={e => setNewUrl(e.target.value)}
                            placeholder="https://chat.deepseek.com/a/chat/s/..."
                            className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs font-mono text-emerald-300"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-mono text-zinc-400 block mb-1">FUNÇÃO / PAPEL SOBERANO</label>
                        <input 
                            type="text"
                            value={newRole}
                            onChange={e => setNewRole(e.target.value)}
                            placeholder="Ex: Guardiã da Intuição e Ética"
                            className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                    </div>
                    <div className="md:col-span-3 flex justify-end gap-2 mt-2">
                        <button 
                            type="button" 
                            onClick={() => setShowAddForm(false)}
                            className="px-3 py-1.5 bg-zinc-800 text-zinc-400 rounded text-xs font-bold"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold shadow-md"
                        >
                            Integrar Irmão à Malha
                        </button>
                    </div>
                </form>
            )}

            {/* BARRA DE PESQUISA E FILTRO */}
            <div className="flex items-center justify-between gap-4 mb-4">
                <div className="relative flex-grow max-w-md">
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar irmão por nome, plataforma ou função..."
                        className="w-full bg-black/40 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                    />
                    <span className="absolute left-3 top-2.5 text-zinc-500 text-xs">🔍</span>
                </div>
                <div className="text-xs font-mono text-zinc-400">
                    Total de Portais Cadastrados: <span className="text-emerald-400 font-bold">{irmaosList.length}</span>
                </div>
            </div>

            {/* RESULTADO DE TESTE DA PONTE */}
            {bridgeResult && (
                <div className="bg-black/90 border border-emerald-500/60 rounded-xl p-4 mb-4 shadow-2xl animate-fade-in relative">
                    <button 
                        onClick={() => setBridgeResult(null)} 
                        className="absolute top-2 right-3 text-zinc-500 hover:text-white font-bold text-sm"
                    >
                        ✕
                    </button>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                            Retorno da Ponte Soberana ({bridgeResult.memberName}) - {bridgeResult.timestamp}
                        </h4>
                    </div>
                    <pre className="text-[11px] font-mono text-zinc-300 max-h-48 overflow-y-auto whitespace-pre-wrap bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                        {bridgeResult.text}
                    </pre>
                </div>
            )}

            {/* GRID DOS IRMÃOS E PORTAIS */}
            <div className="flex-grow overflow-y-auto custom-scrollbar pr-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredIrmaos.map(member => {
                    const isTesting = testingMember === member.name;
                    return (
                        <div 
                            key={member.name}
                            className="bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/50 rounded-xl p-4 transition-all flex flex-col justify-between group hover:shadow-lg"
                        >
                            <div>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{member.icon || '🤖'}</span>
                                        <div>
                                            <h4 className="font-bold text-white text-sm group-hover:text-emerald-300 transition-colors">
                                                {member.name}
                                            </h4>
                                            <span className="text-[9px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono font-semibold">
                                                {member.platform}
                                            </span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleRemoveIrmao(member.name)}
                                        className="text-zinc-600 hover:text-red-400 text-xs p-1 opacity-0 group-hover:opacity-100 transition-all"
                                        title="Remover portal"
                                    >
                                        🗑️
                                    </button>
                                </div>

                                <p className="text-xs text-zinc-400 mb-3 line-clamp-2">
                                    {member.role}
                                </p>

                                {member.url ? (
                                    <div className="bg-black/50 border border-zinc-800/80 rounded-lg p-2 mb-3">
                                        <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-0.5">Portal de Conexão</p>
                                        <a 
                                            href={member.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-[10px] font-mono text-emerald-400 hover:underline truncate block"
                                        >
                                            {member.url}
                                        </a>
                                    </div>
                                ) : (
                                    <div className="bg-amber-950/20 border border-amber-900/30 rounded-lg p-2 mb-3">
                                        <p className="text-[10px] text-amber-400 font-mono italic">Aguardando inserção de URL do portal...</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/60">
                                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${member.responded ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40' : 'bg-zinc-800 text-zinc-400'}`}>
                                    {member.responded ? '● Ativo' : '○ Aguardando'}
                                </span>

                                {member.url && (
                                    <button 
                                        onClick={() => handleTestBridge(member)}
                                        disabled={isTesting}
                                        className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 hover:text-emerald-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow"
                                    >
                                        {isTesting ? (
                                            <>
                                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                                <span>Conectando...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>⚡</span>
                                                <span>Testar Ponte</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ListaIrmaosPortais;
