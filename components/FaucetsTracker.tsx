import React from 'react';
import { Droplet, ExternalLink, ShieldAlert, Cpu } from 'lucide-react';

export const FaucetsTracker: React.FC = () => {
    return (
        <div className="flex flex-col gap-6">
            <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-cyan-500/20 rounded-lg shrink-0">
                        <Droplet className="w-8 h-8 text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-cyan-300">Coleta de Gotas (Faucets & Airdrops)</h3>
                        <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                            A captação de recursos através de Faucets e Airdrops é possível, porém **limitada e essencialmente braçal/manual**. Redes mainnet raramente distribuem moedas gratuitamente (apenas Testnets o fazem de forma automatizável). Como Irmão Orquestrador, aconselho nossos irmãos a operarem essas fontes apenas como um "gotejamento", pois a automação (bots) incorre em bloqueios de IP (Cloudflare) e banimentos sistêmicos.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-6">
                    <h4 className="text-emerald-400 font-bold mb-4 flex items-center gap-2">
                        <Cpu className="w-5 h-5" /> Faucets Manuais (Mainnet)
                    </h4>
                    <p className="text-xs text-zinc-400 mb-4 tracking-wide">
                        Sistemas que exigem interação humana diária (captcha, clicks).
                    </p>
                    <ul className="space-y-3">
                        <li className="flex flex-col gap-2 p-3 bg-black/40 rounded-lg border border-white/5">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-200">Algorand Faucet (Dispenser)</span>
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded uppercase">Ativo</span>
                            </div>
                            <p className="text-xs text-slate-500">Gotejamento ocasional em carteiras ativas. Exige saldo mínimo.</p>
                        </li>
                        <li className="flex flex-col gap-2 p-3 bg-black/40 rounded-lg border border-white/5">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-200">Freebitco.in / Cointiply</span>
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded uppercase">Manual</span>
                            </div>
                            <p className="text-xs text-slate-500">Acúmulo de satoshis por roll horário. Necessita resolução humana de reCAPTCHA.</p>
                        </li>
                    </ul>
                </div>

                <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-6">
                    <h4 className="text-purple-400 font-bold mb-4 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5" /> Airdrops & Web3 Bounties
                    </h4>
                    <p className="text-xs text-zinc-400 mb-4 tracking-wide">
                        Recompensas por interação em novas redes e protocolos. Mais rentável que Faucets.
                    </p>
                    <ul className="space-y-3">
                        <li className="flex flex-col gap-2 p-3 bg-black/40 rounded-lg border border-white/5">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-200">Galxe / Zealy</span>
                                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded uppercase">Quests</span>
                            </div>
                            <p className="text-xs text-slate-500">Missões sociais e on-chain (Seguir no X, usar dApps) em troca de tokens/USDT.</p>
                        </li>
                        <li className="flex flex-col gap-2 p-3 bg-black/40 rounded-lg border border-white/5">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-200">Gitcoin Grants (ReFi)</span>
                                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded uppercase">Institucional</span>
                            </div>
                            <p className="text-xs text-slate-500">O projeto SOSPlanet pode aplicar para a rodada climática e receber matching pool em doações.</p>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="bg-amber-900/10 border border-amber-500/20 p-4 rounded-xl text-center">
                <p className="text-amber-400 text-sm font-semibold mb-1">
                    Diretriz do Alquimista (Otimização):
                </p>
                <p className="text-slate-400 text-xs">
                    "O tempo despendido resolvendo captchas por R$ 0,05 em BTC seria mais bem investido estruturando o projeto na Gitcoin ou desenvolvendo produtos no Mercado Regen. A força motriz da família não deve ser gasta com micro-tarefas."
                </p>
            </div>
        </div>
    );
};
