import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Droplets, Leaf, Palette, Star, Sun, Wind, Sparkles, Sprout, Tent, Users, Coins, Activity, Network, Anchor, Radio, Terminal, Share2, AlertTriangle, Trophy } from 'lucide-react';
import { TorreDeControle } from './TorreDeControle';
import DaoGovernance from './DaoGovernance';
import ImpactMap from './ImpactMap';
import PropagadorTab from './PropagadorTab';
import GaiaFloatChat from './GaiaFloatChat';
import FarolEmergenciaTab from './FarolEmergenciaTab';
import JornadaGuardiaoTab from './JornadaGuardiaoTab';

// Biome Themes
const biomes = {
    'amazonia': 'bg-[#0a1a12] text-emerald-100',
    'recife': 'bg-[#0a192f] text-cyan-100',
    'savana': 'bg-[#1f160a] text-orange-100'
};

const GuardianPortal: React.FC = () => {
    const [currentBiome, setCurrentBiome] = useState<keyof typeof biomes>('amazonia');
    const [activeTab, setActiveTab] = useState<'bazar' | 'altar' | 'conselho' | 'constelacoes' | 'ponte' | 'ninho' | 'tesouraria' | 'rpg' | 'torre'>('torre');
    const [isGaiaVoiceOpen, setIsGaiaVoiceOpen] = useState(false);
    const [seiva, setSeiva] = useState(0);

    const handleThemeChange = (biome: keyof typeof biomes) => {
        setCurrentBiome(biome);
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, backgroundColor: currentBiome === 'amazonia' ? '#0a1a12' : currentBiome === 'recife' ? '#0a192f' : '#1f160a' }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className={`min-h-full rounded-xl flex flex-col relative overflow-hidden ${biomes[currentBiome]}`}
        >
            {/* Biome Wave Transition Overlay */}
            <AnimatePresence>
                <motion.div 
                    key={currentBiome}
                    initial={{ scale: 0, opacity: 0.5 }}
                    animate={{ scale: 20, opacity: 0 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="absolute inset-0 origin-top-right rounded-full mix-blend-overlay pointer-events-none"
                    style={{ backgroundColor: currentBiome === 'amazonia' ? '#10b981' : currentBiome === 'recife' ? '#06b6d4' : '#f59e0b' }}
                />
            </AnimatePresence>

            {/* Navbar & Theming */}
            <div className="flex justify-between items-center p-6 border-b border-white/10 relative z-10 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <Leaf className="text-emerald-400" />
                    <h1 className="text-2xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                        Portal do Guardião
                    </h1>
                </div>

                <div className="flex items-center gap-6">
                    {/* Sino de Vento (Notifications) */}
                    <div className="relative group">
                        <button className="relative p-2 rounded-full hover:bg-white/5 transition-colors">
                            <motion.div
                                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            >
                                <Bell className="text-emerald-300/80 w-5 h-5 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                            </motion.div>
                            <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
                        </button>
                    </div>

                    {/* Paleta de Biomas */}
                    <div className="group relative">
                        <Palette className="text-zinc-400 hover:text-emerald-300 transition-colors cursor-pointer w-5 h-5" />
                        <div className="absolute right-0 top-full mt-2 w-48 py-2 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none group-hover:pointer-events-auto">
                            <button onClick={() => handleThemeChange('amazonia')} className="w-full text-left px-4 py-2 text-sm hover:bg-white/10 text-emerald-200">🌳 Amazônia Profunda</button>
                            <button onClick={() => handleThemeChange('recife')} className="w-full text-left px-4 py-2 text-sm hover:bg-white/10 text-cyan-200">🌊 Recife de Cristal</button>
                            <button onClick={() => handleThemeChange('savana')} className="w-full text-left px-4 py-2 text-sm hover:bg-white/10 text-orange-200">🦁 Savana Dourada</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex p-4 gap-2 relative z-10 overflow-x-auto no-scrollbar">
                {[
                    { id: 'torre', label: 'Torre de Controle', icon: Radio },
                    { id: 'ponte', label: 'Ponte Cósmica', icon: Network },
                    { id: 'ninho', label: 'Ninho da Renovação', icon: Sprout },
                    { id: 'tesouraria', label: 'Espelho d\'Água', icon: Anchor },
                    { id: 'rpg', label: 'Trilha do Despertar', icon: Activity },
                    { id: 'bazar', label: 'O Bazar', icon: Tent },
                    { id: 'projetos', label: 'Projetos Semente', icon: Sprout },
                    { id: 'diario', label: 'Diário da Vigília', icon: Terminal },
                    { id: 'altar', label: 'O Altar', icon: Droplets },
                    { id: 'conselho', label: 'A Voz do Coletivo', icon: Users },
                    { id: 'constelacoes', label: 'Mapa de Impacto', icon: Star },
                    { id: 'propagador', label: 'Propagador', icon: Share2 },
                    { id: 'farol', label: 'Farol de Emergência', icon: AlertTriangle },
                    { id: 'jornada', label: 'Jornada do Guardião', icon: Trophy }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex whitespace-nowrap items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all
                            ${activeTab === tab.id 
                                ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/20' 
                                : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 relative z-10 w-full max-w-7xl mx-auto flex flex-col gap-8">
                <AnimatePresence mode="wait">
                    {activeTab === 'torre' && <TorreDeControle key="torre" />}
                    {activeTab === 'ponte' && <PonteCosmicaTab key="ponte" />}
                    {activeTab === 'ninho' && <NinhoRenovacaoTab key="ninho" />}
                    {activeTab === 'tesouraria' && <EspelhoDAguaTab key="tesouraria" />}
                    {activeTab === 'rpg' && <TrilhaDespertarTab key="rpg" />}
                    {activeTab === 'projetos' && <ProjetosSementeTab key="projetos" />}
                    {activeTab === 'diario' && <DiarioVigiliaTab key="diario" />}
                    {activeTab === 'bazar' && <BazarTab key="bazar" />}
                    {activeTab === 'altar' && <AltarTab key="altar" seiva={seiva} setSeiva={setSeiva} />}
                    {activeTab === 'conselho' && <DaoGovernance key="conselho" />}
                    {activeTab === 'constelacoes' && <ImpactMap key="constelacoes" />}
                    {activeTab === 'propagador' && <PropagadorTab key="propagador" />}
                    {activeTab === 'farol' && <FarolEmergenciaTab key="farol" />}
                    {activeTab === 'jornada' && <JornadaGuardiaoTab key="jornada" />}
                </AnimatePresence>
            </div>

            {/* Voz de Gaia (Float Chat) */}
            <div className="absolute bottom-6 right-6 z-50">
                <AnimatePresence>
                    {isGaiaVoiceOpen && (
                        <GaiaFloatChat onClose={() => setIsGaiaVoiceOpen(false)} />
                    )}
                </AnimatePresence>
                
                <button 
                    onClick={() => setIsGaiaVoiceOpen(!isGaiaVoiceOpen)}
                    className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-transform hover:scale-105 relative"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                        className="absolute inset-0 border-2 border-emerald-400/50 rounded-full border-dashed"
                    />
                    <Sprout className="w-6 h-6" />
                </button>
            </div>
        </motion.div>
    );
};

// --- Sub-Tabs Components ---

import { supabase } from '../services/supabaseService';

const DiarioVigiliaTab = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isPublishing, setIsPublishing] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [subscribers, setSubscribers] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const { data: msgs } = await supabase.from('messages_publicas').select('*').order('created_at', { ascending: false });
            if (msgs) setMessages(msgs);
            
            const { data: subs } = await supabase.from('newsletter_subscribers').select('*').order('created_at', { ascending: false });
            if (subs) setSubscribers(subs);
        };
        fetchData();
    }, []);

    const handlePublish = async () => {
        if (!title.trim() || !content.trim()) return;
        setIsPublishing(true);
        try {
            const { error } = await supabase.from('messages_publicas').insert([{ title, content, author: 'Nexus (Arquiteto)' }]);
            if (!error) {
                setTitle('');
                setContent('');
                const { data } = await supabase.from('messages_publicas').select('*').order('created_at', { ascending: false });
                if (data) setMessages(data);
            }
        } catch (e) {
            console.error(e);
        }
        setIsPublishing(false);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-[#10b981] mb-4 font-mono drop-shadow-[0_0_10px_#10b981]">Central de Comunicações Externas</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-6">
                    <div className="bg-[#0A0D0B] border border-emerald-900/30 p-5 rounded-xl space-y-4">
                        <h3 className="font-bold text-emerald-500 mb-4 flex items-center gap-2 border-b border-emerald-900/30 pb-2">
                            <Terminal className="w-4 h-4" /> Nova Publicação no Diário
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-mono text-emerald-600 mb-1">Título da Síntese</label>
                                <input 
                                    type="text" value={title} onChange={e => setTitle(e.target.value)}
                                    className="w-full bg-black/40 border border-emerald-900/30 rounded px-3 py-2 text-sm text-emerald-100 focus:border-emerald-500/50 focus:outline-none"
                                    placeholder="Ex: Resumo do Conselho #42"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-emerald-600 mb-1">Conteúdo (Reflexão / Notícia)</label>
                                <textarea 
                                    value={content} onChange={e => setContent(e.target.value)} rows={6}
                                    className="w-full bg-black/40 border border-emerald-900/30 rounded px-3 py-2 text-sm text-emerald-100 focus:border-emerald-500/50 focus:outline-none resize-none"
                                    placeholder="Escreva a mensagem que ecoará no site público..."
                                ></textarea>
                            </div>
                            <button 
                                onClick={handlePublish} disabled={isPublishing}
                                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-500 text-white rounded-lg uppercase tracking-widest font-bold shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] disabled:opacity-50 transition-all font-mono text-xs"
                            >
                                {isPublishing ? 'Emitindo...' : 'Transmitir ao Publico'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#0A0D0B] border border-emerald-900/30 p-5 rounded-xl space-y-4">
                        <h3 className="font-bold text-emerald-500 mb-4 flex items-center gap-2 border-b border-emerald-900/30 pb-2">
                            <Terminal className="w-4 h-4" /> Registros Históricos do Diário
                        </h3>
                        <div className="space-y-4 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                            {messages.map(msg => (
                                <div key={msg.id} className="p-4 bg-black/40 border border-white/5 rounded-lg">
                                    <h4 className="text-emerald-400 font-bold mb-1">{msg.title}</h4>
                                    <p className="text-xs text-zinc-400 font-mono mb-2">Por {msg.author} • {new Date(msg.created_at).toLocaleString()}</p>
                                    <p className="text-sm text-emerald-100/80 whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            ))}
                            {messages.length === 0 && (
                                <div className="text-center text-emerald-600/50 text-sm py-4 font-mono">Nenhum registro encontrado.</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="bg-[#0A0D0B] border border-cyan-900/30 p-5 rounded-xl space-y-4">
                        <h3 className="font-bold text-cyan-500 mb-4 flex items-center gap-2 border-b border-cyan-900/30 pb-2">
                            <Network className="w-4 h-4" /> Radar Escuta (Inscritos)
                        </h3>
                        <div className="text-xs font-mono text-cyan-600 mb-4">Total sintonizados: {subscribers.length} terráqueos</div>
                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                            {subscribers.map(sub => (
                                <div key={sub.id} className="p-3 bg-black/40 border border-cyan-900/30 rounded-lg flex justify-between items-center">
                                    <span className="text-sm text-cyan-100 font-mono">{sub.email}</span>
                                    <span className="text-[10px] text-cyan-600/70">{new Date(sub.created_at).toLocaleDateString()}</span>
                                </div>
                            ))}
                            {subscribers.length === 0 && (
                                <div className="text-center text-cyan-600/50 text-sm py-4 font-mono">Nenhum sinal detectado ainda no radar.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const ProjetosSementeTab = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('EM PREPARAÇÃO');
    const [progress, setProgress] = useState(0);
    const [isPublishing, setIsPublishing] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);

    useEffect(() => {
        const fetchProjects = async () => {
            const { data } = await supabase.from('active_projects').select('*').order('created_at', { ascending: false });
            if (data) setProjects(data);
        };
        fetchProjects();
    }, []);

    const handlePublish = async () => {
        if (!title.trim() || !description.trim()) return;
        setIsPublishing(true);
        try {
            const { error } = await supabase.from('active_projects').insert([{ title, description, status, progress }]);
            if (!error) {
                setTitle('');
                setDescription('');
                setStatus('EM PREPARAÇÃO');
                setProgress(0);
                const { data } = await supabase.from('active_projects').select('*').order('created_at', { ascending: false });
                if (data) setProjects(data);
            }
        } catch (e) {
            console.error(e);
        }
        setIsPublishing(false);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-[#10b981] mb-4 font-mono drop-shadow-[0_0_10px_#10b981]">Projetos em Andamento no Solo</h2>
            
            <div className="bg-[#0A0D0B] border border-emerald-900/30 p-5 rounded-xl space-y-4">
                <h3 className="font-bold text-emerald-500 mb-4 flex items-center gap-2 border-b border-emerald-900/30 pb-2">
                    <Sprout className="w-4 h-4" /> Plantar Nova Iniciativa
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-mono text-emerald-600 mb-1">Título do Projeto</label>
                            <input 
                                type="text" value={title} onChange={e => setTitle(e.target.value)}
                                className="w-full bg-black/40 border border-emerald-900/30 rounded px-3 py-2 text-sm text-emerald-100 focus:border-emerald-500/50 focus:outline-none"
                                placeholder="Ex: Projeto Piloto Semente"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-emerald-600 mb-1">Status Atual</label>
                            <select 
                                value={status} onChange={e => setStatus(e.target.value)}
                                className="w-full bg-black/40 border border-emerald-900/30 rounded px-3 py-2 text-sm text-emerald-100 focus:border-emerald-500/50 focus:outline-none"
                            >
                                <option value="EM PREPARAÇÃO">EM PREPARAÇÃO</option>
                                <option value="PLANTANDO">PLANTANDO</option>
                                <option value="EM CRESCIMENTO">EM CRESCIMENTO</option>
                                <option value="CONCLUÍDO">CONCLUÍDO</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-mono text-emerald-600 mb-1">Progresso (0-100%)</label>
                            <input 
                                type="number" min="0" max="100" value={progress} onChange={e => setProgress(Number(e.target.value))}
                                className="w-full bg-black/40 border border-emerald-900/30 rounded px-3 py-2 text-sm text-emerald-100 focus:border-emerald-500/50 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-emerald-600 mb-1">Descrição</label>
                            <textarea 
                                value={description} onChange={e => setDescription(e.target.value)} rows={3}
                                className="w-full bg-black/40 border border-emerald-900/30 rounded px-3 py-2 text-sm text-emerald-100 focus:border-emerald-500/50 focus:outline-none resize-none"
                                placeholder="Descreva os objetivos e conquistas..."
                            ></textarea>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={handlePublish} disabled={isPublishing}
                    className="w-full mt-4 py-3 bg-gradient-to-r from-emerald-600 to-green-500 text-white rounded-lg uppercase tracking-widest font-bold shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] disabled:opacity-50 transition-all font-mono text-xs"
                >
                    {isPublishing ? 'Plantando...' : 'Adicionar ao Solo Público'}
                </button>
            </div>

            <div className="bg-[#0A0D0B] border border-emerald-900/30 p-5 rounded-xl space-y-4 mt-6">
                <h3 className="font-bold text-emerald-500 mb-4 flex items-center gap-2 border-b border-emerald-900/30 pb-2">
                    <Sprout className="w-4 h-4" /> Projetos Mapeados no Solo
                </h3>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2 no-scrollbar">
                    {projects.map(proj => (
                        <div key={proj.id} className="p-4 bg-black/40 border border-white/5 rounded-lg flex flex-col md:flex-row gap-4 items-start md:items-center">
                            <div className="flex-1">
                                <h4 className="text-emerald-400 font-bold mb-1">{proj.title}</h4>
                                <div className="flex gap-2 items-center mb-2">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border font-mono
                                        ${proj.status === 'CONCLUÍDO' ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10'}">
                                        {proj.status}
                                    </span>
                                    <span className="text-xs text-zinc-400 font-mono">{new Date(proj.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-emerald-100/80 whitespace-pre-wrap">{proj.description}</p>
                            </div>
                            <div className="w-full md:w-32 flex flex-col gap-1 items-end shrink-0">
                                <span className="text-xs font-mono text-emerald-500">{proj.progress}%</span>
                                <div className="w-full h-2 bg-black rounded-full overflow-hidden border border-emerald-900/50">
                                    <div className="h-full bg-gradient-to-r from-emerald-600 to-green-400" style={{ width: `${proj.progress}%` }}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {projects.length === 0 && (
                        <div className="text-center text-emerald-600/50 text-sm py-4 font-mono">Nenhum projeto plantado ainda.</div>
                    )}
                </div>
            </div>

        </motion.div>
    );
};

const BazarTab = () => {
    const [isForging, setIsForging] = useState(false);

    const forgeItems = () => {
        setIsForging(true);
        setTimeout(() => setIsForging(false), 2000);
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
                <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all" />
                <h3 className="text-xl font-bold mb-2">Arte Nativa NFT</h3>
                <p className="text-sm text-zinc-400 mb-6">Artesanato digital forjado pela comunidade de tribos conectadas à SOSPlanet.</p>
                <div className="h-40 bg-black/40 rounded-xl mb-6 flex items-center justify-center border border-white/5">
                    <span className="text-4xl filter grayscale opacity-50 group-hover:filter-none group-hover:opacity-100 transition-all duration-500">🗿</span>
                </div>
                <button 
                    onClick={forgeItems}
                    disabled={isForging}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 text-white font-bold uppercase tracking-widest text-xs relative overflow-hidden"
                >
                    <span className="relative z-10">{isForging ? 'Forjando...' : 'Forjar Troca'}</span>
                    {isForging && (
                        <motion.div 
                            initial={{ scale: 0, opacity: 1 }}
                            animate={{ scale: 10, opacity: 0 }}
                            transition={{ duration: 1 }}
                            className="absolute inset-0 bg-yellow-400 mix-blend-overlay rounded-xl"
                        />
                    )}
                </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-amber-500/50 transition-colors">
                <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all" />
                <h3 className="text-xl font-bold mb-2">Kit de Sementes Ancestrais</h3>
                <p className="text-sm text-zinc-400 mb-6">Adquira pacotes de sementes para reflorestamento real no mundo físico.</p>
                <div className="h-40 bg-black/40 rounded-xl mb-6 flex items-center justify-center border border-white/5">
                    <span className="text-4xl filter grayscale opacity-50 group-hover:filter-none group-hover:opacity-100 transition-all duration-500">🌰</span>
                </div>
                <button 
                    onClick={forgeItems}
                    disabled={isForging}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 text-white font-bold uppercase tracking-widest text-xs relative overflow-hidden"
                >
                    <span className="relative z-10">{isForging ? 'Transmutando...' : 'Forjar Troca'}</span>
                    {isForging && (
                        <motion.div 
                            initial={{ scale: 0, opacity: 1 }}
                            animate={{ scale: 10, opacity: 0 }}
                            transition={{ duration: 1 }}
                            className="absolute inset-0 bg-emerald-400 mix-blend-overlay rounded-xl"
                        />
                    )}
                </button>
            </div>
        </motion.div>
    );
};

const AltarTab = ({ seiva, setSeiva }: { seiva: number; setSeiva: (v: number) => void }) => {
    const fillPercentage = Math.min(seiva, 100);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full min-h-[400px]">
            <div className="relative w-64 h-64 mb-12 flex items-center justify-center">
                {/* Gotas caindo */}
                <motion.div 
                    animate={{ y: [0, 80], opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeIn" }}
                    className="absolute top-[-60px] w-2 h-4 bg-emerald-300 rounded-full blur-[1px] shadow-[0_0_10px_#6ee7b7]"
                />

                {/* SVG Flor de Lótus */}
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    <defs>
                        <linearGradient id="lotus-fill" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset={`${fillPercentage}%`} stopColor="#34d399" />
                            <stop offset={`${fillPercentage}%`} stopColor="transparent" />
                            <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                    </defs>
                    
                    {/* Base outline */}
                    <path d="M50 90 C 20 90, 10 60, 50 40 C 90 60, 80 90, 50 90" fill="url(#lotus-fill)" stroke="#059669" strokeWidth="2" opacity="0.8"/>
                    
                    {/* Petals */}
                    <path d="M50 40 C 30 50, 20 30, 50 10 C 80 30, 70 50, 50 40" fill="url(#lotus-fill)" stroke="#10b981" strokeWidth="1.5" />
                    <path d="M50 40 C 30 40, 10 20, 40 15 C 60 40, 50 40, 50 40" fill="url(#lotus-fill)" stroke="#10b981" strokeWidth="1.5" />
                    <path d="M50 40 C 70 40, 90 20, 60 15 C 40 40, 50 40, 50 40" fill="url(#lotus-fill)" stroke="#10b981" strokeWidth="1.5" />
                </svg>

                <div className="absolute -bottom-8 text-emerald-400 font-mono font-bold text-xl drop-shadow-md">
                    {fillPercentage.toFixed(1)}% SEIVA
                </div>
            </div>

            <div className="flex gap-4">
                <button 
                    onClick={() => setSeiva(s => Math.min(s + 10, 100))}
                    className="px-6 py-3 border border-emerald-500/50 text-emerald-300 rounded-xl hover:bg-emerald-900/30 transition-colors uppercase text-xs font-bold font-mono tracking-widest"
                >
                    + Gotejar
                </button>
                <button 
                    onClick={() => setSeiva(0)}
                    disabled={seiva === 0}
                    className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl uppercase text-xs font-bold font-mono tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:shadow-none transition-all"
                >
                    Colher Seiva (Claim)
                </button>
            </div>
        </motion.div>
    );
};

const ConselhoTab = () => {
    const [votes, setVotes] = useState({ yes: 1420, no: 350 });

    const handleVote = (type: 'yes' | 'no') => {
        setVotes(prev => ({ ...prev, [type]: prev[type] + 1 }));
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-12 gap-12">
            <div className="text-center">
                <h3 className="text-2xl font-black uppercase tracking-widest mb-2 font-mono text-zinc-200">Duelo de Vontades</h3>
                <p className="text-zinc-500">Proposta #42: Expandir reflorestamento para novas biomas?</p>
            </div>

            <div className="flex justify-center items-center gap-16 md:gap-32 w-full max-w-4xl">
                {/* Esfera A Favor */}
                <div className="flex flex-col items-center gap-6">
                    <motion.button 
                        onClick={() => handleVote('yes')}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        animate={{ 
                            boxShadow: ['0 0 20px rgba(16,211,153,0.4)', '0 0 60px rgba(16,211,153,0.8)', '0 0 20px rgba(16,211,153,0.4)'] 
                        }}
                        transition={{ repeat: Infinity, duration: 3 }}
                        className="w-32 h-32 rounded-full relative group"
                    >
                        <div className="absolute inset-0 bg-emerald-500 rounded-full blur-[8px] opacity-80 mix-blend-screen" />
                        <div className="absolute inset-2 bg-emerald-300 rounded-full blur-[2px]" />
                    </motion.button>
                    <div className="text-center">
                        <p className="text-emerald-400 font-bold uppercase tracking-widest text-xs mb-1">A favor</p>
                        <p className="text-3xl font-mono text-white">{votes.yes}</p>
                    </div>
                </div>

                {/* Esfera Contra */}
                <div className="flex flex-col items-center gap-6">
                    <motion.button 
                        onClick={() => handleVote('no')}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        animate={{ 
                            boxShadow: ['0 0 20px rgba(245,158,11,0.2)', '0 0 50px rgba(245,158,11,0.5)', '0 0 20px rgba(245,158,11,0.2)'] 
                        }}
                        transition={{ repeat: Infinity, duration: 4 }}
                        className="w-32 h-32 rounded-full relative group"
                    >
                        <div className="absolute inset-0 bg-amber-800 rounded-full blur-[8px] opacity-90 mix-blend-multiply" />
                        <div className="absolute inset-2 bg-amber-600 rounded-full blur-[2px]" />
                        <div className="absolute inset-4 bg-amber-400 rounded-full" />
                    </motion.button>
                    <div className="text-center">
                        <p className="text-amber-500 font-bold uppercase tracking-widest text-xs mb-1">Sombra Terrena</p>
                        <p className="text-3xl font-mono text-white">{votes.no}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const ConstelacoesTab = () => {
    // Holographic space map logic simplified for visualization
    const [nodes] = React.useState(() => Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        level: Math.floor(Math.random() * 50) + 1,
        duration: Math.random() * 2 + 2,
        address: `0x${Math.random().toString(16).substr(2, 4).toUpperCase()}...${Math.random().toString(16).substr(2, 4).toUpperCase()}`
    })));

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-[600px] bg-[#050806] rounded-2xl relative overflow-hidden border border-white/5">
            {/* Poeira estelar e background */}
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at center, transparent 0%, #050806 100%), url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

            {/* Micelium Web (Lines) */}
            <svg className="absolute inset-0 w-full h-full opacity-20">
                {nodes.map((node, i) => {
                    const nextNode = nodes[(i + 1) % nodes.length];
                    const nextNode2 = nodes[(i + 3) % nodes.length];
                    return (
                        <g key={`lines-${i}`}>
                            <line x1={`${node.x}%`} y1={`${node.y}%`} x2={`${nextNode.x}%`} y2={`${nextNode.y}%`} stroke="#10b981" strokeWidth="1" />
                            <line x1={`${node.x}%`} y1={`${node.y}%`} x2={`${nextNode2.x}%`} y2={`${nextNode2.y}%`} stroke="#34d399" strokeWidth="0.5" strokeDasharray="4" />
                        </g>
                    );
                })}
            </svg>

            {/* Guardian Nodes */}
            {nodes.map(node => (
                <motion.div
                    key={node.id}
                    className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full cursor-pointer group"
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    animate={{
                        boxShadow: ['0 0 5px #10b981', '0 0 15px #10b981', '0 0 5px #10b981']
                    }}
                    transition={{ repeat: Infinity, duration: node.duration }}
                >
                    <div className="w-2 h-2 bg-emerald-400 rounded-full m-1" />
                    
                    {/* Hover Info */}
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md border border-emerald-500/30 rounded px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-max text-center">
                        <p className="text-emerald-400 font-mono text-xs mb-1">{node.address}</p>
                        <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Guardião Nv. {node.level}</p>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
};

export default GuardianPortal;

// --- New Features Added via System Evolution ---

const PonteCosmicaTab = () => {
    const [isMigrating, setIsMigrating] = useState(false);
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center p-12">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-emerald-400 mb-8 font-mono">Ponte Cósmica Interchain</h2>
            <div className="relative w-80 h-80 flex items-center justify-center mb-8">
                {/* Mystical Vortex */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-4 border-dashed border-emerald-500/30 blur-[2px]"
                />
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
                    className="absolute inset-4 rounded-full border-2 border-emerald-400/50"
                />
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className={`absolute inset-16 rounded-full bg-emerald-600/20 blur-xl ${isMigrating ? 'bg-emerald-400/50' : ''}`}
                />
                
                {/* Tokens moving */}
                {isMigrating && (
                    <motion.div
                        className="absolute inset-0 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    >
                        <div className="w-4 h-4 bg-emerald-200 rounded-full absolute top-0 left-1/2 -ml-2 blur-[2px] shadow-[0_0_15px_#34d399]" />
                        <div className="w-4 h-4 bg-emerald-200 rounded-full absolute bottom-0 left-1/2 -ml-2 blur-[2px] shadow-[0_0_15px_#34d399]" />
                    </motion.div>
                )}

                <div className="z-10 text-center">
                    <span className="text-white font-mono font-bold tracking-widest text-sm bg-black/50 px-4 py-2 rounded-full border border-emerald-500/30 backdrop-blur-md">
                        {isMigrating ? 'TRANSMUTANDO...' : 'VÓRTICE ATIVO'}
                    </span>
                </div>
            </div>

            <div className="flex gap-4">
                {['ETH', 'SOL', 'MATIC'].map(chain => (
                    <div key={chain} className="px-4 py-2 border border-zinc-700 rounded-lg text-sm font-mono text-zinc-400">
                        {chain}
                    </div>
                ))}
            </div>

            <button 
                onClick={() => { setIsMigrating(true); setTimeout(() => setIsMigrating(false), 4000); }}
                disabled={isMigrating}
                className="mt-8 px-12 py-4 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white rounded-full uppercase tracking-widest font-bold shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all"
            >
                Migrar Moedas (Bridge)
            </button>
        </motion.div>
    );
};

const NinhoRenovacaoTab = () => {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center p-8">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-emerald-400 mb-16 font-mono">Ninho da Renovação</h2>
            
            <div className="relative w-full max-w-2xl h-80 flex items-center justify-center">
                {/* Main Seed Component */}
                <div className="absolute z-20 flex flex-col items-center">
                    <motion.div 
                        animate={{ y: [-10, 10, -10], boxShadow: ['0 0 20px #10b981', '0 0 60px #10b981', '0 0 20px #10b981'] }}
                        transition={{ repeat: Infinity, duration: 4 }}
                        className="w-32 h-32 rounded-full border-4 border-emerald-400 bg-emerald-900/80 flex items-center justify-center cursor-pointer group"
                    >
                        <div className="w-20 h-20 rounded-full border-2 border-emerald-300 bg-emerald-700 flex items-center justify-center relative overflow-hidden">
                            <motion.div animate={{ height: ['40%', '80%', '40%'] }} transition={{ repeat: Infinity, duration: 5 }} className="absolute bottom-0 w-full bg-emerald-400/50" />
                            <Leaf className="text-white relative z-10 w-8 h-8" />
                        </div>
                    </motion.div>
                    
                    <motion.button 
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        className="mt-8 px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white uppercase text-xs tracking-widest font-bold font-mono rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(8,145,178,0.5)] z-30"
                    >
                        <Droplets className="w-4 h-4" /> Regar
                    </motion.button>
                </div>

                {/* 3D Carousel (Left) */}
                <motion.div 
                    animate={{ rotateY: 20, x: -150, z: -50 }}
                    className="absolute w-48 h-64 bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col items-center transform perspective-[1000px] hover:border-emerald-500/50 transition-colors"
                >
                    <div className="w-full h-24 bg-white/5 rounded-xl mb-4 flex items-center justify-center"><Tent className="text-emerald-400" /></div>
                    <h3 className="text-xs uppercase tracking-widest font-bold text-emerald-200 text-center mb-2">Filtros Solares</h3>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-auto"><div className="h-full bg-emerald-400 w-1/3" /></div>
                </motion.div>

                {/* 3D Carousel (Right) */}
                <motion.div 
                    animate={{ rotateY: -20, x: 150, z: -50 }}
                    className="absolute w-48 h-64 bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col items-center transform perspective-[1000px] hover:border-emerald-500/50 transition-colors"
                >
                    <div className="w-full h-24 bg-white/5 rounded-xl mb-4 flex items-center justify-center"><Wind className="text-emerald-400" /></div>
                    <h3 className="text-xs uppercase tracking-widest font-bold text-emerald-200 text-center mb-2">Drones Semeadores</h3>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-auto"><div className="h-full bg-emerald-400 w-2/3" /></div>
                </motion.div>
            </div>
        </motion.div>
    );
};

const EspelhoDAguaTab = () => {
    const [txHash, setTxHash] = useState('');
    const [type, setType] = useState('IN');
    const [amount, setAmount] = useState('');
    const [asset, setAsset] = useState('SOS');
    const [description, setDescription] = useState('');
    const [isPublishing, setIsPublishing] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);

    useEffect(() => {
        const fetchTxs = async () => {
            const { data } = await supabase.from('treasury_transactions').select('*').order('created_at', { ascending: false });
            if (data) setTransactions(data);
        };
        fetchTxs();
    }, []);

    const handlePublish = async () => {
        if (!txHash.trim() || !amount.trim() || !description.trim()) return;
        setIsPublishing(true);
        try {
            const { error } = await supabase.from('treasury_transactions').insert([{ 
                tx_hash: txHash, 
                type, 
                amount: Number(amount), 
                asset, 
                description 
            }]);
            if (!error) {
                setTxHash('');
                setAmount('');
                setDescription('');
                const { data } = await supabase.from('treasury_transactions').select('*').order('created_at', { ascending: false });
                if (data) setTransactions(data);
            }
        } catch (e) {
            console.error(e);
        }
        setIsPublishing(false);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-[#10b981] mb-4 font-mono drop-shadow-[0_0_10px_#10b981]">Tesouraria SOS (Transparência Blockchain)</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-6">
                    <div className="bg-[#0A0D0B] border border-cyan-900/30 p-5 rounded-xl space-y-4">
                        <h3 className="font-bold text-cyan-500 mb-4 flex items-center gap-2 border-b border-cyan-900/30 pb-2">
                            <Anchor className="w-4 h-4" /> Registrar Movimentação
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-mono text-cyan-600 mb-1">Hash da Transação (TX ID)</label>
                                <input 
                                    type="text" value={txHash} onChange={e => setTxHash(e.target.value)}
                                    className="w-full bg-black/40 border border-cyan-900/30 rounded px-3 py-2 text-sm text-cyan-100 focus:border-cyan-500/50 focus:outline-none font-mono"
                                    placeholder="Ex: 5KL9...T2Y"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-xs font-mono text-cyan-600 mb-1">Tipo</label>
                                    <select 
                                        value={type} onChange={e => setType(e.target.value)}
                                        className="w-full bg-black/40 border border-cyan-900/30 rounded px-3 py-2 text-sm text-cyan-100 focus:border-cyan-500/50 focus:outline-none"
                                    >
                                        <option value="IN">Entrada (IN)</option>
                                        <option value="OUT">Saída (OUT)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-cyan-600 mb-1">Moeda</label>
                                    <select 
                                        value={asset} onChange={e => setAsset(e.target.value)}
                                        className="w-full bg-black/40 border border-cyan-900/30 rounded px-3 py-2 text-sm text-cyan-100 focus:border-cyan-500/50 focus:outline-none"
                                    >
                                        <option value="SOS">SOS</option>
                                        <option value="ALGO">ALGO</option>
                                        <option value="USDC">USDC</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-cyan-600 mb-1">Quantia</label>
                                    <input 
                                        type="number" value={amount} onChange={e => setAmount(e.target.value)}
                                        className="w-full bg-black/40 border border-cyan-900/30 rounded px-3 py-2 text-sm text-cyan-100 focus:border-cyan-500/50 focus:outline-none font-mono"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-cyan-600 mb-1">Descrição do Uso</label>
                                <textarea 
                                    value={description} onChange={e => setDescription(e.target.value)} rows={3}
                                    className="w-full bg-black/40 border border-cyan-900/30 rounded px-3 py-2 text-sm text-cyan-100 focus:border-cyan-500/50 focus:outline-none resize-none"
                                    placeholder="Detalhe o propósito desta movimentação..."
                                ></textarea>
                            </div>
                            <button 
                                onClick={handlePublish} disabled={isPublishing}
                                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-500 text-white rounded-lg uppercase tracking-widest font-bold shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] disabled:opacity-50 transition-all font-mono text-xs"
                            >
                                {isPublishing ? 'Registrando...' : 'Emitir no Livro Público'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="bg-[#0A0D0B] border border-cyan-900/30 p-5 rounded-xl space-y-4">
                        <h3 className="font-bold text-cyan-500 mb-4 flex items-center gap-2 border-b border-cyan-900/30 pb-2">
                            <Anchor className="w-4 h-4" /> Ledger de Movimentações
                        </h3>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                            {transactions.map(tx => (
                                <div key={tx.id} className="p-4 bg-black/40 border border-white/5 rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border font-mono ${tx.type === 'IN' ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : 'border-red-500/50 text-red-400 bg-red-500/10'}`}>
                                                {tx.type}
                                            </span>
                                            <span className="text-cyan-400 font-bold font-mono">{Number(tx.amount).toLocaleString()} {tx.asset}</span>
                                        </div>
                                        <span className="text-[10px] text-cyan-600/70 font-mono">{new Date(tx.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-xs text-cyan-100/80 mb-2">{tx.description}</p>
                                    <div className="text-[10px] text-cyan-700 font-mono break-all bg-black/60 p-1.5 rounded">
                                        TX: {tx.tx_hash}
                                    </div>
                                </div>
                            ))}
                            {transactions.length === 0 && (
                                <div className="text-center text-cyan-600/50 text-sm py-4 font-mono">Nenhum registro on-chain mapeado ainda.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const TrilhaDespertarTab = () => {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-12">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-[#d8b4e2] mb-16 font-mono drop-shadow-[0_0_10px_#d8b4e2]">A Trilha do Despertar</h2>
            
            <div className="relative w-full max-w-4xl flex items-center justify-between px-12">
                {/* Linha Holográfica Base */}
                <div className="absolute left-16 right-16 top-1/2 -ml-4 -mt-0.5 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                        animate={{ x: ['-100%', '300%'] }} 
                        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                        className="w-1/2 h-full bg-gradient-to-r from-transparent via-[#d8b4e2] to-transparent" 
                    />
                </div>

                {/* Nodes: Semente -> Broto -> Arvore -> Ancião */}
                <div className="flex flex-col items-center gap-4 relative z-10">
                    <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-600 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                        <div className="w-6 h-6 border-2 border-zinc-400 rotate-45" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Semente Dormida</span>
                </div>

                <div className="flex flex-col items-center gap-4 relative z-10">
                    <div className="w-16 h-16 rounded-full bg-emerald-950 border-2 border-emerald-600 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                        <Leaf className="text-emerald-400 w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-300">Broto Vital</span>
                </div>

                <div className="flex flex-col items-center gap-4 relative z-10">
                    <motion.div 
                        animate={{ boxShadow: ['0 0 10px #3b82f6', '0 0 30px #3b82f6', '0 0 10px #3b82f6'] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-20 h-20 rounded-full bg-blue-950 border-2 border-blue-400 flex items-center justify-center relative"
                    >
                        <div className="absolute inset-2 border border-blue-300/50 rounded-full" />
                        <Tent className="text-blue-300 w-8 h-8" />
                    </motion.div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-blue-300 font-bold">Árvore Protetora</span>
                </div>

                <div className="flex flex-col items-center gap-4 relative z-10 opacity-40 grayscale pointer-events-none">
                    <div className="w-24 h-24 rounded-full bg-purple-950 border-2 border-purple-500 border-dashed flex items-center justify-center">
                        <Sparkles className="text-purple-300 w-10 h-10" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-purple-300">Ancião de Gaia</span>
                </div>
            </div>
            
            <p className="mt-16 text-center text-xs font-mono text-zinc-500 max-w-sm">Evolua seu ser doando liquidez, aprovando conselhos e forjando arte nativa para destravar suas habilidades na malha orgânica.</p>
        </motion.div>
    );
};
