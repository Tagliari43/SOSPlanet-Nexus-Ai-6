import React, { useState, useEffect } from 'react';
import { MarketData } from './MarketOracle';

interface AssetSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    marketData: MarketData[];
    currentWatchlist: string[];
    onConfirm: (selectedIds: string[]) => void;
}

const AssetSelectorModal: React.FC<AssetSelectorModalProps> = ({ 
    isOpen, 
    onClose, 
    marketData, 
    currentWatchlist, 
    onConfirm 
}) => {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Sincroniza o estado local com a watchlist atual quando o modal abre
    useEffect(() => {
        if (isOpen) {
            setSelectedIds(currentWatchlist);
        }
    }, [isOpen, currentWatchlist]);

    if (!isOpen) return null;

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) 
                ? prev.filter(item => item !== id) 
                : [...prev, id]
        );
    };

    const handleConfirm = () => {
        onConfirm(selectedIds);
        onClose();
    };

    const filteredData = marketData.filter(coin => 
        coin.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-zinc-800 border border-emerald-700/50 rounded-xl shadow-2xl shadow-emerald-900/40 w-full max-w-lg flex flex-col max-h-[85vh]">
                
                {/* Header */}
                <div className="p-4 border-b border-emerald-800/50 flex justify-between items-center bg-zinc-900/50 rounded-t-xl">
                    <h3 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                        <span>🎯</span> Seleção de Alvos
                    </h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">✕</button>
                </div>

                {/* Search Bar */}
                <div className="p-4 bg-zinc-800/80">
                    <input 
                        type="text" 
                        placeholder="Buscar ativo (ex: Bitcoin, SOL)..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/40 border border-emerald-800/50 rounded-lg px-4 py-2 text-emerald-200 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                </div>

                {/* List */}
                <div className="flex-grow overflow-y-auto p-2 space-y-1">
                    {filteredData.map(coin => {
                        const isSelected = selectedIds.includes(coin.id);
                        return (
                            <div 
                                key={coin.id} 
                                onClick={() => toggleSelection(coin.id)}
                                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${
                                    isSelected 
                                    ? 'bg-emerald-900/40 border-emerald-500/50' 
                                    : 'bg-zinc-900/30 border-transparent hover:bg-zinc-700/50'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                                    <div>
                                        <p className={`font-bold ${isSelected ? 'text-white' : 'text-zinc-300'}`}>{coin.name}</p>
                                        <span className="text-xs text-zinc-500 uppercase">{coin.symbol}</span>
                                    </div>
                                </div>
                                <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                                    isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'
                                }`}>
                                    {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                                </div>
                            </div>
                        );
                    })}
                    {filteredData.length === 0 && (
                        <p className="text-center text-zinc-500 py-8 italic">Nenhum ativo encontrado.</p>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-emerald-800/50 bg-zinc-900/50 rounded-b-xl flex justify-between items-center">
                    <p className="text-xs text-zinc-500">
                        {selectedIds.length} ativos selecionados
                    </p>
                    <div className="flex gap-3">
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors text-sm font-bold"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleConfirm}
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-900/30 transition-all text-sm font-bold"
                        >
                            CONFIRMAR SELEÇÃO
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssetSelectorModal;