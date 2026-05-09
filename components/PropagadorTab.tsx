import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Share2, Download, Leaf, Award, Fingerprint, QrCode } from 'lucide-react';
import html2canvas from 'html2canvas';

const PropagadorTab: React.FC = () => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [guardianName, setGuardianName] = useState('Anônimo');
    const [guardianRank, setGuardianRank] = useState('Semeador Novato');
    
    // Stats for the card
    const o2Generated = "1,450 kg";
    const activeSeeds = 12;
    const impactScore = 840;

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setIsGenerating(true);
        try {
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: '#050505',
                scale: 2,
                logging: false,
                useCORS: true
            });
            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `eco-card-${guardianName.toLowerCase().replace(/\s+/g, '-')}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Erro ao gerar Eco-Card:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-8 max-w-4xl mx-auto w-full">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold uppercase tracking-widest text-[#0ea5e9] font-mono flex items-center justify-center gap-3 drop-shadow-[0_0_10px_#0ea5e9]">
                    <Share2 className="w-8 h-8" /> Propagador de Consciência
                </h2>
                <p className="text-cyan-100/70 font-mono text-sm max-w-2xl mx-auto">
                    Forje seu Eco-Card digital. Uma prova criptográfica de seu impacto ecológico no SOSPlanet. Compartilhe e recrute novos Guardiões.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                
                {/* Control Panel */}
                <div className="bg-[#0A0D0B] border border-cyan-900/30 p-6 rounded-2xl flex flex-col gap-6">
                    <h3 className="text-cyan-400 font-bold uppercase font-mono tracking-widest text-sm flex items-center gap-2 border-b border-cyan-900/30 pb-2">
                        <Fingerprint className="w-4 h-4" /> Assinatura do Guardião
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-mono text-cyan-600 mb-1">Codinome / Identidade</label>
                            <input 
                                type="text" value={guardianName} onChange={(e) => setGuardianName(e.target.value)}
                                className="w-full bg-black/40 border border-cyan-900/30 rounded px-3 py-2 text-sm text-cyan-100 focus:border-cyan-500/50 focus:outline-none font-mono"
                                placeholder="Seu nome"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-cyan-600 mb-1">Patente / Rank</label>
                            <select 
                                value={guardianRank} onChange={(e) => setGuardianRank(e.target.value)}
                                className="w-full bg-black/40 border border-cyan-900/30 rounded px-3 py-2 text-sm text-cyan-100 focus:border-cyan-500/50 focus:outline-none font-mono"
                            >
                                <option value="Semeador Novato">Semeador Novato</option>
                                <option value="Vigia das Folhas">Vigia das Folhas</option>
                                <option value="Guardião do Tronco">Guardião do Tronco</option>
                                <option value="Ancião das Raízes">Ancião das Raízes</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <button 
                            onClick={handleDownload}
                            disabled={isGenerating}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-600 to-blue-500 text-white rounded-lg uppercase tracking-widest font-bold shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] disabled:opacity-50 transition-all font-mono text-xs"
                        >
                            {isGenerating ? 'Forjando...' : <><Download className="w-4 h-4" /> Forjar & MIntar Eco-Card</>}
                        </button>
                    </div>
                </div>

                {/* Eco-Card Preview */}
                <div className="flex items-center justify-center bg-black/20 p-8 rounded-2xl border border-white/5">
                    
                    {/* THE CARD ITSELF (To be captured by html2canvas) */}
                    <div 
                        ref={cardRef} 
                        className="relative w-80 h-[450px] bg-[#050505] rounded-3xl overflow-hidden shadow-2xl border border-cyan-500/30 flex flex-col"
                        style={{ backgroundImage: 'radial-gradient(ellipse at bottom, rgba(6,182,212,0.15) 0%, transparent 70%)' }}
                    >
                        {/* Header Profile */}
                        <div className="flex flex-col items-center pt-8 pb-4 relative z-10">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 p-1 shadow-[0_0_20px_rgba(6,182,212,0.4)] mb-4">
                                <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden relative">
                                    {/* Placeholder PFP */}
                                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&q=80')] bg-cover bg-center opacity-50 mix-blend-overlay"></div>
                                    <TreeIcon />
                                </div>
                            </div>
                            <h3 className="text-white font-bold text-xl drop-shadow-md">{guardianName}</h3>
                            <span className="text-cyan-400 font-mono text-[10px] uppercase tracking-widest mt-1 border border-cyan-500/50 rounded-full px-3 py-1 bg-cyan-950/50">
                                {guardianRank}
                            </span>
                        </div>

                        {/* Stats Section */}
                        <div className="flex-1 grid grid-cols-2 gap-px bg-cyan-900/50 border-y border-cyan-500/20 relative z-10">
                            <div className="bg-[#050505] flex flex-col items-center justify-center p-4">
                                <Leaf className="w-5 h-5 text-emerald-400 mb-2" />
                                <span className="text-emerald-500 font-bold font-mono text-lg leading-none">{activeSeeds}</span>
                                <span className="text-[9px] text-zinc-500 font-mono uppercase mt-1 text-center">Sementes<br/>Ativas</span>
                            </div>
                            <div className="bg-[#050505] flex flex-col items-center justify-center p-4">
                                <Wind className="w-5 h-5 text-cyan-400 mb-2" />
                                <span className="text-cyan-500 font-bold font-mono text-lg leading-none">{o2Generated}</span>
                                <span className="text-[9px] text-zinc-500 font-mono uppercase mt-1 text-center">O₂ Gerado<br/>(Verificado)</span>
                            </div>
                        </div>

                        {/* Footer Logo & QR */}
                        <div className="p-4 flex justify-between items-center bg-black/60 backdrop-blur-md relative z-10 h-20">
                            <div>
                                <h4 className="text-white font-black italic tracking-tighter text-lg leading-none">SOSPlanet</h4>
                                <p className="text-cyan-600 font-mono text-[8px] uppercase tracking-widest mt-0.5">Protocolo Herdeiros</p>
                            </div>
                            <div className="w-12 h-12 bg-white rounded p-1 flex items-center justify-center">
                                <QrCode className="w-full h-full text-black" />
                            </div>
                        </div>

                        {/* Decorative Scans */}
                        <div className="absolute inset-0 pointer-events-none opacity-20" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #06b6d4 2px, #06b6d4 4px)' }}></div>
                    </div>
                </div>

            </div>
        </motion.div>
    );
};

// Simple Tree Icon for the PFP placeholder
const TreeIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-cyan-400">
        <path d="M12 22v-6"/>
        <path d="m9 16 3-6 3 6"/>
        <path d="M12 10V6"/>
        <path d="M10 6a2 2 0 1 1 4 0"/>
        <path d="M6 10a2 2 0 1 1 4 0"/>
        <path d="M14 10a2 2 0 1 1 4 0"/>
    </svg>
);

export default PropagadorTab;
