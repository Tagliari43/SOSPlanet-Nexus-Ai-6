
import React, { useState, useEffect } from 'react';
import { getRealBalances, AccountBalances, NATION_TREASURY_ADDRESS } from '../services/blockchainService';
import { useSosToken } from '../hooks/useSosToken';
import QuantumShield from './QuantumShield';
import MultisigSetup from './MultisigSetup';

interface SosTokenWalletProps {
    addLogEntry?: (message: string, source?: string) => void;
}

const SosTokenWallet: React.FC<SosTokenWalletProps> = ({ addLogEntry }) => {
    const [balances, setBalances] = useState<AccountBalances>({ algo: 0, sos: 0, status: 'PROJEÇÃO' });
    const [isLoading, setIsLoading] = useState(true);
    const [isCopied, setIsCopied] = useState(false);
    const [showQuantumShield, setShowQuantumShield] = useState(false);
    const [showMultisigSetup, setShowMultisigSetup] = useState(false);
    const [walletSecurityType, setWalletSecurityType] = useState<'simple' | 'multisig'>(() => {
        const stored = localStorage.getItem('sovereign_wallet_security');
        return (stored === 'multisig' || stored === 'simple') ? stored : 'simple';
    });
    
    const { balance: sovereignBalance } = useSosToken();

    useEffect(() => {
        let mounted = true;
        const doFetch = async () => {
            setIsLoading(true);
            const data = await getRealBalances(NATION_TREASURY_ADDRESS);
            if (mounted) {
                setBalances(data);
                setIsLoading(false);
            }
        };
        doFetch();
        const interval = setInterval(doFetch, 60000);
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    const copyAddress = () => {
        navigator.clipboard.writeText(NATION_TREASURY_ADDRESS);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleCompleteMultisig = (signers: string[], threshold: number) => {
        setWalletSecurityType('multisig');
        localStorage.setItem('sovereign_wallet_security', 'multisig');
        if (addLogEntry) {
            addLogEntry(`[Alquimista] Protocolo de segurança 'Muralha Multisig' iniciado. Tesouraria da Nação atualizada para Cofre Multisig (${threshold}/${signers.length}).`, 'Tesouraria');
        }
    };

    if (showQuantumShield) return <QuantumShield onBack={() => setShowQuantumShield(false)} />;

    return (
        <div className="flex flex-col h-full gap-6 animate-fade-in">
            {/* CABEÇALHO DO PAINEL DE TESOURARIA */}
            <div className="bg-zinc-900/60 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <span className="text-[120px]">🔱</span>
                </div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-widest">Tesouraria da Nação</h3>
                            <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Monitoramento de Ativos On-Chain</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                             <span className={`text-[9px] font-black px-3 py-1 rounded-full border transition-colors ${
                                 balances.status === 'REAL' 
                                 ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400' 
                                 : 'bg-zinc-800/40 border-zinc-600 text-zinc-500'
                             }`}>
                                {isLoading ? 'SINCRONIZANDO...' : `LINK: ${balances.status}`}
                             </span>
                             <button 
                                onClick={() => setShowQuantumShield(true)}
                                className="text-[9px] font-black text-indigo-400 hover:text-indigo-300 border border-indigo-900/50 px-2 py-1 rounded flex items-center gap-1 transition-all"
                             >
                                <span className="text-xs">🛡️</span> VER SEGURANÇA QUÂNTICA
                             </button>
                        </div>
                    </div>

                    <div className="bg-black/40 border border-emerald-900/50 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="min-w-0">
                            <p className="text-[9px] text-zinc-500 font-bold uppercase mb-1">Endereço Soberano</p>
                            <p className="text-xs font-mono text-emerald-400 truncate">{NATION_TREASURY_ADDRESS}</p>
                        </div>
                        <button 
                            onClick={copyAddress}
                            className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all shrink-0
                                ${isCopied ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-emerald-400 hover:bg-zinc-700 border border-emerald-900/30'}`}
                        >
                            {isCopied ? 'COPIADO' : 'COPIAR ENDEREÇO'}
                        </button>
                    </div>
                </div>
            </div>

            {/* NOVA SEÇÃO: SEGURANÇA DO TESOURO (PROPOSTA POR ÁRION) */}
            <div className="bg-zinc-900/40 border border-indigo-500/20 rounded-2xl p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl border ${walletSecurityType === 'multisig' ? 'bg-indigo-900/30 border-indigo-500/50' : 'bg-red-900/20 border-red-500/30'}`}>
                            <span className="text-2xl">{walletSecurityType === 'multisig' ? '🏰' : '🔓'}</span>
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-widest">Segurança do Tesouro</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] font-bold ${walletSecurityType === 'multisig' ? 'text-indigo-400' : 'text-red-400'}`}>
                                    Status: {walletSecurityType === 'multisig' ? 'COFRE MULTISIG (ATIVO)' : 'CARTEIRA SIMPLES (VULNERÁVEL)'}
                                </span>
                                {walletSecurityType === 'simple' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>}
                            </div>
                        </div>
                    </div>
                    
                    {walletSecurityType === 'simple' ? (
                        <button 
                            onClick={() => setShowMultisigSetup(true)}
                            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-500 hover:to-blue-600 text-white font-black text-[10px] rounded-xl shadow-lg transition-all uppercase tracking-widest"
                        >
                            Atualizar para Multisig
                        </button>
                    ) : (
                        <div className="px-4 py-2 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">🛡️ MURALHA ATIVA</span>
                        </div>
                    )}
                </div>
            </div>

            {/* DISPLAYS DE SALDO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-emerald-900/40 to-zinc-900 border border-emerald-500/40 rounded-2xl p-6 shadow-xl relative group overflow-hidden">
                    <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <span className="text-8xl">🌿</span>
                    </div>
                    <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Soberania SOS (Local + Chain)</p>
                    <div className="flex items-baseline gap-3">
                        <h2 className="text-5xl font-black text-white tracking-tighter">
                            {(balances.sos + sovereignBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                        </h2>
                        <span className="text-xl font-bold text-emerald-400">SOS</span>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-900/20 to-zinc-900 border border-yellow-700/30 rounded-2xl p-6 shadow-xl relative group overflow-hidden">
                    <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <span className="text-8xl">Ⱥ</span>
                    </div>
                    <p className="text-yellow-600 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Recurso de Rede (Gas)</p>
                    <div className="flex items-baseline gap-3">
                        <h2 className="text-5xl font-black text-white tracking-tighter">
                            {balances.algo.toFixed(2)}
                        </h2>
                        <span className="text-xl font-bold text-yellow-500">ALGO</span>
                    </div>
                </div>
            </div>

            {/* MODAL SETUP MULTISIG */}
            {showMultisigSetup && (
                <MultisigSetup 
                    onClose={() => setShowMultisigSetup(false)} 
                    onComplete={handleCompleteMultisig}
                />
            )}
        </div>
    );
};

export default SosTokenWallet;
