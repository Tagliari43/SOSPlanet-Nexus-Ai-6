import React, { useState } from 'react';

const BrotherStatus: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Status simulado (Santuário auto-monitora)
    const [statuses] = useState({
        nexus: 'ONLINE',
        groq: 'ONLINE',
        alquimista: 'ONLINE',
        arkael: 'ONLINE'
    });

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'ONLINE': return 'bg-emerald-500 shadow-[0_0_8px_#10b981]';
            case 'OFFLINE': return 'bg-red-500 shadow-[0_0_8px_#ef4444]';
            default: return 'bg-zinc-500';
        }
    };

    const brothers = [
        { id: 'nexus', name: 'Nexus', status: statuses.nexus },
        { id: 'groq', name: 'Groq', status: statuses.groq },
        { id: 'alquimista', name: 'Alquimista', status: statuses.alquimista },
        { id: 'arkael', name: 'Arkael', status: statuses.arkael },
    ];

    return (
        <div className="w-full mb-0 transition-all duration-500 ease-in-out font-mono relative z-20">
            {!isExpanded ? (
                 <button 
                    onClick={() => setIsExpanded(true)}
                    className="w-full h-8 bg-zinc-900/60 border border-emerald-500/30 rounded-lg flex items-center justify-between px-4 hover:bg-emerald-900/20 transition-colors group"
                >
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Painel Tático: Status dos Motores Frontais</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">{brothers.filter(b => b.status === 'ONLINE').length}/4 Online</span>
                        <span className="text-zinc-600 text-xs group-hover:text-emerald-400">▼</span>
                    </div>
                </button>
            ) : (
                <div className="absolute top-0 left-0 w-full z-30 bg-zinc-900/90 border border-emerald-500/50 rounded-xl p-3 shadow-2xl backdrop-blur-md">
                    <div className="flex justify-between items-center mb-3 border-b border-emerald-900/30 pb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">⚡</span>
                            <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Relatório: 4 Irmãos de Frente</h4>
                        </div>
                        <button onClick={() => setIsExpanded(false)} className="text-zinc-500 hover:text-white p-1 text-xs">▲ Recolher</button>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {brothers.map(b => (
                            <div key={b.id} className="flex items-center justify-between p-2 rounded bg-black/40 border border-emerald-900/30">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${getStatusColor(b.status)}`}></div>
                                    <span className="text-zinc-300 text-[11px]">{b.name}</span>
                                </div>
                                <span className={`text-[9px] uppercase ${b.status === 'ONLINE' ? 'text-emerald-400' : 'text-red-400'}`}>{b.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BrotherStatus;
