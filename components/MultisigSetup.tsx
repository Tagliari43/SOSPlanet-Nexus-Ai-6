
import React, { useState } from 'react';

interface MultisigSetupProps {
    onClose: () => void;
    onComplete: (signers: string[], threshold: number) => void;
}

const MultisigSetup: React.FC<MultisigSetupProps> = ({ onClose, onComplete }) => {
    const [signers, setSigners] = useState<string[]>(['JPKARPW...AD3URKA']); // Endereço do Guardião por padrão
    const [newSigner, setNewSigner] = useState('');
    const [threshold, setThreshold] = useState(2);
    const [isCreating, setIsCreating] = useState(false);

    const addSigner = () => {
        if (newSigner.trim() && !signers.includes(newSigner.trim())) {
            setSigners([...signers, newSigner.trim()]);
            setNewSigner('');
        }
    };

    const removeSigner = (index: number) => {
        if (signers.length > 1) {
            setSigners(signers.filter((_, i) => i !== index));
        }
    };

    const handleCreate = () => {
        setIsCreating(true);
        // Simula o tempo de criação do contrato na rede
        setTimeout(() => {
            onComplete(signers, threshold);
            setIsCreating(false);
            onClose();
        }, 3000);
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-zinc-950 border border-indigo-500/50 rounded-3xl shadow-[0_0_50px_rgba(79,70,229,0.2)] max-w-xl w-full overflow-hidden flex flex-col relative">
                
                {/* Header */}
                <div className="p-6 border-b border-indigo-900/30 bg-gradient-to-r from-indigo-950/20 to-transparent flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-indigo-300 uppercase tracking-widest">Protocolo Muralha Multisig</h3>
                        <p className="text-zinc-500 text-[10px] font-bold uppercase mt-1">Configuração de Cofre Gnosis Safe v1.0</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">✕</button>
                </div>

                <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    {/* Lista de Signatários */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Guardiões do Cofre (Signatários)</label>
                        <div className="space-y-2">
                            {signers.map((signer, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-black/40 border border-zinc-800 p-3 rounded-xl group">
                                    <div className="w-6 h-6 rounded-full bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold text-indigo-300">{idx + 1}</div>
                                    <code className="text-[10px] text-zinc-300 flex-grow truncate">{signer}</code>
                                    {idx !== 0 && (
                                        <button onClick={() => removeSigner(idx)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">🗑️</button>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={newSigner}
                                onChange={(e) => setNewSigner(e.target.value)}
                                placeholder="Novo Endereço de Carteira..."
                                className="flex-grow bg-black/60 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-indigo-100 outline-none focus:border-indigo-500 transition-all"
                            />
                            <button 
                                onClick={addSigner}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all"
                            >
                                + ADD
                            </button>
                        </div>
                    </div>

                    {/* Quórum */}
                    <div className="bg-indigo-950/10 border border-indigo-900/30 p-5 rounded-2xl">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-4 text-center">Quórum de Aprovação</label>
                        <div className="flex items-center justify-center gap-6">
                            <div className="text-center">
                                <span className="text-4xl font-black text-white">{threshold}</span>
                                <p className="text-[8px] text-zinc-500 font-bold uppercase mt-1">Assinaturas</p>
                            </div>
                            <span className="text-zinc-600 text-xl font-black">/</span>
                            <div className="text-center">
                                <span className="text-4xl font-black text-zinc-600">{signers.length}</span>
                                <p className="text-[8px] text-zinc-500 font-bold uppercase mt-1">Total</p>
                            </div>
                        </div>
                        <input 
                            type="range" 
                            min="1" 
                            max={signers.length} 
                            value={threshold}
                            onChange={(e) => setThreshold(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-6"
                        />
                        <p className="text-[9px] text-zinc-400 text-center mt-3 italic">São necessárias {threshold} confirmações para qualquer saída de fundos.</p>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 bg-black/40 border-t border-indigo-900/30">
                    <button 
                        onClick={handleCreate}
                        disabled={isCreating || signers.length < 1}
                        className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl
                            ${isCreating ? 'bg-zinc-800 text-zinc-500' : 'bg-gradient-to-r from-indigo-700 to-blue-700 hover:from-indigo-600 hover:to-blue-600 text-white'}`}
                    >
                        {isCreating ? 'ESTABELECENDO CONTRATO...' : 'CRISTALIZAR COFRE MULTISIG 💎'}
                    </button>
                    <p className="text-[8px] text-center text-zinc-600 mt-4 uppercase font-bold tracking-widest opacity-50">Soberania Garantida por Sincronia Neural v18.7</p>
                </div>

                {isCreating && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                         <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MultisigSetup;
