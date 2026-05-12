import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, ShieldCheck, HeartPulse, Radio, Network, Server, Fingerprint, Database, CheckSquare, XSquare, BrainCircuit, Globe2 } from 'lucide-react';
import { supabase } from '../services/supabaseService';
import { VitalPulseMetricRecord, EmergencyProofRecord } from '../services/supabaseService';

const PulsoVitalTab: React.FC = () => {
    const [metrics, setMetrics] = useState<VitalPulseMetricRecord[]>([]);
    const [pendingProofs, setPendingProofs] = useState<EmergencyProofRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [walletAddress, setWalletAddress] = useState<string>('');
    const [simTrees, setSimTrees] = useState(100);
    
    const [myValidations, setMyValidations] = useState<number[]>([]);

    const fetchData = async (wallet: string) => {
        setIsLoading(true);
        try {
            // Seed initial metrics if empty
            const { data: existingMetrics } = await supabase.from('vital_pulse_metrics').select('id');
            if (!existingMetrics || existingMetrics.length === 0) {
                await supabase.from('vital_pulse_metrics').insert([
                    { metric_name: 'Saúde da Rede Nação', metric_value: 98.5, status: 'NORMAL', icon_name: 'Network' },
                    { metric_name: 'IAs em Vigília', metric_value: 12, status: 'NORMAL', icon_name: 'BrainCircuit' },
                    { metric_name: 'Sincronia do Farol', metric_value: 99.9, status: 'NORMAL', icon_name: 'Radio' },
                    { metric_name: 'Staking de Impacto (SOS)', metric_value: 49250, status: 'NORMAL', icon_name: 'Database' }
                ]);
            }

            const [metRes, proofsRes, valRes] = await Promise.all([
                supabase.from('vital_pulse_metrics').select('*').order('id', { ascending: true }),
                supabase.from('emergency_proofs').select('*').eq('status', 'PENDING').order('created_at', { ascending: false }),
                wallet ? supabase.from('action_proof_validations').select('proof_id').eq('validator_wallet', wallet) : Promise.resolve({ data: [] })
            ]);

            if (metRes.data) setMetrics(metRes.data);
            if (proofsRes.data) setPendingProofs(proofsRes.data);
            if (valRes.data) {
                setMyValidations(valRes.data.map((v: { proof_id: number }) => v.proof_id));
            }
        } catch (e) {
            console.error('Erro ao buscar telemetria:', e instanceof Error ? e.message : String(e));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const w = localStorage.getItem('wallet_address') || `0x${Math.random().toString(16).slice(2, 10)}...`;
        setWalletAddress(w);
        fetchData(w);

        const channel = supabase.channel('pulso-vital')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'vital_pulse_metrics' }, () => fetchData(w))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_proofs' }, () => fetchData(w))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'action_proof_validations' }, () => fetchData(w))
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleValidate = async (proofId: number, isApproved: boolean) => {
        if (!walletAddress || myValidations.includes(proofId)) return;

        try {
            await supabase.from('action_proof_validations').insert([{
                proof_id: proofId,
                validator_wallet: walletAddress,
                vote_status: isApproved ? 'APPROVED' : 'REJECTED'
            }]);
            
            // In a real system, we would trigger an Edge Function or Database Trigger to check if the proof reached quorum (e.g. 3 approvals)
            // For MVP UI, we simulate updating a local state
            setMyValidations([...myValidations, proofId]);
            alert('Validação registrada com sucesso na Malha!');

            // Increment network health slightly to simulate engagement
            const networkMetric = metrics.find(m => m.metric_name.includes('Saúde'));
            if (networkMetric) {
                await supabase.from('vital_pulse_metrics')
                    .update({ metric_value: Math.min(100, networkMetric.metric_value + 0.1) })
                    .eq('id', networkMetric.id);
            }
        } catch (e) {
            console.error('Erro ao registrar validação:', e instanceof Error ? e.message : String(e));
        }
    };

    const getIcon = (name?: string) => {
        switch (name) {
            case 'Network': return <Network className="w-5 h-5 text-cyan-400" />;
            case 'BrainCircuit': return <BrainCircuit className="w-5 h-5 text-purple-400" />;
            case 'Radio': return <Radio className="w-5 h-5 text-emerald-400" />;
            case 'Database': return <Database className="w-5 h-5 text-yellow-400" />;
            default: return <Activity className="w-5 h-5 text-zinc-400" />;
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col max-w-6xl mx-auto w-full gap-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold uppercase tracking-widest text-[#06b6d4] font-mono flex items-center gap-3 drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                        <HeartPulse className="w-10 h-10" /> O Pulso Vital
                    </h2>
                    <p className="text-cyan-100/70 font-mono text-sm max-w-2xl mt-2">
                        Telemetria do Santuário, Oráculo de Simulação Climática e a Câmara dos Sonhos (Prova Coletiva). Sinta o coração da Nação batendo em tempo real.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Esquerda: Telemetria e Dashboard */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    
                    {/* Saúde do Ecossistema */}
                    <div className="bg-[#050505] border border-cyan-900/40 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.05)]">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <Server className="w-48 h-48" />
                        </div>
                        <h3 className="text-cyan-400 font-bold uppercase font-mono tracking-widest text-sm flex items-center gap-2 border-b border-cyan-900/30 pb-3 mb-6 relative z-10">
                            <Activity className="w-4 h-4" /> Matriz de Telemetria On-Chain
                        </h3>

                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            {metrics.map(metric => (
                                <div key={metric.id} className="bg-black/50 border border-cyan-900/20 p-4 rounded-xl flex items-center gap-4 hover:border-cyan-500/30 transition-colors">
                                    <div className="w-12 h-12 bg-cyan-950/30 rounded-lg flex items-center justify-center border border-cyan-900/50">
                                        {getIcon(metric.icon_name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest truncate">{metric.metric_name}</p>
                                        <p className="text-xl font-black font-mono text-white flex items-baseline gap-1">
                                            {metric.metric_value.toLocaleString('pt-BR')} 
                                            {metric.metric_name.includes('Saúde') || metric.metric_name.includes('Sincronia') ? <span className="text-sm text-cyan-500">%</span> : ''}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && metrics.length === 0 && (
                                <div className="col-span-2 py-4 text-center text-cyan-600 animate-pulse font-mono text-xs">Sincronizando sensores biométricos da rede...</div>
                            )}
                        </div>
                    </div>

                    {/* Câmara de Validação (Sala de Provas) */}
                    <div className="bg-[#0A0D0B] border border-emerald-900/40 rounded-2xl p-6 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
                        <h3 className="text-emerald-400 font-bold uppercase font-mono tracking-widest text-sm flex items-center gap-2 border-b border-emerald-900/30 pb-3 mb-6">
                            <ShieldCheck className="w-4 h-4" /> Câmara dos Sonhos: Sala de Provas
                        </h3>
                        <p className="text-xs text-emerald-100/50 font-mono mb-4 leading-relaxed">
                            Aqui, os Guardiões inspecionam as evidências geradas pelo Farol de Emergência. 
                            Nenhuma verdade é absoluta até o consenso da Malha. O DAO necessita da sua validação.
                        </p>

                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {pendingProofs.map(proof => {
                                const hasVoted = myValidations.includes(proof.id as number);
                                
                                return (
                                    <div key={proof.id} className="bg-black/40 border border-emerald-900/30 p-4 rounded-xl">
                                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-mono uppercase tracking-widest">
                                                        Alerta #{proof.alert_id}
                                                    </span>
                                                    <span className="text-xs text-zinc-500 font-mono">Enviado por: {proof.guardian_wallet.slice(0,8)}...</span>
                                                </div>
                                                <p className="text-sm text-zinc-300 font-mono mb-3 bg-zinc-900/50 p-2 rounded border border-zinc-800">"{proof.evidence_description}"</p>
                                                
                                                {proof.media_url && (
                                                    <a href={proof.media_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono">
                                                        <Fingerprint className="w-3 h-3" /> Visualizar Evidência Criptografada
                                                    </a>
                                                )}
                                            </div>
                                            
                                            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-center gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-emerald-900/30 pt-3 sm:pt-0 sm:pl-3">
                                                {hasVoted ? (
                                                    <div className="flex items-center gap-2 text-emerald-500 font-mono text-xs uppercase bg-emerald-950/30 px-3 py-1.5 rounded-lg border border-emerald-900/50">
                                                        <CheckSquare className="w-4 h-4" /> Voto Registrado
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button 
                                                            onClick={() => handleValidate(proof.id as number, true)}
                                                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-900/30 hover:bg-emerald-800/40 text-emerald-400 border border-emerald-500/50 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all w-full justify-center"
                                                        >
                                                            <CheckSquare className="w-3 h-3" /> Validar
                                                        </button>
                                                        <button 
                                                            onClick={() => handleValidate(proof.id as number, false)}
                                                            className="flex items-center gap-2 px-3 py-1.5 bg-red-900/30 hover:bg-red-800/40 text-red-400 border border-red-500/50 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all w-full justify-center"
                                                        >
                                                            <XSquare className="w-3 h-3" /> Rejeitar
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {pendingProofs.length === 0 && !isLoading && (
                                <div className="text-center py-10 bg-black/20 rounded-xl border border-dashed border-emerald-900/30">
                                    <ShieldCheck className="w-8 h-8 text-emerald-900 mx-auto mb-2" />
                                    <p className="text-emerald-700 font-mono text-xs">Nenhuma prova pendente na malha de consenso.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Direita: Oráculo de Simulação */}
                <div className="bg-[#0A0D0B] border border-purple-900/40 p-6 rounded-2xl flex flex-col shadow-[0_0_30px_rgba(168,85,247,0.05)]">
                    <h3 className="text-purple-400 font-bold uppercase font-mono tracking-widest text-sm flex items-center gap-2 border-b border-purple-900/30 pb-3 mb-6">
                        <Globe2 className="w-5 h-5 text-purple-500" /> Oráculo Climático
                    </h3>
                    
                    <p className="text-xs text-purple-100/50 font-mono mb-6 leading-relaxed">
                        Aura e Arion fornecem a máquina de probabilidade. Simule ações coletivas abaixo para prever o fluxo de energia regen.
                    </p>

                    <div className="flex-1 flex flex-col gap-6">
                        
                        <div className="bg-black/50 p-4 rounded-xl border border-purple-900/20">
                            <label className="text-[10px] text-purple-300 uppercase tracking-widest font-mono font-bold mb-3 block">Simular Aporte de Árvores</label>
                            <input 
                                type="range" 
                                min="10" max="10000" step="10"
                                value={simTrees}
                                onChange={(e) => setSimTrees(parseInt(e.target.value))}
                                className="w-full accent-purple-500 h-1 bg-purple-950 rounded-lg appearance-none cursor-pointer mb-2"
                            />
                            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                                <span>10</span>
                                <span className="text-purple-400 font-bold">{simTrees} árvores</span>
                                <span>10.000</span>
                            </div>
                        </div>

                        <div className="space-y-3 mt-2">
                            <div className="flex justify-between items-center p-3 bg-purple-950/20 border border-purple-900/30 rounded-lg">
                                <span className="text-[10px] uppercase font-mono text-zinc-400">CO2 Sequestrado (Anual)</span>
                                <span className="text-sm font-black font-mono text-cyan-400">~{Math.round(simTrees * 21.77).toLocaleString('pt-BR')} kg</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-purple-950/20 border border-purple-900/30 rounded-lg">
                                <span className="text-[10px] uppercase font-mono text-zinc-400">Terreno Restaurado</span>
                                <span className="text-sm font-black font-mono text-emerald-400">~{(simTrees * 0.005).toFixed(2)} hectares</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-purple-950/20 border border-purple-900/30 rounded-lg">
                                <span className="text-[10px] uppercase font-mono text-zinc-400">Custo Base Tesouraria</span>
                                <span className="text-sm font-black font-mono text-yellow-500">{simTrees * 50} SOS</span>
                            </div>
                        </div>

                        <div className="mt-auto pt-4 border-t border-purple-900/20">
                            <button className="w-full bg-purple-900/30 hover:bg-purple-800/40 text-purple-300 border border-purple-500/50 px-4 py-3 rounded-xl font-mono text-xs uppercase font-bold tracking-widest transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                                Propor como Nova Lei (DAO)
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </motion.div>
    );
};

export default PulsoVitalTab;
