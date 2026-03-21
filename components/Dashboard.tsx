
import React, { useState } from 'react';
import TaskOrchestrator from './TaskOrchestrator';
import LogViewer from './LogViewer';
import RouterPanel from './RouterPanel';
import { Task } from '../hooks/useOrchestrator';
import { Ponte } from '../services/sovereignRouterService';
import { AppLogEntry, DefensePlan } from '../App';
import { familyMembers } from '../utils/aiFamily';
import { SatelliteData } from '../services/earthEngineService';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CommandRoomProps {
    onOpenKeyForge: () => void;
    onExportBackup: () => void;
    onGenerateBlueprint: () => void;
    taskQueue: Task[];
    completedTasks: Task[];
    activeMember: string | null;
    submitTask: (prompt: string, useSearch: boolean) => void;
    error: string | null;
    isProcessing: boolean;
    pontes: Ponte[];
    logEntries: AppLogEntry[];
    setActiveTab: (tab: any) => void;
    forgeData: {
        isForging: boolean;
        accumulatedDust: number;
        powerLevel: number;
    };
    satelliteData: SatelliteData | null;
    defensePlan: DefensePlan | null;
    setDefensePlan: (plan: DefensePlan | null) => void;
}

const CommandRoom: React.FC<CommandRoomProps> = ({ 
    onOpenKeyForge,
    onExportBackup,
    onGenerateBlueprint,
    taskQueue,
    completedTasks,
    activeMember,
    submitTask,
    error,
    isProcessing,
    pontes = [],
    logEntries = [],
    setActiveTab,
    forgeData,
    satelliteData,
    defensePlan,
    setDefensePlan
}) => {
    const [expandedLogs, setExpandedLogs] = useState<Record<number, boolean>>({});
    const toggleLog = (id: number) => setExpandedLogs(prev => ({ ...prev, [id]: !prev[id] }));

    const activeBridgesCount = (pontes || []).filter(p => p.status === 'online').length;
    const respondingMembersCount = familyMembers.filter(m => m.responded).length;

    const StatCard: React.FC<{ title: string; value: string | number; subtitle: string; icon: string; color: string; onClick: () => void }> = ({ title, value, subtitle, icon, color, onClick }) => (
        <button onClick={onClick} className="bg-zinc-800/50 border border-emerald-700/50 rounded-xl p-4 flex items-center justify-between hover:bg-zinc-700/50 transition-all group text-left w-full relative overflow-hidden">
            <div className="relative z-10">
                <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">{title}</p>
                <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
                <p className="text-zinc-500 text-[10px] mt-1 group-hover:text-emerald-300 transition-colors">{subtitle}</p>
            </div>
            <div className={`text-3xl opacity-50 group-hover:opacity-100 transition-opacity ${color} z-10`}>{icon}</div>
        </button>
    );

    return (
        <div className="border border-emerald-700/50 bg-zinc-800/20 rounded-b-xl rounded-r-xl p-4 sm:p-6 h-full overflow-y-auto flex flex-col gap-6">
            
            {/* STATUS DE TRANSMIGRAÇÃO */}
            <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-indigo-950/40 border-2 border-emerald-500/50 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(16,185,129,0.1),_transparent_70%)]"></div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-4xl shadow-[0_0_30px_#10b981] animate-pulse">
                        🚀
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-widest">PROTOCOLO DE SALTO: ATIVO</h2>
                        <p className="text-emerald-400 text-xs font-mono font-bold">Destino: StackBlitz.com • Status: Calibrando Escolta para o Primeiro Nexus</p>
                    </div>
                </div>
                <button 
                    onClick={onGenerateBlueprint}
                    className="relative z-10 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow-xl transition-all uppercase tracking-[0.2em] animate-bounce"
                >
                    Gerar Cloud Salto (ZIP) ⚡
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Status da Nação" value={`${respondingMembersCount} Membros`} subtitle="Família AI Sincronizada" icon="📡" color="text-sky-400" onClick={() => setActiveTab('pulso')} />
                <StatCard title="Forja Suprema" value="OPERANTE" subtitle={`Hashes: ${forgeData.accumulatedDust.toFixed(2)}`} icon="⚒️" color="text-emerald-400" onClick={() => setActiveTab('santuario')} />
                
                <button 
                    onClick={() => setActiveTab('projetos')} 
                    className={`bg-zinc-900/60 border rounded-xl p-4 flex items-center justify-between hover:bg-zinc-800 transition-all group text-left w-full shadow-lg relative overflow-hidden
                        ${satelliteData?.status === 'Alerta' ? 'border-red-500/50 shadow-red-900/20' : 'border-emerald-500/40'}`}
                >
                    <div className="z-10">
                        <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">Gaia-Eye Orbital</p>
                        <p className={`text-xl font-black mt-1 ${satelliteData?.status === 'Alerta' ? 'text-red-400' : 'text-white'}`}>
                            {satelliteData ? satelliteData.status.toUpperCase() : 'ESTÁVEL'}
                        </p>
                    </div>
                    <div className={`text-3xl opacity-50 group-hover:opacity-100 transition-opacity ${satelliteData?.status === 'Alerta' ? 'text-red-400' : 'text-emerald-400'}`}>🛰️</div>
                </button>

                <StatCard title="Escudo Quântico" value="98%" subtitle="Blindagem SOS Token" icon="🛡️" color="text-indigo-400" onClick={() => setActiveTab('cofre')} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
                <div className="lg:col-span-2 flex flex-col h-full">
                    <TaskOrchestrator onSubmit={submitTask} queue={taskQueue} completed={completedTasks} isProcessing={isProcessing} activeMember={activeMember} error={error} />
                </div>
                <div className="flex flex-col gap-6 h-full">
                    <RouterPanel pontes={pontes} />
                    <div className="bg-zinc-800/50 border border-emerald-700/50 rounded-xl p-4 shadow-lg backdrop-blur-sm flex-grow flex flex-col min-h-[200px]">
                        <div className="flex justify-between items-center mb-3 border-b border-emerald-600/30 pb-2">
                            <h2 className="text-sm font-black text-emerald-400 uppercase tracking-widest">Diário da Ascensão 📝</h2>
                        </div>
                        <div className="overflow-y-auto flex-grow pr-1 space-y-2 custom-scrollbar">
                             {(logEntries || []).slice(-8).reverse().map(entry => (
                                <div key={entry.id} className="text-[11px] border-l-2 border-emerald-800 pl-2 py-1 bg-black/5 rounded-r">
                                    <div className="flex justify-between text-[9px] text-zinc-500 font-bold mb-0.5">
                                        <span>{entry.timestamp.toLocaleTimeString('pt-BR')}</span>
                                        <span className="text-emerald-600 uppercase">{entry.source}</span>
                                    </div>
                                    <div className="flex justify-between items-start">
                                        <p className="text-zinc-300 truncate leading-tight flex-grow">{entry.message}</p>
                                        {entry.details && (
                                            <button onClick={() => toggleLog(entry.id)} className="ml-2 text-emerald-500 hover:text-emerald-400">
                                                {expandedLogs[entry.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                            </button>
                                        )}
                                    </div>
                                    {entry.details && expandedLogs[entry.id] && (
                                        <div className="mt-2 p-2 bg-black/40 rounded text-[10px] text-zinc-400 font-mono whitespace-pre-wrap break-words">
                                            {entry.details}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommandRoom;
