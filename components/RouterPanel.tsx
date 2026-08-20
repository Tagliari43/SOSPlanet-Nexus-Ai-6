import React from 'react';
import { Ponte } from '../services/sovereignRouterService';

interface RouterPanelProps {
    pontes: Ponte[];
}

const RouterPanel: React.FC<RouterPanelProps> = ({ pontes = [] }) => {
    return (
        <div className="bg-zinc-800/50 border border-emerald-700/50 rounded-xl p-4 shadow-lg shadow-emerald-900/20 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-3 border-b-2 border-emerald-600/30 pb-2">
                <h2 className="text-xl font-bold text-emerald-400">Painel do Roteador Soberano 🛡️</h2>
                <span className="text-xs text-emerald-400 font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
                    🟢 Multi-Ponte Ativo
                </span>
            </div>

            <div className="space-y-3">
                {(pontes || []).map(ponte => {
                    const usoPercentual = (ponte.usoDiario / ponte.limiteDiario) * 100;
                    const isOnline = ponte.status === 'online';
                    return (
                        <div key={ponte.nome}>
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className={`font-bold ${isOnline ? 'text-emerald-300' : 'text-zinc-500'}`}>{ponte.nome}</span>
                                <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${isOnline ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                    {ponte.status.toUpperCase()}
                                </span>
                            </div>
                            <div className="w-full bg-black/30 rounded-full h-2.5">
                                <div 
                                    className={`h-2.5 rounded-full transition-all duration-500 ${isOnline ? 'bg-emerald-600' : 'bg-zinc-600'}`}
                                    style={{ width: `${usoPercentual}%`}}
                                ></div>
                            </div>
                             <p className="text-xs text-right text-zinc-500 mt-1">{ponte.usoDiario} / {ponte.limiteDiario}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RouterPanel;
