
import React, { useState, useEffect } from 'react';
import { Ponte } from '../services/sovereignRouterService';
import { 
    isNineRouterModeEnabled, 
    setNineRouterMode, 
    getNineRouterUrl, 
    setNineRouterUrl,
    checkNineRouterHealth 
} from '../services/nineRouterService';

interface RouterPanelProps {
    pontes: Ponte[];
}

const RouterPanel: React.FC<RouterPanelProps> = ({ pontes = [] }) => {
    const [nineRouterActive, setNineRouterActive] = useState(isNineRouterModeEnabled());
    const [nineRouterUrl, setNineRouterUrlState] = useState(getNineRouterUrl());
    const [isOnline9R, setIsOnline9R] = useState<boolean | null>(null);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const updateStatus = () => {
            const active = isNineRouterModeEnabled();
            if (isMounted) setNineRouterActive(active);
            checkNineRouterHealth().then(status => {
                if (isMounted) setIsOnline9R(status);
            });
        };

        updateStatus();
        const interval = setInterval(updateStatus, 10000);

        const handleSync = () => {
            updateStatus();
        };
        window.addEventListener('9router-mode-change', handleSync);

        return () => {
            isMounted = false;
            clearInterval(interval);
            window.removeEventListener('9router-mode-change', handleSync);
        };
    }, [nineRouterUrl]);

    const handleToggleNineRouter = () => {
        const next = !nineRouterActive;
        setNineRouterActive(next);
        setNineRouterMode(next);
    };

    const handleSaveUrl = (e: React.FormEvent) => {
        e.preventDefault();
        setNineRouterUrl(nineRouterUrl);
        setShowSettings(false);
        checkNineRouterHealth().then(setIsOnline9R);
    };

    return (
        <div className="bg-zinc-800/50 border border-emerald-700/50 rounded-xl p-4 shadow-lg shadow-emerald-900/20 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-3 border-b-2 border-emerald-600/30 pb-2">
                <h2 className="text-xl font-bold text-emerald-400">Painel do Roteador 🛡️</h2>
                <button 
                    onClick={() => setShowSettings(!showSettings)} 
                    className="text-xs text-zinc-400 hover:text-emerald-300 font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700"
                    title="Configurar Túnel 9Router"
                >
                    ⚙️ 9Router
                </button>
            </div>

            {/* MODO LABORATÓRIO / 9ROUTER STATUS CARD */}
            <div className="mb-4 p-3 bg-black/40 border border-emerald-500/30 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-base">⚡</span>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-white">9Router / 9Remote Local</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                    isOnline9R 
                                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300' 
                                        : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                                }`}>
                                    {isOnline9R ? 'ONLINE' : 'OFFLINE / ESPERA'}
                                </span>
                            </div>
                            <p className="text-[10px] text-zinc-400 font-mono truncate max-w-[200px]">
                                {nineRouterUrl || 'Nenhum endpoint configurado'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={handleToggleNineRouter}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                            nineRouterActive 
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-900/40' 
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border-zinc-600'
                        }`}
                    >
                        {nineRouterActive ? 'ATIVO' : 'DESATIVADO'}
                    </button>
                </div>

                {showSettings && (
                    <form onSubmit={handleSaveUrl} className="mt-2 pt-2 border-t border-zinc-800 flex flex-col gap-2">
                        <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">URL do Túnel / Localhost</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={nineRouterUrl} 
                                onChange={e => setNineRouterUrlState(e.target.value)} 
                                placeholder="http://localhost:20128/v1 ou https://xxx.abc-tunnel.us/v1"
                                className="flex-grow bg-black border border-zinc-700 rounded px-2 py-1 text-xs text-emerald-300 font-mono"
                            />
                            <button type="submit" className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded">
                                Salvar
                            </button>
                        </div>
                    </form>
                )}
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
