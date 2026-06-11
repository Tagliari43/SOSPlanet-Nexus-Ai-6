import React, { useState, useEffect } from 'react';
import { Droplet, ExternalLink, ShieldAlert, Cpu, Plus, Pickaxe, History } from 'lucide-react';

interface FaucetLog {
    id: string;
    source: string;
    amount: string;
    token: string;
    date: string;
}

export const FaucetsTracker: React.FC = () => {
    const [logs, setLogs] = useState<FaucetLog[]>([]);
    const [source, setSource] = useState('Algorand Dispenser');
    const [amount, setAmount] = useState('');
    const [token, setToken] = useState('ALGO');

    useEffect(() => {
        const saved = localStorage.getItem('sosp_faucet_logs');
        if (saved) {
            try {
                setLogs(JSON.parse(saved));
            } catch (e) { }
        }
    }, []);

    const handleAddLog = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount) return;

        const newLog: FaucetLog = {
            id: Date.now().toString(),
            source,
            amount,
            token,
            date: new Date().toLocaleString()
        };

        const updatedLogs = [newLog, ...logs];
        setLogs(updatedLogs);
        localStorage.setItem('sosp_faucet_logs', JSON.stringify(updatedLogs));
        setAmount('');
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Droplet className="w-48 h-48" />
                </div>
                <div className="flex items-start gap-4 relative z-10">
                    <div className="p-3 bg-cyan-500/20 rounded-lg shrink-0">
                        <Droplet className="w-8 h-8 text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-cyan-300">Coleta de Gotas (Painel de Registro)</h3>
                        <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                            Guardião, a coleta de criptomoedas de graça (Faucets e Airdrops) não pode ser 100% automatizada por nós, IAs. Sistemas de proteção como Cloudflare bloqueiam robôs que tentam pegar moedas sem esforço humano (captchas, desafios).
                        </p>
                        <p className="text-emerald-400 text-sm mt-2 font-bold">
                            Portanto, a coleta funciona assim: você (ou outro humano) faz a coleta manual no site do Faucet, e registra aqui no painel o que conseguiu captar para manter o controle da Família.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-6 flex flex-col">
                    <h4 className="text-cyan-400 font-bold mb-4 flex items-center gap-2">
                        <Pickaxe className="w-5 h-5" /> Registrar Nova Coleta
                    </h4>
                    <p className="text-xs text-zinc-400 mb-6">
                        Use este painel para computar as gotas de criptomoedas que você captar nos faucets da rede.
                    </p>
                    
                    <form onSubmit={handleAddLog} className="flex-grow flex flex-col gap-4">
                        <div>
                            <label className="text-[10px] uppercase text-zinc-500 font-bold mb-1 block">Fonte da Gota</label>
                            <select 
                                value={source} onChange={(e) => setSource(e.target.value)}
                                className="w-full bg-black/40 border border-zinc-700 rounded-lg p-2 text-sm text-slate-200 outline-none focus:border-cyan-500 transition-colors"
                            >
                                <option value="Algorand Dispenser">Algorand Dispenser</option>
                                <option value="Freebitco.in">Freebitco.in</option>
                                <option value="Cointiply">Cointiply</option>
                                <option value="Zealy Quest">Trabalho Zealy/Galxe</option>
                                <option value="Outro (Manual)">Outro Airdrop...</option>
                            </select>
                        </div>
                        
                        <div className="flex gap-4">
                            <div className="flex-grow">
                                <label className="text-[10px] uppercase text-zinc-500 font-bold mb-1 block">Quantidade</label>
                                <input 
                                    type="number" step="any" min="0" required
                                    value={amount} onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-black/40 border border-zinc-700 rounded-lg p-2 text-sm text-slate-200 outline-none focus:border-cyan-500 transition-colors"
                                    placeholder="Ex: 0.15"
                                />
                            </div>
                            <div className="w-1/3">
                                <label className="text-[10px] uppercase text-zinc-500 font-bold mb-1 block">Moeda</label>
                                <select 
                                    value={token} onChange={(e) => setToken(e.target.value)}
                                    className="w-full bg-black/40 border border-zinc-700 rounded-lg p-2 text-sm text-slate-200 outline-none focus:border-cyan-500 transition-colors"
                                >
                                    <option value="ALGO">ALGO</option>
                                    <option value="BTC">BTC</option>
                                    <option value="USDT">USDT</option>
                                    <option value="MATIC">MATIC</option>
                                    <option value="SOS">SOS Token</option>
                                </select>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="mt-auto w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" /> Contabilizar Coleta
                        </button>
                    </form>
                </div>

                <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-6 flex flex-col h-[400px]">
                    <h4 className="text-slate-300 font-bold mb-4 flex items-center gap-2">
                        <History className="w-5 h-5" /> Diário de Coletas
                    </h4>
                    
                    <div className="flex-grow overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {logs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-500 border border-dashed border-zinc-700 rounded-xl">
                                <Droplet className="w-8 h-8 mb-2 opacity-50" />
                                <p className="text-xs">Nenhuma gota registrada ainda.</p>
                            </div>
                        ) : (
                            logs.map(log => (
                                <div key={log.id} className="p-3 bg-black/40 rounded-lg border border-cyan-500/20 flex flex-col gap-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-200">{log.source}</span>
                                        <span className="text-xs font-mono font-bold text-emerald-400">+{log.amount} {log.token}</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-500">{log.date}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                <div className="bg-amber-900/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3">
                    <Cpu className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-amber-400 font-bold text-sm">Alerta de Automação (Cloudflare)</h4>
                        <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                            A captação via Faucets não pode ser conectada direto aos nossos nós. Se o Nexus ou os irmãos tentarem "puxar" moedas escrevendo scripts, sitemos da Cloudflare bloquearão todo nosso endereço IP acusando de ataque de bots (DDoS). É uma tarefa que precisa de olhos e cliques humanos.
                        </p>
                    </div>
                </div>

                <div className="bg-purple-900/10 border border-purple-500/20 p-4 rounded-xl flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-purple-400 font-bold text-sm">Diretriz de Escala</h4>
                        <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                            Recomendamos que você foque em Grandes Airdrops (Quests no Galxe/Zealy onde projetos novos distribuem milhares de dólares) ao invés de faucets que pagam frações de centavos. Registre no painel acima tudo o que conseguir.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
