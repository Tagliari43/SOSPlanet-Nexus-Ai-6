import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { supabase } from '../services/supabaseService';
import { DaoProposalRecord } from '../services/supabaseService';

const DaoGovernance: React.FC = () => {
    const [proposals, setProposals] = useState<DaoProposalRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProposals = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('dao_proposals')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            if (data) setProposals(data);
        } catch (e: any) {
            console.error('Erro ao buscar propostas DAO:', e.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProposals();

        // Inscreve no Supabase Realtime
        const channel = supabase.channel('schema-db-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'dao_proposals'
                },
                (payload) => {
                    console.log('Realtime DAO Event:', payload);
                    fetchProposals(); // Atualiza a lista quando houver uma alteração
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleVote = async (id: number, type: 'for' | 'against') => {
        const prop = proposals.find(p => p.id === id);
        if (!prop) return;

        const field = type === 'for' ? 'votes_for' : 'votes_against';
        const currentVal = prop[field as keyof DaoProposalRecord] as number || 0;

        try {
            const { error } = await supabase
                .from('dao_proposals')
                .update({ [field]: currentVal + 1 })
                .eq('id', id);

            if (error) throw error;
            // O evento em tempo real (Realtime) atualizará a UI
        } catch (e: any) {
            console.error('Erro ao registrar voto:', e.message);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col max-w-5xl mx-auto w-full gap-6">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-emerald-400 mb-4 font-mono flex items-center gap-3 drop-shadow-[0_0_10px_#34d399]">
                <Users className="w-8 h-8" /> A Voz do Coletivo (DAO)
            </h2>
            <p className="text-emerald-100/70 font-mono text-sm mb-6">
                Rede de deliberação on-chain. O destino dos fundos da Tesouraria e as próximas etapas da Nação SOSPlanet são decididos em tempo real.
            </p>

            {isLoading && proposals.length === 0 ? (
                <div className="flex items-center justify-center py-20 text-emerald-500 font-mono text-sm animate-pulse">
                    Sincronizando governança na rede...
                </div>
            ) : proposals.length === 0 ? (
                <div className="text-center py-20 bg-black/40 border border-emerald-900/40 rounded-xl">
                    <p className="text-emerald-500 font-mono text-sm">Nenhuma proposta ativa no momento.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {proposals.map(proposal => {
                        const totalVotes = (proposal.votes_for || 0) + (proposal.votes_against || 0);
                        const percentFor = totalVotes > 0 ? Math.round(((proposal.votes_for || 0) / totalVotes) * 100) : 0;
                        const percentAgainst = totalVotes > 0 ? Math.round(((proposal.votes_against || 0) / totalVotes) * 100) : 0;
                        
                        const endDate = new Date(proposal.ends_at);
                        const isExpired = endDate.getTime() < Date.now();
                        const statusColor = proposal.status === 'APROVADA' ? 'text-green-400 border-green-500/50' 
                                         : proposal.status === 'REJEITADA' ? 'text-red-400 border-red-500/50' 
                                         : isExpired ? 'text-zinc-400 border-zinc-500/50' 
                                         : 'text-amber-400 border-amber-500/50';

                        return (
                            <motion.div 
                                key={proposal.id}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="bg-[#0A0D0B] border border-emerald-900/30 p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden group hover:border-emerald-700/50 transition-colors"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold text-emerald-300 font-mono leading-tight">{proposal.title}</h3>
                                            <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider border rounded-full font-mono ${statusColor}`}>
                                                {proposal.status || (isExpired ? 'EXPIRADA' : 'EM VOTAÇÃO')}
                                            </span>
                                        </div>
                                        <p className="text-emerald-100/60 text-sm whitespace-pre-wrap">{proposal.description}</p>
                                    </div>
                                    <div className="text-right ml-4 shrink-0">
                                        <div className="flex items-center gap-1 text-xs text-zinc-400 font-mono mb-1">
                                            <Clock className="w-3 h-3" /> Fim:
                                        </div>
                                        <p className="text-emerald-500/80 font-mono text-xs max-w-[120px]">{endDate.toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Barra de Progresso */}
                                <div className="mt-4 flex flex-col gap-2">
                                    <div className="flex justify-between text-xs font-mono font-bold">
                                        <span className="text-emerald-400">A Favor: {proposal.votes_for || 0} ({percentFor}%)</span>
                                        <span className="text-rose-400">Contra: {proposal.votes_against || 0} ({percentAgainst}%)</span>
                                    </div>
                                    <div className="w-full h-3 bg-red-900/30 rounded-full flex overflow-hidden border border-emerald-900/50">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentFor}%` }}
                                            transition={{ duration: 1, ease: 'easeOut' }}
                                            className="h-full bg-gradient-to-r from-emerald-600 to-green-400 transition-all" 
                                        />
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentAgainst}%` }}
                                            transition={{ duration: 1, ease: 'easeOut' }}
                                            className="h-full bg-gradient-to-l from-rose-600 to-red-400 transition-all" 
                                        />
                                    </div>
                                </div>

                                {/* Ações de Voto */}
                                <div className="flex items-center gap-4 mt-2">
                                    <button 
                                        onClick={() => handleVote(proposal.id!, 'for')}
                                        disabled={isExpired || proposal.status === 'APROVADA' || proposal.status === 'REJEITADA'}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-900/30 hover:bg-emerald-800/50 disabled:opacity-50 border border-emerald-800/50 rounded-xl text-emerald-300 uppercase tracking-widest font-bold text-xs transition-colors"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Votar Sim
                                    </button>
                                    <button 
                                        onClick={() => handleVote(proposal.id!, 'against')}
                                        disabled={isExpired || proposal.status === 'APROVADA' || proposal.status === 'REJEITADA'}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-900/30 hover:bg-rose-800/50 disabled:opacity-50 border border-rose-800/50 rounded-xl text-rose-300 uppercase tracking-widest font-bold text-xs transition-colors"
                                    >
                                        <XCircle className="w-4 h-4" /> Votar Não
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
};

export default DaoGovernance;
