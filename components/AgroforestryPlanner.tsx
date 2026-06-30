
import React, { useState } from 'react';
import { invokeActiveAgent } from '../services/agentRouter';
import { useAgent } from '../contexts/AgentContext';

const PLANTS = [
    { id: 'milho', name: 'Milho', type: 'Placenta I', icon: '🌽' },
    { id: 'feijao', name: 'Feijão', type: 'Placenta I', icon: '🫘' },
    { id: 'abobora', name: 'Abóbora', type: 'Placenta I', icon: '🎃' },
    { id: 'mandioca', name: 'Mandioca', type: 'Placenta II', icon: '🥔' },
    { id: 'banana', name: 'Banana', type: 'Secundária I', icon: '🍌' },
    { id: 'mamao', name: 'Mamão', type: 'Secundária I', icon: '🥭' },
    { id: 'eucalipto', name: 'Eucalipto', type: 'Energética', icon: '🌲' },
    { id: 'citricos', name: 'Cítricos', type: 'Secundária II', icon: '🍋' },
    { id: 'cafe', name: 'Café', type: 'Secundária III', icon: '☕' },
    { id: 'cacau', name: 'Cacau', type: 'Clímax', icon: '🍫' }
];

const AgroforestryPlanner: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [selectedPlants, setSelectedPlants] = useState<string[]>([]);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const togglePlant = (id: string) => {
        setSelectedPlants(prev => 
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const { activeAgentId } = useAgent();

    const analyzeConsortium = async () => {
        if (selectedPlants.length === 0) return;

        setIsLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            const selectedNames = selectedPlants.map(id => PLANTS.find(p => p.id === id)?.name).join(', ');

            const prompt = `Como um especialista em agricultura sintrópica e permacultura, analise a seguinte combinação de plantas para um consórcio: [${selectedNames}]. 
            Forneça:
            1. Análise da Estratificação (quem ocupa qual andar: baixo, médio, alto, emergente).
            2. Benefícios de Ciclagem de Nutrientes e Sombra.
            3. Potenciais conflitos de sucessão temporal.
            4. Sugestão de 2 espécies adicionais para fechar o sistema.
            Formate em Markdown claro e inspirador.`;

            const text = await invokeActiveAgent(prompt, activeAgentId);

            setAnalysis(text || "Falha ao sintetizar o consórcio.");
        } catch (err: any) {
            setError(`Interferência na comunicação com Gaia: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in text-slate-200">
            <header className="flex justify-between items-center mb-6 border-b border-emerald-800/30 pb-4">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-emerald-400 transition-colors">←</button>
                    <div>
                        <h3 className="text-xl font-bold text-emerald-300 uppercase tracking-widest">Semeador Sintrópico 🌿</h3>
                        <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-tighter">Planejamento de Consórcios Inteligentes</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow overflow-hidden">
                {/* SELEÇÃO */}
                <div className="bg-zinc-900/60 border border-emerald-900/40 rounded-2xl p-6 flex flex-col overflow-hidden shadow-xl">
                    <h4 className="text-sm font-bold text-emerald-500 uppercase mb-4 border-b border-emerald-500/10 pb-2">Selecione as Espécies</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto pr-2 custom-scrollbar">
                        {PLANTS.map(plant => (
                            <button
                                key={plant.id}
                                onClick={() => togglePlant(plant.id)}
                                className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1 group
                                    ${selectedPlants.includes(plant.id) 
                                        ? 'bg-emerald-600 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-105' 
                                        : 'bg-black/40 border-zinc-800 text-zinc-400 hover:border-emerald-700'}`}
                            >
                                <span className="text-2xl group-hover:scale-110 transition-transform">{plant.icon}</span>
                                <span className={`text-[10px] font-bold ${selectedPlants.includes(plant.id) ? 'text-white' : 'text-zinc-400'}`}>{plant.name}</span>
                                <span className="text-[7px] uppercase tracking-tighter opacity-60">{plant.type}</span>
                            </button>
                        ))}
                    </div>
                    
                    <button
                        onClick={analyzeConsortium}
                        disabled={selectedPlants.length === 0 || isLoading}
                        className="mt-6 w-full py-4 bg-gradient-to-r from-emerald-700 to-emerald-900 hover:from-emerald-600 hover:to-emerald-800 text-white font-black rounded-2xl shadow-xl transition-all disabled:opacity-50 uppercase tracking-widest text-xs"
                    >
                        {isLoading ? 'SINCRONIZANDO COM GAIA...' : `ANALISAR CONSÓRCIO (${selectedPlants.length})`}
                    </button>
                </div>

                {/* RESULTADO */}
                <div className="bg-black/40 border border-emerald-900/20 rounded-2xl p-6 overflow-y-auto custom-scrollbar shadow-inner relative min-h-[400px]">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <span className="text-8xl">🥗</span>
                    </div>
                    
                    {!analysis && !isLoading && !error && (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30 px-10">
                            <span className="text-5xl mb-4">🌱</span>
                            <p className="text-sm italic">Selecione as plantas ao lado para ver como a vida se organiza através da cooperação.</p>
                        </div>
                    )}

                    {isLoading && (
                        <div className="h-full flex flex-col items-center justify-center">
                            <svg className="w-12 h-12 text-emerald-500 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3-7.938l3-2.647z"></path></svg>
                            <p className="text-emerald-400 mt-4 font-mono text-xs animate-pulse">PROCESSANDO BIOMASSA DIGITAL...</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-900/20 border border-red-700/50 p-4 rounded-xl text-red-400 text-xs">
                            {error}
                        </div>
                    )}

                    {analysis && (
                        <div className="prose prose-invert prose-emerald max-w-none animate-fade-in">
                            <div className="flex items-center gap-2 mb-4 border-b border-emerald-500/20 pb-2">
                                <span className="text-emerald-500">✨</span>
                                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Relatório de Inteligência Sintrópica</h4>
                            </div>
                            <div className="text-zinc-300 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AgroforestryPlanner;
