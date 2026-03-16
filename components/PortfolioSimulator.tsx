
import React, { useRef, useEffect, useState } from 'react';
import { MarketData } from './MarketOracle';
import AssetSelectorModal from './AssetSelectorModal';

interface PortfolioSimulatorProps {
    marketData: MarketData[];
    alchemyState: any; // Recebe o estado completo (incluindo sentimentMap)
}

const PortfolioSimulator: React.FC<PortfolioSimulatorProps> = ({ marketData, alchemyState }) => {
    // Desestrutura o estado recebido
    const { 
        cash, 
        portfolioValue, 
        positions, 
        tradeHistory, 
        rsiMap,
        smaMap,
        sentimentMap, 
        isRunning, 
        setIsRunning, 
        reset,
        watchlist,
        updateWatchlist
    } = alchemyState;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) + ' SOS';

    // Auto-scroll logs
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [tradeHistory]);

    const getRsiColor = (rsi: number) => {
        if (rsi <= 30) return 'text-green-400 font-bold animate-pulse'; // Compra
        if (rsi >= 70) return 'text-red-400 font-bold animate-pulse'; // Venda
        return 'text-zinc-500'; // Neutro
    };

    const getSentimentIcon = (sentiment: string) => {
        if (sentiment === 'Positive') return '🟢';
        if (sentiment === 'Negative') return '🔴';
        return '⚪';
    };

    return (
        <div className="bg-zinc-800/50 border border-purple-700/50 rounded-xl p-6 shadow-lg shadow-purple-900/20 backdrop-blur-sm flex flex-col h-full relative overflow-hidden">
             <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg shadow-sm z-10 flex items-center gap-2">
                <span>MODO: TENDÊNCIA + RSI + INTEL</span>
                {isRunning && <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>}
            </div>
            
            <AssetSelectorModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                marketData={marketData}
                currentWatchlist={watchlist}
                onConfirm={updateWatchlist}
            />

            {/* Cabeçalho */}
            <div className="flex items-center gap-3 mb-6 border-b border-purple-800/50 pb-4">
                <span className="text-2xl">🧙‍♂️</span>
                <div>
                    <h3 className="text-xl font-bold text-purple-300">O Alquimista (Auto-Trader)</h3>
                    <p className="text-zinc-400 text-xs">Estratégia: RSI + SMA50 + Sentimento de Mercado</p>
                </div>
            </div>

            {/* Placar Principal e Controle de Risco */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-black/40 rounded-lg p-3 border border-purple-900/50 flex flex-col justify-center">
                    <p className="text-zinc-500 text-[10px] uppercase font-bold">Patrimônio</p>
                    <p className={`text-lg font-bold font-mono truncate ${portfolioValue >= 10000000 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(portfolioValue)}
                    </p>
                </div>
                <div className="bg-black/40 rounded-lg p-3 border border-purple-900/50 flex flex-col justify-center">
                    <p className="text-zinc-500 text-[10px] uppercase font-bold">Caixa Livre</p>
                    <p className="text-lg font-bold font-mono text-purple-300 truncate">
                        {formatCurrency(cash)}
                    </p>
                </div>
            </div>

            {/* Controles */}
            <div className="flex gap-3 mb-6">
                <button
                    onClick={() => {
                        if (watchlist.length === 0) {
                            setIsModalOpen(true);
                        } else {
                            setIsRunning(!isRunning);
                        }
                    }}
                    className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all shadow-lg ${
                        watchlist.length === 0 
                            ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-900/30'
                            : isRunning 
                                ? 'bg-red-600/80 text-white hover:bg-red-500 shadow-red-900/30' 
                                : 'bg-green-600/80 text-white hover:bg-green-500 shadow-green-900/30'
                    }`}
                >
                    {watchlist.length === 0 ? '🎯 SELECIONAR ALVOS PARA INICIAR' : (isRunning ? 'PARAR ESTRATÉGIA' : 'INICIAR SIMULAÇÃO')}
                </button>
                
                {watchlist.length > 0 && !isRunning && (
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-zinc-700 text-white rounded-lg font-bold text-xs hover:bg-zinc-600 transition-colors border border-zinc-600"
                        title="Editar Watchlist"
                    >
                        EDITAR ALVOS
                    </button>
                )}

                 <button
                    onClick={reset}
                    className="px-4 py-2 bg-zinc-700 text-zinc-300 rounded-lg font-bold text-xs hover:bg-zinc-600 transition-colors"
                    title="Resetar Portfólio"
                >
                    ↺
                </button>
            </div>

            {/* Posições Ativas e Watchlist */}
            <div className="flex-grow overflow-hidden flex flex-col mb-4">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Watchlist Ativa & Posições</h4>
                    <span className="text-[10px] text-zinc-500">{watchlist.length} Ativos Monitorados</span>
                </div>
                
                <div className="overflow-y-auto flex-grow bg-black/20 rounded-lg border border-purple-900/30">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-purple-900/20 sticky top-0">
                            <tr className="text-[10px] text-purple-300 uppercase">
                                <th className="p-2">Ativo</th>
                                <th className="p-2 text-center" title="Sentimento do Mercado">Humor</th>
                                <th className="p-2 text-right">RSI (14)</th>
                                <th className="p-2 text-right">SMA (50)</th>
                                <th className="p-2 text-right">Qtd</th>
                                <th className="p-2 text-right">P/L %</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs">
                            {marketData.filter(coin => watchlist.includes(coin.id)).map(coin => {
                                const pos = positions.find((p: any) => p.coinId === coin.id);
                                const rsi = rsiMap[coin.id] || 50;
                                const sma = smaMap[coin.id] || 0;
                                const sentiment = sentimentMap[coin.id] || 'Neutral';
                                const plPercent = pos ? ((coin.current_price - pos.averagePrice) / pos.averagePrice) * 100 : 0;
                                const trendColor = coin.current_price >= sma ? 'text-green-400' : 'text-red-400';

                                return (
                                    <tr key={coin.id} className={`border-b border-purple-900/10 hover:bg-purple-900/10 ${pos ? 'bg-purple-900/20' : ''}`}>
                                        <td className="p-2 font-bold text-zinc-300 flex items-center gap-2">
                                            {pos && <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>}
                                            {coin.symbol.toUpperCase()}
                                        </td>
                                        <td className="p-2 text-center text-lg" title={`Sentimento: ${sentiment}`}>
                                            {getSentimentIcon(sentiment)}
                                        </td>
                                        <td className={`p-2 text-right font-mono ${getRsiColor(rsi)}`}>
                                            {rsi.toFixed(1)}
                                        </td>
                                        <td className={`p-2 text-right font-mono ${trendColor}`}>
                                            {sma > 0 ? sma.toFixed(2) : '-'}
                                        </td>
                                        <td className="p-2 text-right font-mono">
                                            {pos ? pos.amount.toFixed(4) : '-'}
                                        </td>
                                        <td className={`p-2 text-right font-bold ${plPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {pos ? `${plPercent > 0 ? '+' : ''}${plPercent.toFixed(2)}%` : '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                            {watchlist.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-6 text-center text-zinc-500 italic">
                                        <p>Nenhum alvo selecionado.</p>
                                        <p className="text-[10px] mt-1">Clique em "SELECIONAR ALVOS" para configurar sua estratégia.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Log de Atividades (Terminal) */}
            <div className="h-24 bg-black/80 rounded-lg p-2 font-mono text-[10px] overflow-y-auto border border-purple-900/50" ref={scrollRef}>
                {tradeHistory.length === 0 ? (
                    <p className="text-zinc-600">&gt; Alquimista aguardando ordens.</p>
                ) : (
                    tradeHistory.map((log: any) => (
                        <div key={log.id} className="mb-1 border-b border-white/5 pb-1">
                            <span className="text-zinc-500">[{log.timestamp.toLocaleTimeString()}]</span>{' '}
                            <span className={log.type === 'BUY' ? 'text-blue-400 font-bold' : 'text-orange-400 font-bold'}>{log.type}</span>{' '}
                            <span className="text-white">{log.symbol}</span>{' '}
                            <span className="text-zinc-300">@ {formatCurrency(log.price)}</span>
                            {/* Mostra o valor total da operação */}
                            <span className="text-zinc-400 ml-1">({formatCurrency(log.totalValue)})</span>
                            <span className="text-zinc-500 ml-2">| {log.reason}</span>
                            {log.profit !== undefined && (
                                <span className={`block text-right ${log.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    Lucro: {log.profit >= 0 ? '+' : ''}{formatCurrency(log.profit)}
                                </span>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PortfolioSimulator;
