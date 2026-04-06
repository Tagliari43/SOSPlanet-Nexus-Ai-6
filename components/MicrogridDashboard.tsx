
import React, { useState, useEffect, useMemo } from 'react';

type OperationMode = 'autoconsumo' | 'economia' | 'backup';

const ModeButton = ({ targetMode, label, icon, currentMode, setMode }: { targetMode: OperationMode, label: string, icon: string, currentMode: OperationMode, setMode: (mode: OperationMode) => void }) => (
    <button 
        onClick={() => setMode(targetMode)}
        className={`flex-1 py-3 px-2 rounded-lg border font-bold text-[10px] transition-all flex flex-col items-center gap-1
            ${currentMode === targetMode 
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-105' 
                : 'bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:border-emerald-800'}`}
    >
        <span className="text-lg">{icon}</span>
        {label}
    </button>
);

const MicrogridDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    // Estados de Simulação
    const [generation, setGeneration] = useState(1.2);
    const [consumption, setConsumption] = useState(0.8);
    const [battery, setBattery] = useState(75);
    const [mode, setMode] = useState<OperationMode>('autoconsumo');
    const [isGridDown, setIsGridDown] = useState(false);
    const [energyPrice, setEnergyPrice] = useState(0.45); // USD/kWh

    // Estados de Fluxo (Calculados para o Visual)
    const [flowDirections, setFlowDirections] = useState({
        solarToHub: true,
        hubToHouse: true,
        hubToBattery: 0, // 0: parado, 1: carregando, -1: descarregando
        hubToGrid: 0    // 0: parado, 1: exportando, -1: importando
    });

    // Simulação de Preço de Energia (muda a cada 10s para o protótipo)
    useEffect(() => {
        const interval = setInterval(() => {
            setEnergyPrice(prev => +(0.20 + Math.random() * 0.80).toFixed(2));
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    // LÓGICA MESTRE DE ENERGIA
    useEffect(() => {
        const interval = setInterval(() => {
            // 1. Variação base de Geração e Consumo
            const newGen = Math.max(0.1, +(generation + (Math.random() * 0.2 - 0.1)).toFixed(2));
            const newCons = Math.max(0.4, +(consumption + (Math.random() * 0.1 - 0.05)).toFixed(2));
            setGeneration(newGen);
            setConsumption(newCons);

            let currentBattery = battery;
            let currentFlows = { solarToHub: newGen > 0, hubToHouse: true, hubToBattery: 0, hubToGrid: 0 };

            // 2. Lógica Baseada no Modo
            if (isGridDown) {
                // MODO ILHADO (Emergência)
                const diff = newGen - newCons;
                if (diff >= 0) {
                    currentBattery = Math.min(100, currentBattery + (diff * 0.1));
                    currentFlows.hubToBattery = 1;
                } else {
                    currentBattery = Math.max(0, currentBattery + (diff * 0.1));
                    currentFlows.hubToBattery = -1;
                }
                currentFlows.hubToGrid = 0;
            } else {
                switch (mode) {
                    case 'autoconsumo':
                        const acDiff = newGen - newCons;
                        if (acDiff > 0) {
                            if (currentBattery < 100) {
                                currentBattery = Math.min(100, currentBattery + (acDiff * 0.1));
                                currentFlows.hubToBattery = 1;
                            } else {
                                currentFlows.hubToGrid = 1; // Exporta excedente
                            }
                        } else {
                            if (currentBattery > 0) {
                                currentBattery = Math.max(0, currentBattery + (acDiff * 0.1));
                                currentFlows.hubToBattery = -1;
                            } else {
                                currentFlows.hubToGrid = -1; // Importa o que falta
                            }
                        }
                        break;

                    case 'economia':
                        const isPriceHigh = energyPrice > 0.60;
                        if (isPriceHigh) {
                            // Preço Alto: Usar bateria ao máximo para evitar a rede
                            const ecoDiff = newGen - newCons;
                            if (currentBattery > 5) {
                                currentBattery = Math.max(5, currentBattery + (ecoDiff * 0.1));
                                currentFlows.hubToBattery = -1;
                            } else {
                                currentFlows.hubToGrid = -1;
                            }
                        } else {
                            // Preço Baixo: Carregar bateria da rede/solar
                            currentBattery = Math.min(100, currentBattery + 0.5);
                            currentFlows.hubToBattery = 1;
                            currentFlows.hubToGrid = -1;
                        }
                        break;

                    case 'backup':
                        // Prioridade 1: Manter 100%
                        if (currentBattery < 100) {
                            currentBattery = Math.min(100, currentBattery + 0.8);
                            currentFlows.hubToBattery = 1;
                            currentFlows.hubToGrid = -1;
                        } else {
                            // Atendido pela rede/solar
                            const bDiff = newGen - newCons;
                            currentFlows.hubToGrid = bDiff > 0 ? 1 : -1;
                        }
                        break;
                }
            }

            setBattery(+currentBattery.toFixed(1));
            setFlowDirections(currentFlows);
        }, 3000);
        return () => clearInterval(interval);
    }, [generation, consumption, battery, mode, isGridDown, energyPrice]);

    const exportValue = flowDirections.hubToGrid !== 0 ? +(generation - consumption).toFixed(2) : 0;

    return (
        <div className="flex flex-col h-full animate-fade-in text-slate-200">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-emerald-800/30 pb-4 gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-emerald-400 transition-colors">←</button>
                    <div>
                        <h3 className="text-xl font-bold text-emerald-300">Comando Aurora ⚡</h3>
                        <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-tighter">Soberania Energética Ativa</p>
                    </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <ModeButton targetMode="autoconsumo" label="AUTOCONSUMO" icon="🏠" currentMode={mode} setMode={setMode} />
                    <ModeButton targetMode="economia" label="ECONOMIA" icon="💰" currentMode={mode} setMode={setMode} />
                    <ModeButton targetMode="backup" label="BACKUP" icon="🛡️" currentMode={mode} setMode={setMode} />
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
                {/* Coluna Central: O Diagrama */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="relative bg-black/40 border border-emerald-900/30 rounded-2xl p-6 min-h-[400px] flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
                        
                        {/* SVG de Conexões Dinâmicas */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                            {/* Solar -> Hub */}
                            <path d="M 200 100 L 400 200" stroke={flowDirections.solarToHub ? "#10b981" : "#1f2937"} strokeWidth="2" strokeDasharray="5,5" className={flowDirections.solarToHub ? "animate-[dash_2s_linear_infinite]" : ""} />
                            {/* Hub -> House */}
                            <path d="M 400 200 L 600 100" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5" className="animate-[dash_2s_linear_infinite]" />
                            {/* Hub <-> Battery */}
                            <path d="M 400 200 L 400 350" stroke={flowDirections.hubToBattery !== 0 ? "#eab308" : "#1f2937"} strokeWidth="3" strokeDasharray="5,5" className={flowDirections.hubToBattery !== 0 ? (flowDirections.hubToBattery > 0 ? "animate-[dash_2s_linear_infinite]" : "animate-[dash_2s_linear_infinite_reverse]") : ""} />
                            {/* Hub <-> Grid */}
                            <path d="M 400 200 L 200 350" stroke={isGridDown ? "#ef4444" : (flowDirections.hubToGrid !== 0 ? "#94a3b8" : "#1f2937")} strokeWidth="2" strokeDasharray="5,5" className={!isGridDown && flowDirections.hubToGrid !== 0 ? (flowDirections.hubToGrid > 0 ? "animate-[dash_2s_linear_infinite]" : "animate-[dash_2s_linear_infinite_reverse]") : ""} />
                        </svg>

                        <div className="relative z-10 w-full h-full grid grid-cols-3 grid-rows-3 gap-4 items-center justify-items-center">
                            {/* Painéis */}
                            <div className="row-start-1 col-start-1 flex flex-col items-center gap-1">
                                <div className="w-14 h-14 bg-emerald-900/20 rounded-full border border-emerald-500/50 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(16,185,129,0.2)]">☀️</div>
                                <span className="text-[10px] font-bold text-emerald-500">{generation} kW</span>
                            </div>

                            {/* Consumo */}
                            <div className="row-start-1 col-start-3 flex flex-col items-center gap-1">
                                <div className="w-14 h-14 bg-blue-900/20 rounded-full border border-blue-500/50 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(59,130,246,0.2)]">🏠</div>
                                <span className="text-[10px] font-bold text-blue-500">{consumption} kW</span>
                            </div>

                            {/* HUB CENTRAL */}
                            <div className="row-start-2 col-start-2">
                                <div className={`w-24 h-24 bg-zinc-900 rounded-3xl border-2 flex items-center justify-center relative transition-all duration-500 ${isGridDown ? 'border-red-500 shadow-red-900/40' : 'border-emerald-500 shadow-emerald-900/40'}`}>
                                    <span className="text-3xl animate-pulse">⚡</span>
                                    <div className="absolute -top-3 bg-zinc-800 px-2 py-0.5 rounded text-[8px] border border-emerald-500/30 text-emerald-400 font-bold uppercase">Nexus Core</div>
                                </div>
                            </div>

                            {/* Rede Elétrica */}
                            <div className="row-start-3 col-start-1 flex flex-col items-center gap-1">
                                <div className={`w-14 h-14 rounded-full border flex items-center justify-center text-2xl transition-all ${isGridDown ? 'bg-red-900/20 border-red-500 grayscale' : 'bg-slate-900/20 border-slate-500/50'}`}>🏢</div>
                                <span className={`text-[10px] font-bold ${isGridDown ? 'text-red-500' : 'text-slate-400'}`}>
                                    {isGridDown ? 'OFFLINE' : (flowDirections.hubToGrid > 0 ? `+${Math.abs(exportValue)}` : `-${Math.abs(exportValue)}`)} kW
                                </span>
                            </div>

                            {/* Bateria */}
                            <div className="row-start-3 col-start-2 flex flex-col items-center gap-1 mt-4">
                                <div className="w-20 h-10 bg-zinc-900 border border-yellow-600/50 rounded-md relative overflow-hidden">
                                    <div className={`absolute inset-y-0 left-0 bg-yellow-500/40 transition-all duration-1000 ${flowDirections.hubToBattery > 0 ? 'animate-pulse' : ''}`} style={{width: `${battery}%`}}></div>
                                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-yellow-400">{battery}%</div>
                                </div>
                                <span className="text-[9px] font-bold text-yellow-600 uppercase tracking-tighter">Bateria Sólida</span>
                            </div>
                        </div>
                    </div>

                    {/* Gráficos / Métricas Inferiores */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">Preço da Energia (Rede)</p>
                            <div className="flex items-end gap-2">
                                <span className={`text-2xl font-mono font-bold ${energyPrice > 0.60 ? 'text-red-400' : 'text-emerald-400'}`}>${energyPrice}</span>
                                <span className="text-zinc-600 text-[10px] mb-1">/ kWh</span>
                            </div>
                        </div>
                        <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
                            <div>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Status da Grade</p>
                                <p className={`text-xs font-bold ${isGridDown ? 'text-red-500' : 'text-emerald-500'}`}>{isGridDown ? 'MODO ILHADO' : 'CONECTADO'}</p>
                            </div>
                            <button 
                                onClick={() => setIsGridDown(!isGridDown)}
                                className={`px-4 py-2 rounded-lg text-[9px] font-bold transition-all ${isGridDown ? 'bg-emerald-600 text-white' : 'bg-red-900/40 text-red-400 border border-red-900/50 hover:bg-red-900/60'}`}
                            >
                                {isGridDown ? 'RESTAURAR REDE' : 'CORTAR ENERGIA'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Coluna Lateral: Insights e Controle de Venda */}
                <div className="flex flex-col gap-6">
                    <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-4 flex-grow">
                        <h4 className="text-xs font-bold text-emerald-400 uppercase mb-4 border-b border-emerald-500/10 pb-2">Veredito do Nexus</h4>
                        <div className="space-y-4">
                            <div className="bg-black/30 p-3 rounded-lg">
                                <p className="text-[11px] text-zinc-300 leading-relaxed italic">
                                    {isGridDown 
                                        ? "Sistemas em modo crítico. Priorizando cargas vitais. Bateria está suprindo o déficit de geração." 
                                        : mode === 'economia' 
                                            ? (energyPrice > 0.60 ? "Preço de rede elevado. Descarregando bateria para otimizar custos." : "Energia barata detectada. Sincronizando carga de bateria via rede.")
                                            : "Operação nominal. Equilíbrio de carga estável."}
                                </p>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <p className="text-[9px] text-zinc-500 font-bold uppercase">Estimativa Financeira (24h)</p>
                                <div className="flex justify-between text-xs">
                                    <span className="text-zinc-400">Gasto Evitado:</span>
                                    <span className="text-emerald-400 font-mono">+$4.20</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-zinc-400">Venda P2P:</span>
                                    <span className="text-blue-400 font-mono">+$1.15</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase mb-3">Limites de Carga</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-zinc-500">Reserva de Segurança</span>
                                <span className="text-white font-bold">20%</span>
                            </div>
                            <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full w-[20%]"></div>
                            </div>
                            <p className="text-[9px] text-zinc-600 leading-tight">O Nexus manterá esta carga mínima mesmo no modo Economia para prevenir quedas.</p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes dash {
                    to { stroke-dashoffset: -20; }
                }
                .animate-dash {
                    animation: dash 2s linear infinite;
                }
                .animate-dash-reverse {
                    animation: dash 2s linear infinite reverse;
                }
            `}</style>
        </div>
    );
};

export default MicrogridDashboard;
