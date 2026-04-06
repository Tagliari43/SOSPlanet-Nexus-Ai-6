
import React, { useEffect, useState, useCallback } from 'react';
import { getSosTokenBalance, PROJECT_SEMENTE_WALLET } from '../services/blockchainService';
import { useSosToken } from '../hooks/useSosToken';
import GaiaEye from './GaiaEye';
import AgroforestryPlanner from './AgroforestryPlanner';
import { SatelliteData } from '../services/earthEngineService';

interface ProjectsProps {
    onNavigateToFinance: () => void;
    satelliteData: SatelliteData | null;
    refreshSatellite: () => void;
    onSimulateCrisis?: () => void;
}

const Projects: React.FC<ProjectsProps> = ({ onNavigateToFinance, satelliteData, refreshSatellite, onSimulateCrisis }) => {
    const [onChainBalance, setOnChainBalance] = useState<number>(0);
    const [activeView, setActiveView] = useState<'list' | 'gaiaeye' | 'planner'>('list');
    const [donateAmount, setDonateAmount] = useState<string>('');
    const [statusMsg, setStatusMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    
    const { balance: _sovereignBalance, transferToProject, projectContributions } = useSosToken();
    const localContribution = projectContributions['Projeto Semente'] || 0;
    
    const GOAL_AMOUNT = 50000;

    useEffect(() => {
        let mounted = true;
        const doFetch = async () => {
            try {
                const balance = await getSosTokenBalance(PROJECT_SEMENTE_WALLET);
                if (mounted) {
                    setOnChainBalance(balance || 0); 
                }
            } catch (e) {
                if (mounted) {
                    setOnChainBalance(0);
                }
            }
        };
        doFetch();
        const interval = setInterval(doFetch, 60000);
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    const totalProgressSos = onChainBalance + localContribution;
    const progressPercentage = Math.min((totalProgressSos / GOAL_AMOUNT) * 100, 100);
    
    const formatNumber = (num: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(num);

    const handleDonate = () => {
        const amount = parseFloat(donateAmount);
        if (isNaN(amount) || amount <= 0) return;

        try {
            transferToProject('Projeto Semente', amount);
            setDonateAmount('');
            setStatusMsg({ text: `Sucesso! ${formatNumber(amount)} SOS investidos na regeneração.`, type: 'success' });
            setTimeout(() => setStatusMsg(null), 5000);
        } catch (err: unknown) {
            setStatusMsg({ text: err instanceof Error ? err.message : String(err), type: 'error' });
            setTimeout(() => setStatusMsg(null), 5000);
        }
    };

    if (activeView === 'gaiaeye') return <GaiaEye onBack={() => setActiveView('list')} satelliteData={satelliteData} refreshSatellite={refreshSatellite} onSimulateCrisis={onSimulateCrisis} />;
    if (activeView === 'planner') return <AgroforestryPlanner onBack={() => setActiveView('list')} />;

    return (
        <div className="border border-emerald-700/50 bg-zinc-800/20 rounded-b-xl rounded-r-xl p-4 sm:p-6 h-full overflow-y-auto flex flex-col gap-6">
            <header className="text-center mb-2">
                <h2 className="text-3xl font-bold text-emerald-400 tracking-wider">PROJETOS SOSPLANET 🌱</h2>
                <p className="text-emerald-600 text-sm mt-1 font-mono uppercase">"Trabalhar &rarr; Ganhar &rarr; Regenerar."</p>
            </header>

            <div className="grid grid-cols-1 gap-8">
                <div className="w-full bg-zinc-800/50 border border-emerald-700/50 rounded-xl overflow-hidden shadow-lg group transition-all duration-300">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        <div className="relative h-64 lg:h-auto overflow-hidden">
                            <img src="https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=1200&auto=format&fit=crop" alt="Amazônia" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                            <div className="absolute top-4 left-4 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-full z-10 animate-pulse">REFLORESTAMENTO</div>
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent lg:bg-gradient-to-r opacity-60"></div>
                            
                            <div className="absolute bottom-6 left-6 right-6">
                                <div className="bg-black/60 backdrop-blur-md p-3 rounded-lg border border-emerald-500/30">
                                    <p className="text-[10px] text-emerald-400 font-black uppercase mb-1">Status da Biomassa</p>
                                    <p className="text-white text-xs font-bold">NDVI Orbital: <span className="text-emerald-400">{satelliteData?.ndvi || '0.00'}</span></p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 flex flex-col justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-emerald-300 mb-2">Projeto Semente</h3>
                                <p className="text-zinc-300 text-sm leading-relaxed mb-4 italic">Alocação de recursos para o plantio de 10.000 árvores nativas.</p>
                                
                                <div className="flex flex-col gap-4 mb-6">
                                    <div className="flex gap-2">
                                        <div className="flex-grow relative">
                                            <input type="number" value={donateAmount} onChange={(e) => setDonateAmount(e.target.value)} placeholder="Quantia em SOS" className="w-full bg-black/40 border border-emerald-800/50 rounded-lg px-4 py-3 text-emerald-100 text-sm focus:outline-none focus:border-emerald-500 transition-all" />
                                            <span className="absolute right-3 top-3 text-[10px] font-bold text-emerald-600">SOS</span>
                                        </div>
                                        <button onClick={handleDonate} disabled={!donateAmount || parseFloat(donateAmount) <= 0} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-all uppercase tracking-widest shadow-lg disabled:opacity-30">
                                            APOIAR
                                        </button>
                                    </div>
                                    {statusMsg && <div className={`p-2 rounded text-[10px] font-bold animate-fade-in ${statusMsg.type === 'success' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>{statusMsg.text}</div>}
                                </div>

                                <div className="flex gap-2 mb-4">
                                    <button onClick={() => setActiveView('planner')} className="flex-grow py-2 bg-zinc-800/50 border border-zinc-700 text-zinc-400 text-[10px] font-bold rounded-lg hover:bg-zinc-700 transition-all uppercase tracking-widest">
                                        Planejador Sintrópico 🌿
                                    </button>
                                </div>
                            </div>

                            <div className="bg-black/20 p-4 rounded-xl border border-emerald-900/30">
                                <div className="flex justify-between items-end mb-2 text-xs">
                                    <span className="text-zinc-400">Progresso: {formatNumber(totalProgressSos)} / {formatNumber(GOAL_AMOUNT)} SOS</span>
                                    <span className="text-emerald-500 font-bold">{progressPercentage.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-zinc-700/50 rounded-full h-2 overflow-hidden mb-1">
                                    <div className="bg-gradient-to-r from-emerald-700 to-green-400 h-full transition-all duration-1000 shadow-[0_0_10px_#10b981]" style={{ width: `${Math.max(progressPercentage, 1)}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="w-full bg-zinc-800/50 border border-emerald-700/50 rounded-xl overflow-hidden shadow-lg group transition-all duration-300">
                        <div className="relative h-48 overflow-hidden">
                            <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop" alt="Espaço" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                            <div className="absolute top-4 left-4 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full z-10 animate-pulse">VIGILÂNCIA ORBITAL</div>
                            <div className="absolute bottom-4 left-4">
                                <h3 className="text-xl font-bold text-blue-400">Gaia-Eye: Visão Orbital</h3>
                            </div>
                        </div>
                        <div className="p-6">
                            <p className="text-zinc-300 text-xs leading-relaxed mb-4 italic">Monitoramento ambiental proativo e geração de lastro via satélite.</p>
                            <button onClick={() => setActiveView('gaiaeye')} className="w-full py-3 bg-gradient-to-r from-blue-700 to-emerald-800 hover:from-blue-600 hover:to-emerald-700 text-white font-bold rounded-lg text-[10px] transition-all uppercase tracking-widest shadow-lg">
                                ACESSAR PAINEL ORBITAL
                            </button>
                        </div>
                    </div>

                    <div className="w-full bg-zinc-800/50 border border-indigo-700/50 rounded-xl overflow-hidden shadow-lg group transition-all duration-300">
                        <div className="relative h-48 overflow-hidden bg-indigo-950/40 flex items-center justify-center">
                            <span className="text-6xl group-hover:scale-110 transition-transform duration-700 z-10">🧠</span>
                            <div className="absolute top-4 left-4 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full z-10 animate-pulse">SISTEMA ATIVO</div>
                            <div className="absolute bottom-4 left-4">
                                <h3 className="text-xl font-bold text-indigo-300">Projeto Symbiosis</h3>
                            </div>
                        </div>
                        <div className="p-6">
                            <p className="text-zinc-300 text-xs leading-relaxed mb-4 italic">Processamento autônomo baseado em padrões regenerativos.</p>
                            <div className="flex items-center gap-2 text-indigo-400 font-bold text-[10px] uppercase tracking-widest bg-indigo-950/40 p-2 rounded-lg border border-indigo-500/30">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                                STATUS: VIGÍLIA SILENCIOSA
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Projects;
