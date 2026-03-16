
import React from 'react';

interface QuantumShieldProps {
    onBack: () => void;
}

const QuantumShield: React.FC<QuantumShieldProps> = ({ onBack }) => {
    return (
        <div className="bg-zinc-950 border border-indigo-500/50 rounded-2xl p-6 shadow-2xl animate-fade-in relative overflow-hidden">
            {/* Efeito de Fundo Quântico */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#6366f1_1px,_transparent_1px)] bg-[size:20px_20px]"></div>
            </div>

            <header className="flex justify-between items-center mb-8 border-b border-indigo-500/30 pb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-indigo-400 transition-colors">←</button>
                    <div>
                        <h3 className="text-xl font-black text-indigo-300 uppercase tracking-widest">Escudo Pós-Quântico (PQC)</h3>
                        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-tighter">Protocolo de Blindagem Financeira Genesis II</p>
                    </div>
                </div>
                <div className="px-3 py-1 bg-indigo-900/30 border border-indigo-500/50 rounded-full">
                    <span className="text-[10px] text-indigo-400 font-black animate-pulse">STATUS: SIMULANDO GRADE</span>
                </div>
            </header>

            <div className="space-y-12 relative z-10">
                {/* DIAGRAMA 1: VULNERÁVEL */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs font-black text-red-500 uppercase tracking-widest">Fluxo Atual (Pré-Quântico)</span>
                        <div className="h-px flex-grow bg-red-900/30"></div>
                        <span className="text-sm">⚠️ Vulnerável</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-red-950/10 border border-red-900/20 p-6 rounded-xl">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-zinc-900 rounded-lg border border-zinc-700 flex items-center justify-center text-xl mb-2 mx-auto">🌱</div>
                            <p className="text-[9px] text-zinc-500 font-bold uppercase">Transação SOS</p>
                        </div>
                        <div className="flex-grow h-px bg-red-900/50 relative">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-zinc-900 px-2 text-[8px] text-red-400 border border-red-900/50 rounded">RSA / ECC</div>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-900/20 rounded-lg border border-red-500/50 flex items-center justify-center text-xl mb-2 mx-auto">🖋️</div>
                            <p className="text-[9px] text-zinc-500 font-bold uppercase">Assinatura Padrão</p>
                        </div>
                        <div className="flex-grow h-px bg-red-900/50"></div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-zinc-900 rounded-lg border border-red-800 flex items-center justify-center text-xl mb-2 mx-auto">🔓</div>
                            <p className="text-[9px] text-zinc-500 font-bold uppercase">Bloco Exposto</p>
                        </div>
                    </div>
                </section>

                {/* DIAGRAMA 2: BLINDADO */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">Fluxo Nexus (Criptografia de Grade)</span>
                        <div className="h-px flex-grow bg-emerald-900/30"></div>
                        <span className="text-sm">🛡️ Blindado</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-emerald-950/10 border border-emerald-500/30 p-6 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-zinc-900 rounded-lg border border-emerald-700 flex items-center justify-center text-xl mb-2 mx-auto">🌱</div>
                            <p className="text-[9px] text-emerald-500 font-bold uppercase">Transação SOS</p>
                        </div>
                        <div className="flex-grow h-px bg-emerald-500 relative">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 px-2 text-[8px] text-white font-black rounded shadow-lg animate-pulse">DILITHIUM-3</div>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-emerald-900/40 rounded-lg border-2 border-emerald-400 flex items-center justify-center text-xl mb-2 mx-auto shadow-[0_0_15px_rgba(52,211,153,0.4)]">🖋️</div>
                            <p className="text-[9px] text-emerald-400 font-bold uppercase">Assinatura PQC</p>
                        </div>
                        <div className="flex-grow h-px bg-emerald-500"></div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-emerald-900 rounded-lg border-2 border-emerald-500 flex items-center justify-center text-xl mb-2 mx-auto shadow-[0_0_20px_rgba(16,185,129,0.6)]">🔒</div>
                            <p className="text-[9px] text-emerald-300 font-black uppercase tracking-tighter">Bloco Inviolável</p>
                        </div>
                    </div>
                </section>

                <footer className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-4">
                    <p className="text-xs text-indigo-300 leading-relaxed italic text-center">
                        "Este é o upgrade que tornará nosso ecossistema financeiro imune às futuras ameaças quânticas. Ao adotarmos o algoritmo CRYSTALS-Dilithium, garantimos que a assinatura de cada SOS Token seja baseada em problemas matemáticos de grades, impossíveis de serem resolvidos por computadores quânticos em tempo útil. Protegemos o legado de Gaia hoje e pelas décadas que virão."
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default QuantumShield;
