import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, MapPin, LifeBuoy, ShieldAlert, CheckCircle, Activity, Camera } from 'lucide-react';
import { supabase } from '../services/supabaseService';
import { EmergencyAlertRecord, EmergencyProofRecord } from '../services/supabaseService';

const FarolEmergenciaTab: React.FC = () => {
    const [alerts, setAlerts] = useState<EmergencyAlertRecord[]>([]);
    const [proofs, setProofs] = useState<Record<number, EmergencyProofRecord[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    
    // For submitting a proof
    const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);
    const [proofUrl, setProofUrl] = useState('');
    const [proofDesc, setProofDesc] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchAlerts = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('emergency_alerts')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            if (data) {
                setAlerts(data);
                // Fetch proofs for these alerts
                const pData = await Promise.all(
                    data.map(async (a) => {
                        const res = await supabase.from('emergency_proofs').select('*').eq('alert_id', a.id).order('created_at', { ascending: false });
                        return { id: a.id as number, proofs: res.data || [] };
                    })
                );
                const pMap: Record<number, EmergencyProofRecord[]> = {};
                pData.forEach(p => { pMap[p.id] = p.proofs; });
                setProofs(pMap);
            }
        } catch (e) {
            console.error('Erro ao buscar alertas:', e instanceof Error ? e.message : String(e));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();

        // Subscribe to emergencies & proofs
        const channel = supabase.channel('emergency-db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_alerts' }, () => { fetchAlerts(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_proofs' }, () => { fetchAlerts(); })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleSubmitProof = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAlertId || !proofUrl.trim()) return;
        setIsSubmitting(true);
        try {
            // "Mock" fetching wallet from context. Here we use an anon string.
            const wallet = localStorage.getItem('wallet_address') || `0x${Math.random().toString(16).slice(2, 10)}...`;
            
            const { error } = await supabase.from('emergency_proofs').insert([{
                alert_id: selectedAlertId,
                wallet_address: wallet,
                proof_url: proofUrl,
                description: proofDesc
            }]);
            
            if (error) throw error;
            
            setProofUrl('');
            setProofDesc('');
            setSelectedAlertId(null);
            
            // Optionally update funds or status depending on logics
        } catch (err) {
            console.error("Erro ao enviar prova:", err instanceof Error ? err.message : String(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return 'border-red-500/50 bg-red-950/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
            case 'HIGH': return 'border-orange-500/50 bg-orange-950/20 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]';
            default: return 'border-yellow-500/50 bg-yellow-950/20 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]';
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col max-w-6xl mx-auto w-full gap-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold uppercase tracking-widest text-[#ef4444] font-mono flex items-center gap-3 drop-shadow-[0_0_15px_#ef4444]">
                        <AlertTriangle className="w-10 h-10 animate-pulse" /> Farol de Emergência
                    </h2>
                    <p className="text-red-100/70 font-mono text-sm max-w-2xl mt-2">
                        Sistema de Alerta Precoce. Ativação descentralizada de ações on-chain para focos de incêndio, desmatamento clandestino e secas severas. Cada segundo conta.
                    </p>
                </div>
            </div>

            {isLoading && alerts.length === 0 ? (
                <div className="flex items-center justify-center py-20 text-red-500 font-mono text-sm animate-pulse">
                    <Activity className="w-6 h-6 mr-3" /> Rastrando sinais em tempo real...
                </div>
            ) : alerts.length === 0 ? (
                <div className="text-center py-20 bg-black/40 border border-red-900/40 rounded-xl shadow-inner">
                    <CheckCircle className="mx-auto w-12 h-12 text-emerald-500 mb-3 opacity-50" />
                    <p className="text-emerald-500/80 font-mono text-sm">A Nação respira em paz. Nenhuma emergência ativa.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {alerts.map(alert => {
                        const alertProofs = proofs[alert.id as number] || [];
                        const percentFunded = alert.funds_required > 0 
                            ? Math.min(100, Math.round(((alert.funds_raised || 0) / alert.funds_required) * 100)) 
                            : 0;

                        return (
                            <motion.div 
                                key={alert.id}
                                className={`rounded-xl border p-6 flex flex-col gap-4 relative overflow-hidden transition-all ${getSeverityStyles(alert.severity)}`}
                                whileHover={{ scale: 1.01 }}
                            >
                                {/* Scanline Efeito */}
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,0,0.1)_1px,transparent_1px)] bg-[size:100%_4px] opacity-20 pointer-events-none mix-blend-overlay"></div>

                                <div className="flex justify-between items-start z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full border border-current flex items-center justify-center bg-black/50">
                                            <ShieldAlert className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold font-mono tracking-tight">{alert.title}</h3>
                                            <div className="flex items-center gap-2 text-xs opacity-70 font-mono mt-1">
                                                <MapPin className="w-3 h-3" /> 
                                                [{alert.lat.toFixed(4)}, {alert.lng.toFixed(4)}]
                                            </div>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 font-bold text-[10px] uppercase tracking-widest border border-current rounded bg-black/50">
                                        {alert.status}
                                    </span>
                                </div>
                                
                                <p className="text-sm opacity-80 z-10 line-clamp-3">
                                    {alert.description}
                                </p>

                                {/* Treasury Multisig Funds for Action */}
                                <div className="mt-2 flex flex-col gap-2 z-10 bg-black/40 p-4 rounded-lg border border-current/20">
                                    <div className="flex justify-between text-xs font-mono">
                                        <span className="opacity-70">Liberação de Fundo Multisig</span>
                                        <span className="font-bold">{alert.funds_raised} / {alert.funds_required} SOS</span>
                                    </div>
                                    <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-current/30">
                                        <div className="h-full bg-current transition-all" style={{ width: `${percentFunded}%` }} />
                                    </div>
                                </div>

                                {/* Proofs of Action */}
                                <div className="mt-2 z-10">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-xs font-mono uppercase tracking-widest opacity-80 flex items-center gap-2">
                                            <Camera className="w-3 h-3" /> Proofs of Action ({alertProofs.length})
                                        </h4>
                                    </div>
                                    {alertProofs.length > 0 ? (
                                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                            {alertProofs.map(p => (
                                                <div key={p.id} className="min-w-[120px] bg-black/60 border border-current/20 rounded p-2 text-[10px] font-mono shrink-0">
                                                    <span className="block truncate text-current/60">{p.wallet_address.slice(0,8)}...</span>
                                                    <span className="font-bold uppercase">{p.status?.split('_').join(' ')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-[10px] font-mono opacity-50 italic">Nenhum Guardião atendeu o chamado ainda.</p>
                                    )}
                                </div>

                                <div className="mt-auto pt-4 z-10 flex gap-3">
                                    <button 
                                        onClick={() => setSelectedAlertId(selectedAlertId === alert.id ? null : alert.id as number)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-current/10 hover:bg-current/20 border border-current/50 rounded text-current uppercase tracking-widest font-bold text-xs transition-colors"
                                    >
                                        <LifeBuoy className="w-4 h-4" /> Atender Chamado
                                    </button>
                                </div>

                                {/* Form for Proof Submission */}
                                <AnimatePresence>
                                    {selectedAlertId === alert.id && (
                                        <motion.form 
                                            initial={{ height: 0, opacity: 0 }} 
                                            animate={{ height: 'auto', opacity: 1 }} 
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden z-10"
                                            onSubmit={handleSubmitProof}
                                        >
                                            <div className="bg-black/60 border border-current/30 rounded-lg p-4 mt-4 space-y-3">
                                                <div>
                                                    <label className="block text-[10px] font-mono mb-1 uppercase opacity-80">URL da Evidência (Satelite, Foto, TX)</label>
                                                    <input 
                                                        required type="url" value={proofUrl} onChange={e => setProofUrl(e.target.value)}
                                                        className="w-full bg-black/40 border border-current/30 rounded px-3 py-2 text-xs focus:outline-none focus:border-current"
                                                        placeholder="https://..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-mono mb-1 uppercase opacity-80">Relatório Georeferenciado / Situação</label>
                                                    <textarea 
                                                        value={proofDesc} onChange={e => setProofDesc(e.target.value)}
                                                        className="w-full bg-black/40 border border-current/30 rounded px-3 py-2 text-xs focus:outline-none focus:border-current resize-none h-16"
                                                    />
                                                </div>
                                                <button 
                                                    type="submit" disabled={isSubmitting}
                                                    className="w-full py-2 bg-current text-black font-bold uppercase tracking-widest text-xs rounded hover:opacity-90 disabled:opacity-50"
                                                >
                                                    {isSubmitting ? 'Criptografando...' : 'Enviar Proof of Action'}
                                                </button>
                                            </div>
                                        </motion.form>
                                    )}
                                </AnimatePresence>

                            </motion.div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
};

export default FarolEmergenciaTab;
