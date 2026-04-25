
import React, { useMemo, useState } from 'react';
import { LibraryEntry } from './BibliotecaGaia';
import { Ponte } from '../services/sovereignRouterService';
import { ReconProbe } from '../hooks/useOrchestrator';

interface AlertItem {
    id: string;
    type: 'finance' | 'knowledge' | 'infra' | 'energy' | 'mission';
    title: string;
    message: string;
    targetTab: string;
    severity: 'low' | 'medium' | 'high';
    icon: string;
}

interface AlertCenterProps {
    alchemyState: any;
    libraryEntries: LibraryEntry[];
    pontes: Ponte[];
    activeProbes: ReconProbe[];
    onNavigate: (tab: string) => void;
}

const AlertCenter: React.FC<AlertCenterProps> = ({ 
    alchemyState, 
    libraryEntries = [], 
    pontes = [], 
    activeProbes = [], 
    onNavigate 
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const alerts = useMemo(() => {
        const generatedAlerts: AlertItem[] = [];

        if (alchemyState?.rsiMap) {
            Object.entries(alchemyState.rsiMap).forEach(([coinId, rsi]: [string, any]) => {
                if (rsi < 30) {
                    generatedAlerts.push({
                        id: `fin-buy-${coinId}`,
                        type: 'finance',
                        title: 'Oportunidade',
                        message: `${coinId.toUpperCase()} em RSI ${rsi.toFixed ? rsi.toFixed(1) : rsi}.`,
                        targetTab: 'cofre',
                        severity: 'medium',
                        icon: '💰'
                    });
                }
            });
        }

        const lastEntry = (libraryEntries || [])[libraryEntries.length - 1];
        if (lastEntry) {
            generatedAlerts.push({
                id: `gaia-new-${lastEntry.id}`,
                type: 'knowledge',
                title: 'Conhecimento',
                message: `Dossiê "${lastEntry.title}" indexado.`,
                targetTab: 'gaia',
                severity: 'low',
                icon: '🌿'
            });
        }

        (pontes || []).forEach(p => {
            if (p.status === 'offline') {
                generatedAlerts.push({
                    id: `infra-down-${p.nome}`,
                    type: 'infra',
                    title: 'Falha Crítica',
                    message: `${p.nome} perdeu sinal.`,
                    targetTab: 'comando',
                    severity: 'high',
                    icon: '🛡️'
                });
            }
        });

        return generatedAlerts;
    }, [alchemyState, libraryEntries, pontes]);

    if (alerts.length === 0) return null;

    return (
        <div className="w-full mb-0 transition-all duration-500 ease-in-out relative z-20">
            {/* BARRA MINIMIZADA */}
            {!isExpanded ? (
                <button 
                    onClick={() => setIsExpanded(true)}
                    className="w-full h-8 bg-zinc-900/60 border border-emerald-500/30 rounded-lg flex items-center justify-between px-4 hover:bg-emerald-900/20 transition-colors group animate-fade-in"
                >
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Córtex de Alerta Nexus</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">{alerts.length} Insights Ativos</span>
                        <span className="text-zinc-600 text-xs group-hover:text-emerald-400">▼</span>
                    </div>
                </button>
            ) : (
                /* ESTADO EXPANDIDO */
                <div className="absolute top-0 left-0 w-full z-30 bg-zinc-900/90 border border-emerald-500/50 rounded-xl p-3 shadow-2xl backdrop-blur-md animate-fade-in">
                    <div className="flex justify-between items-center mb-3 border-b border-emerald-900/30 pb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">🧠</span>
                            <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Análise de Malha em Tempo Real</h4>
                        </div>
                        <button onClick={() => setIsExpanded(false)} className="text-zinc-500 hover:text-white p-1 text-xs">▲ Recolher</button>
                    </div>
                    
                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                        {alerts.map((alert) => (
                            <button
                                key={alert.id}
                                onClick={() => { onNavigate(alert.targetTab); setIsExpanded(false); }}
                                className={`flex-shrink-0 w-64 p-3 rounded-lg border backdrop-blur-sm transition-all text-left group
                                    ${alert.severity === 'high' ? 'bg-red-950/20 border-red-500/30' : 'bg-emerald-950/20 border-emerald-500/30'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-lg">{alert.icon}</span>
                                    <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full uppercase bg-black/40 text-zinc-400`}>
                                        {alert.type}
                                    </span>
                                </div>
                                <h4 className="text-[11px] font-bold text-white group-hover:text-emerald-300 transition-colors">{alert.title}</h4>
                                <p className="text-[10px] text-zinc-400 leading-tight truncate">{alert.message}</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlertCenter;
