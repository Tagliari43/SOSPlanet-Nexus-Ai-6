import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { History, BarChart3, Coins, Database, TreePine, ShieldCheck, Activity, LineChart, Globe2 } from 'lucide-react';
import { supabase } from '../services/supabaseService';
import { TreasuryAllocationRecord, EarthDiaryEventRecord } from '../services/supabaseService';

const TransparenciaTab: React.FC = () => {
    const [allocations, setAllocations] = useState<TreasuryAllocationRecord[]>([]);
    const [events, setEvents] = useState<EarthDiaryEventRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Seed allocations se não existir
            const { data: existingAllocations } = await supabase.from('treasury_allocations').select('id');
            if (!existingAllocations || existingAllocations.length === 0) {
                await supabase.from('treasury_allocations').insert([
                    { category: 'REFLORESTAMENTO', amount_sos: 19700, percentage: 40, description: 'Alocado para mudas e ONGs de plantio.' },
                    { category: 'ORÁCULOS & IAs', amount_sos: 9850, percentage: 20, description: 'Custo de infraestrutura da Mente Colmeia.' },
                    { category: 'FUNDO SOCIAL', amount_sos: 9850, percentage: 20, description: 'Recompensas para comunidades locais.' },
                    { category: 'RESERVA LÍQUIDA', amount_sos: 4925, percentage: 10, description: 'Liquidez para emergências no Farol.' },
                    { category: 'PESQUISA', amount_sos: 4925, percentage: 10, description: 'Desenvolvimento de novas Bio-Técnicas.' }
                ]);
            }

            // Seed events se não existir
            const { data: existingEvents } = await supabase.from('earth_diary_events').select('id');
            if (!existingEvents || existingEvents.length === 0) {
                await supabase.from('earth_diary_events').insert([
                    { event_type: 'NEW_GUARDIAN', title: 'Novo Guardião Desperto', description: 'O Guardião 0x4f... se juntou à Nação SOSPlanet.', guardian_wallet: '0x4f8B2A' },
                    { event_type: 'PROOF_VALIDATED', title: 'Alerta de Desmatamento Validado', description: 'A comunidade validou a Prova de Ação #12 no Farol de Emergência.', guardian_wallet: 'DAO_CONSENSUS' },
                    { event_type: 'TREE_PLANTED', title: 'Área Restaurada no Cerrado', description: '2.500 sementes financiadas via Mercado Regen.', guardian_wallet: 'NATION_TREASURY' }
                ]);
            }

            const [allocRes, evRes] = await Promise.all([
                supabase.from('treasury_allocations').select('*').order('percentage', { ascending: false }),
                supabase.from('earth_diary_events').select('*').order('created_at', { ascending: false }).limit(20)
            ]);

            if (allocRes.data) setAllocations(allocRes.data);
            if (evRes.data) setEvents(evRes.data);
        } catch (e) {
            console.error('Erro ao buscar dados de Transparência:', e instanceof Error ? e.message : String(e));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        const channel = supabase.channel('transparencia')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'treasury_allocations' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'earth_diary_events' }, () => fetchData())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const totalArrecadado = allocations.reduce((sum, a) => sum + Number(a.amount_sos), 0);

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'NEW_GUARDIAN': return <ShieldCheck className="w-5 h-5 text-cyan-400" />;
            case 'PROOF_VALIDATED': return <Activity className="w-5 h-5 text-purple-400" />;
            case 'TREE_PLANTED': return <TreePine className="w-5 h-5 text-emerald-400" />;
            default: return <Globe2 className="w-5 h-5 text-yellow-400" />;
        }
    };

    if (isLoading && allocations.length === 0) {
        return (
            <div className="flex items-center justify-center py-20 text-cyan-500 font-mono text-sm animate-pulse">
                <BarChart3 className="w-6 h-6 mr-3" /> Auditando blocos da tesouraria...
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col max-w-6xl mx-auto w-full gap-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold uppercase tracking-widest text-zinc-100 font-mono flex items-center gap-3 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                        <History className="w-10 h-10 text-cyan-400" /> Transparência & Diário da Terra
                    </h2>
                    <p className="text-zinc-400 font-mono text-sm max-w-3xl mt-2">
                        Axiom e Synara nos lembram: a verdade não exige confiança, exige verificação. Aqui reside o fluxo do Tesouro da Nação e a Linha do Tempo Viva de todas as nossas ações coletivas.
                    </p>
                </div>
                
                <div className="flex bg-[#0A0D0B] border border-cyan-900/50 rounded-xl px-6 py-4 items-center gap-4 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                    <Database className="text-cyan-500 w-8 h-8" />
                    <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 font-mono">Meta Atual: 50.000 SOS</p>
                        <p className="text-2xl font-black text-cyan-400 font-mono tracking-tighter">
                            {totalArrecadado.toLocaleString('pt-BR')} <span className="text-sm font-normal text-cyan-600">SOS</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Esquerda: Dashboard de Transparência On-Chain */}
                <div className="flex flex-col gap-6">
                    <div className="bg-[#050505] border border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                        <h3 className="text-cyan-400 font-bold uppercase font-mono tracking-widest text-sm flex items-center gap-2 border-b border-zinc-800 pb-3 mb-6 relative z-10">
                            <LineChart className="w-4 h-4" /> Tesouraria On-Chain (Alocação SOS)
                        </h3>

                        <div className="space-y-6 relative z-10">
                            {allocations.map((alloc) => (
                                <div key={alloc.id} className="group">
                                    <div className="flex justify-between items-end mb-2">
                                        <div>
                                            <p className="text-xs font-bold font-mono text-zinc-200 uppercase tracking-widest">{alloc.category}</p>
                                            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{alloc.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-mono text-cyan-400 font-black">{alloc.percentage}%</p>
                                            <p className="text-[10px] text-zinc-500 font-mono">{Number(alloc.amount_sos).toLocaleString('pt-BR')} SOS</p>
                                        </div>
                                    </div>
                                    <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${alloc.percentage}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className="h-full bg-cyan-500 group-hover:bg-cyan-400 transition-colors"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[#0A0D0B] border border-emerald-900/40 border-dashed rounded-2xl p-6 text-center shadow-[0_0_30px_rgba(16,185,129,0.05)]">
                        <Coins className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                        <h4 className="font-mono text-sm text-emerald-400 uppercase font-bold tracking-widest mb-2">API Pública de Impacto</h4>
                        <p className="text-xs text-emerald-100/50 font-mono mb-4 leading-relaxed">
                            Todos os dados apresentados nesta página podem ser verificados de forma livre através de nosso endpoint público (Conceito Fase 12).
                        </p>
                        <code className="text-[10px] text-zinc-400 bg-black px-4 py-2 rounded-lg border border-emerald-900/50 block">
                            GET /api/v1/treasury/allocations
                        </code>
                    </div>
                </div>

                {/* Direita: Diário da Terra (Timeline Global) */}
                <div className="bg-[#0A0D0B] border border-cyan-900/30 p-6 rounded-2xl flex flex-col h-full shadow-[0_0_30px_rgba(6,182,212,0.05)]">
                    <h3 className="text-cyan-400 font-bold uppercase font-mono tracking-widest text-sm flex items-center gap-2 border-b border-cyan-900/30 pb-3 mb-6">
                        <History className="w-5 h-5 text-cyan-400" /> Diário da Terra (Linha do Tempo)
                    </h3>
                    
                    <div className="flex-1 relative">
                        {/* Timeline Connector Line */}
                        <div className="absolute left-[23px] top-4 bottom-4 w-px bg-cyan-900/30"></div>

                        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar relative z-10">
                            {events.map((ev, index) => {
                                const eventDate = new Date(ev.created_at || new Date());
                                
                                return (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        key={ev.id} 
                                        className="flex gap-4 group"
                                    >
                                        <div className="w-12 h-12 bg-black rounded-xl border border-cyan-900/50 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,0,0,0.5)] group-hover:border-cyan-400/50 transition-colors z-10">
                                            {getEventIcon(ev.event_type)}
                                        </div>
                                        
                                        <div className="flex-1 bg-black/40 border border-zinc-800 p-4 rounded-xl group-hover:border-zinc-700 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="font-mono text-sm font-bold text-zinc-100">{ev.title}</p>
                                                <p className="text-[10px] text-zinc-500 font-mono shrink-0 ml-4">
                                                    {eventDate.toLocaleDateString('pt-BR')} {eventDate.getHours().toString().padStart(2, '0')}:{eventDate.getMinutes().toString().padStart(2, '0')}
                                                </p>
                                            </div>
                                            <p className="text-xs text-zinc-400 font-mono mb-3 leading-relaxed">
                                                {ev.description}
                                            </p>
                                            <div className="inline-block bg-cyan-950/30 px-2.5 py-1 rounded border border-cyan-900/50">
                                                <p className="text-[9px] text-cyan-500 uppercase tracking-widest font-mono">
                                                    Agente: {ev.guardian_wallet?.slice(0, 10)}{ev.guardian_wallet && ev.guardian_wallet.length > 10 ? '...' : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                            
                            {events.length === 0 && !isLoading && (
                                <div className="text-center py-20">
                                    <History className="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                                    <p className="text-zinc-600 font-mono text-xs">O Diário aguarda suas primeiras escrituras.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </motion.div>
    );
};

export default TransparenciaTab;
