import React, { useState } from 'react';
import { SentimentAnalysisResult } from '../services/geminiService';

interface MarketIntelProps {
    onAnalyze: (topic: string) => Promise<SentimentAnalysisResult | undefined>;
    sentimentMap: Record<string, 'Positive' | 'Neutral' | 'Negative'>;
}

const MarketIntel: React.FC<MarketIntelProps> = ({ onAnalyze, sentimentMap }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lastAnalysis, setLastAnalysis] = useState<SentimentAnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setIsLoading(true);
        setError(null);
        setLastAnalysis(null);

        try {
            const result = await onAnalyze(searchTerm);
            if (result) {
                setLastAnalysis(result);
            } else {
                setError("Não foi possível obter inteligência de mercado.");
            }
        } catch (err: any) {
            setError(err.message || "Erro desconhecido na análise.");
        } finally {
            setIsLoading(false);
        }
    };

    const getSentimentColor = (sentiment: string) => {
        if (sentiment === 'Positive') return 'text-green-400';
        if (sentiment === 'Negative') return 'text-red-400';
        return 'text-yellow-400';
    };

    const getSentimentBg = (sentiment: string) => {
        if (sentiment === 'Positive') return 'bg-green-500/20 border-green-500';
        if (sentiment === 'Negative') return 'bg-red-500/20 border-red-500';
        return 'bg-yellow-500/20 border-yellow-500';
    };

    return (
        <div className="bg-zinc-800/50 border border-blue-700/50 rounded-xl p-6 shadow-lg shadow-blue-900/20 backdrop-blur-sm h-full flex flex-col">
            <header className="mb-6 border-b border-blue-800/50 pb-4">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">📡</span>
                    <div>
                        <h3 className="text-xl font-bold text-blue-300">Inteligência de Mercado</h3>
                        <p className="text-zinc-400 text-xs">Análise de Sentimento & Notícias em Tempo Real</p>
                    </div>
                </div>
            </header>

            <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Pesquisar ativo (ex: Bitcoin, AI Tokens)..."
                    className="flex-grow bg-black/40 border border-blue-800/50 rounded-lg px-4 py-3 text-blue-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg disabled:bg-zinc-700 disabled:cursor-not-allowed transition-all"
                >
                    {isLoading ? 'Analisando...' : 'PESQUISAR'}
                </button>
            </form>

            <div className="flex-grow overflow-y-auto pr-2">
                {error && (
                    <div className="p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm mb-4">
                        {error}
                    </div>
                )}

                {lastAnalysis ? (
                    <div className="space-y-6 animate-fade-in">
                        {/* Cartão de Veredito */}
                        <div className={`p-6 rounded-xl border ${getSentimentBg(lastAnalysis.sentiment)}`}>
                            <p className="text-xs uppercase tracking-widest font-bold opacity-70 mb-1">Veredito do Alquimista</p>
                            <h2 className={`text-3xl font-bold ${getSentimentColor(lastAnalysis.sentiment)}`}>
                                {lastAnalysis.sentiment.toUpperCase()}
                            </h2>
                            <p className="mt-3 text-zinc-200 text-sm leading-relaxed">
                                {lastAnalysis.summary}
                            </p>
                        </div>

                        {/* Manchetes */}
                        <div>
                            <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-3">Manchetes Capturadas</h4>
                            <div className="space-y-3">
                                {lastAnalysis.news.map((item, idx) => (
                                    <a 
                                        key={idx} 
                                        href={item.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="block p-4 bg-zinc-900/50 border border-zinc-700/50 rounded-lg hover:border-blue-500/50 hover:bg-zinc-800 transition-all group"
                                    >
                                        <p className="font-bold text-zinc-300 group-hover:text-blue-300 transition-colors text-sm">
                                            {item.title}
                                        </p>
                                        <p className="text-[10px] text-zinc-600 mt-1 truncate">{item.uri}</p>
                                    </a>
                                ))}
                                {lastAnalysis.news.length === 0 && (
                                    <p className="text-zinc-500 italic text-sm">Nenhuma notícia específica encontrada, mas o sentimento foi inferido.</p>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 opacity-50">
                        <span className="text-4xl block mb-4 grayscale">📰</span>
                        <p className="text-zinc-400 text-sm">
                            Pesquise um tópico para ativar a rede neural de notícias.
                            <br/>
                            O Alquimista lerá as manchetes e determinará se é seguro operar.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarketIntel;