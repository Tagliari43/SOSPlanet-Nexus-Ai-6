import React from 'react';
import { StrategyConfig } from '../hooks/useAlchemy';

interface AlchemistSettingsProps {
    config: StrategyConfig;
    onUpdate: (newConfig: StrategyConfig) => void;
}

const AlchemistSettings: React.FC<AlchemistSettingsProps> = ({ config, onUpdate }) => {
    
    const handleChange = (field: keyof StrategyConfig, value: number | boolean) => {
        onUpdate({
            ...config,
            [field]: value
        });
    };

    return (
        <div className="bg-zinc-800/80 border border-purple-600/50 rounded-xl p-4 shadow-lg mb-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4 border-b border-purple-800/50 pb-2">
                <h3 className="text-lg font-bold text-purple-300 flex items-center gap-2">
                    <span>⚙️</span> Configurações da Estratégia
                </h3>
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded border ${config.isRealMode ? 'bg-red-900/50 border-red-500 text-red-400' : 'bg-green-900/50 border-green-500 text-green-400'}`}>
                        {config.isRealMode ? 'MODO REAL (BLOQUEADO)' : 'MODO SIMULAÇÃO'}
                    </span>
                    <label className="relative inline-flex items-center cursor-not-allowed opacity-50" title="Modo Real desativado por segurança">
                        <input type="checkbox" className="sr-only peer" checked={config.isRealMode} disabled />
                        <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Capital Máximo */}
                <div className="bg-black/30 p-3 rounded-lg border border-purple-900/30">
                    <label className="text-[10px] text-zinc-400 uppercase font-bold block mb-2">Capital de Simulação ($)</label>
                    <input 
                        type="number" 
                        value={config.maxCapital}
                        onChange={(e) => handleChange('maxCapital', Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white text-sm focus:border-purple-500 focus:outline-none font-mono"
                    />
                </div>

                {/* Risco por Operação */}
                <div className="bg-black/30 p-3 rounded-lg border border-purple-900/30">
                    <div className="flex justify-between mb-2">
                        <label className="text-[10px] text-zinc-400 uppercase font-bold">Risco / Trade</label>
                        <span className="text-purple-400 text-xs font-bold">{config.riskPercentage}%</span>
                    </div>
                    <input 
                        type="range" 
                        min="1" 
                        max="20" 
                        value={config.riskPercentage}
                        onChange={(e) => handleChange('riskPercentage', Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                </div>

                {/* Parâmetros do RSI */}
                <div className="bg-black/30 p-3 rounded-lg border border-purple-900/30 flex gap-2">
                    <div className="flex-1">
                        <label className="text-[10px] text-green-400 uppercase font-bold block mb-1">RSI Compra</label>
                        <input 
                            type="number" 
                            value={config.rsiOversold}
                            onChange={(e) => handleChange('rsiOversold', Number(e.target.value))}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white text-sm focus:border-green-500 focus:outline-none font-mono text-center"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] text-red-400 uppercase font-bold block mb-1">RSI Venda</label>
                        <input 
                            type="number" 
                            value={config.rsiOverbought}
                            onChange={(e) => handleChange('rsiOverbought', Number(e.target.value))}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white text-sm focus:border-red-500 focus:outline-none font-mono text-center"
                        />
                    </div>
                </div>

                {/* Parâmetros da SMA */}
                <div className="bg-black/30 p-3 rounded-lg border border-purple-900/30">
                    <label className="text-[10px] text-zinc-400 uppercase font-bold block mb-2">Período Média Móvel (SMA)</label>
                    <div className="flex items-center gap-2">
                        <input 
                            type="number" 
                            value={config.smaPeriod}
                            onChange={(e) => handleChange('smaPeriod', Number(e.target.value))}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white text-sm focus:border-purple-500 focus:outline-none font-mono"
                        />
                        <span className="text-[10px] text-zinc-500">Horas</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AlchemistSettings;