import React from 'react';

// Interface compartilhada (poderia estar em um arquivo de tipos, mas mantendo aqui por simplicidade)
export interface MarketData {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    price_change_percentage_24h: number | null;
    market_cap: number;
}

interface MarketOracleProps {
    data: MarketData[];
    isLoading: boolean;
    lastUpdate: Date | null;
    error: string | null;
    onRefresh: () => void;
}

const MarketOracle: React.FC<MarketOracleProps> = ({ data, isLoading, lastUpdate, error, onRefresh }) => {

    const formatCurrency = (value: number) => {
        if (value === null || value === undefined) return '-';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    const formatPercentage = (value: number | null) => {
        if (value === null || value === undefined) return '-';
        return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
    };

    return (
        <div className="bg-zinc-800/50 border border-emerald-700/50 rounded-xl p-6 shadow-lg shadow-emerald-900/20 backdrop-blur-sm flex flex-col h-full">
            <div className="flex justify-between items-center mb-4 border-b border-emerald-800/50 pb-4">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">👁️</span>
                    <div>
                        <h3 className="text-xl font-bold text-emerald-300">Oráculo de Mercado</h3>
                        <p className="text-zinc-400 text-xs">Olhos da Nação • Dados em Tempo Real</p>
                    </div>
                </div>
                <div className="text-right">
                    <button 
                        onClick={onRefresh} 
                        disabled={isLoading}
                        className="text-xs bg-emerald-900/30 hover:bg-emerald-800/50 text-emerald-400 px-2 py-1 rounded border border-emerald-800 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Sincronizando...' : 'Atualizar'}
                    </button>
                    {lastUpdate && (
                        <p className="text-[10px] text-zinc-600 mt-1">
                            Última leitura: {lastUpdate.toLocaleTimeString()}
                        </p>
                    )}
                </div>
            </div>

            {error ? (
                <div className="bg-red-900/20 border border-red-800/50 p-4 rounded-lg text-center">
                    <p className="text-red-400 text-sm font-bold mb-1">Interferência no Sinal</p>
                    <p className="text-red-300/70 text-xs">{error}</p>
                    <button 
                        onClick={onRefresh}
                        className="mt-3 text-xs underline text-red-400 hover:text-red-300"
                    >
                        Tentar reconectar
                    </button>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs text-zinc-500 uppercase border-b border-zinc-700/50">
                                <th className="py-2 pl-2 font-medium">Ativo</th>
                                <th className="py-2 font-medium text-right">Preço (USD)</th>
                                <th className="py-2 font-medium text-right">24h %</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {isLoading && data.length === 0 ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="py-3 pl-2"><div className="h-4 bg-zinc-700 rounded w-24"></div></td>
                                        <td className="py-3 text-right"><div className="h-4 bg-zinc-700 rounded w-16 ml-auto"></div></td>
                                        <td className="py-3 text-right"><div className="h-4 bg-zinc-700 rounded w-12 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : (
                                data.map((coin) => (
                                    <tr key={coin.id} className="border-b border-zinc-800/50 hover:bg-zinc-700/30 transition-colors group">
                                        <td className="py-3 pl-2 flex items-center gap-2">
                                            <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full opacity-80 group-hover:opacity-100 transition-opacity" />
                                            <div>
                                                <span className="font-bold text-emerald-100 block leading-none">{coin.symbol.toUpperCase()}</span>
                                                <span className="text-[10px] text-zinc-500 hidden sm:block">{coin.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 text-right font-mono text-emerald-300">
                                            {formatCurrency(coin.current_price)}
                                        </td>
                                        <td className={`py-3 text-right font-mono font-bold ${!coin.price_change_percentage_24h || coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {formatPercentage(coin.price_change_percentage_24h)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            
            <div className="mt-auto pt-2 border-t border-emerald-800/30 flex justify-between items-center">
                <p className="text-[10px] text-zinc-600">Dados fornecidos via CoinGecko API</p>
                <div className="flex gap-1">
                    <span className="block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="block w-1.5 h-1.5 rounded-full bg-green-500/50 animate-pulse delay-75"></span>
                    <span className="block w-1.5 h-1.5 rounded-full bg-green-500/20 animate-pulse delay-150"></span>
                </div>
            </div>
        </div>
    );
};

export default MarketOracle;