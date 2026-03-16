
import React, { useMemo } from 'react';
import { BinanceAsset } from '../services/binanceService';
import { MarketData } from './MarketOracle';

interface PortfolioDisplayProps {
    assets: BinanceAsset[];
    marketData: MarketData[];
    onDisconnect: () => void;
}

const PortfolioDisplay: React.FC<PortfolioDisplayProps> = ({ assets, marketData, onDisconnect }) => {
    
    const processedAssets = useMemo(() => {
        return assets.map(asset => {
            const amount = parseFloat(asset.free) + parseFloat(asset.locked);
            // Tenta encontrar o preço no oráculo. 
            // Nota: O símbolo na Binance (BTC) vs CoinGecko (bitcoin) requer um mapeamento simples ou busca pelo symbol.
            // Aqui assumimos uma busca pelo symbol no array do marketData.
            const marketInfo = marketData.find(m => m.symbol.toLowerCase() === asset.asset.toLowerCase());
            const price = marketInfo ? marketInfo.current_price : 0;
            const totalValue = amount * price;
            
            return {
                ...asset,
                amount,
                price,
                totalValue,
                marketInfo
            };
        }).sort((a, b) => b.totalValue - a.totalValue); // Ordena por valor total USD
    }, [assets, marketData]);

    const totalPortfolioValue = processedAssets.reduce((acc, curr) => acc + curr.totalValue, 0);

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    return (
        <div className="bg-zinc-800/50 border border-yellow-600/50 rounded-xl p-6 shadow-lg shadow-yellow-900/20 backdrop-blur-sm flex flex-col h-full relative overflow-hidden animate-fade-in">
             <div className="absolute top-0 right-0 bg-yellow-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg shadow-sm z-10 flex items-center gap-2">
                <span>BINANCE READ-ONLY</span>
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            </div>
            
            {/* Cabeçalho */}
            <div className="flex items-center justify-between mb-6 border-b border-yellow-800/50 pb-4">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🦁</span>
                    <div>
                        <h3 className="text-xl font-bold text-yellow-400">Carteira Real</h3>
                        <p className="text-zinc-400 text-xs">Dados Oficiais da Exchange</p>
                    </div>
                </div>
                <button 
                    onClick={onDisconnect}
                    className="text-xs text-red-400 hover:text-red-300 underline"
                >
                    Desconectar
                </button>
            </div>

            {/* Valor Total */}
            <div className="bg-black/40 rounded-lg p-4 border border-yellow-900/50 mb-6 text-center">
                <p className="text-zinc-500 text-xs uppercase tracking-widest">Patrimônio Total Estimado</p>
                <p className="text-3xl font-bold font-mono text-white mt-1">
                    {formatCurrency(totalPortfolioValue)}
                </p>
                <p className="text-[10px] text-zinc-600 mt-2">*Calculado com base nos preços do Oráculo de Mercado</p>
            </div>

            {/* Lista de Ativos */}
            <div className="flex-grow overflow-hidden flex flex-col">
                <h4 className="text-xs font-bold text-yellow-500 mb-2 uppercase tracking-wider">Ativos em Custódia</h4>
                <div className="overflow-y-auto flex-grow bg-black/20 rounded-lg border border-yellow-900/30">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-yellow-900/20 sticky top-0">
                            <tr className="text-[10px] text-yellow-200 uppercase">
                                <th className="p-3">Ativo</th>
                                <th className="p-3 text-right">Quantidade</th>
                                <th className="p-3 text-right">Preço (Oracle)</th>
                                <th className="p-3 text-right">Valor (USD)</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs">
                            {processedAssets.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-4 text-center text-zinc-500 italic">
                                        Nenhum saldo encontrado ou ativos desconhecidos.
                                    </td>
                                </tr>
                            ) : (
                                processedAssets.map(item => (
                                    <tr key={item.asset} className="border-b border-yellow-900/10 hover:bg-yellow-900/10 transition-colors">
                                        <td className="p-3 font-bold text-zinc-300 flex items-center gap-2">
                                            {item.asset}
                                        </td>
                                        <td className="p-3 text-right font-mono text-zinc-400">
                                            {parseFloat(item.amount.toFixed(6))}
                                        </td>
                                        <td className="p-3 text-right font-mono text-zinc-500">
                                            {item.price > 0 ? formatCurrency(item.price) : '-'}
                                        </td>
                                        <td className="p-3 text-right font-bold text-emerald-400">
                                            {item.totalValue > 0 ? formatCurrency(item.totalValue) : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PortfolioDisplay;
