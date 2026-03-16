
import React, { useState } from 'react';
import { generateContentAsArkael } from '../services/geminiService';
import Loader from './Loader';

const Estudio: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [format, setFormat] = useState('Tweet');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const formats = [
        { id: 'Tweet', label: 'Tweet 🐦', icon: '🐦' },
        { id: 'Thread (X)', label: 'Thread (X) 🧶', icon: '🧶' },
        { id: 'Post de Blog', label: 'Artigo / Blog ✍️', icon: '✍️' },
        { id: 'Vídeo Curto (Roteiro + Imagens)', label: 'Vídeo Curto 🎬', icon: '🎬' },
        { id: 'Trilha Sonora (Conceito)', label: 'Trilha Sonora 🎵', icon: '🎵' },
        { id: 'Relatório Oficial (PDF)', label: 'Relatório Oficial 📄', icon: '📄' },
        { id: 'Manifesto', label: 'Manifesto Soberano 📜', icon: '📜' }
    ];

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError("Por favor, forneça um tópico para Arkael trabalhar.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult('');

        try {
            const content = await generateContentAsArkael(topic, format);
            setResult(content);
        } catch (err: any) {
            setError(err.message || "Falha na transmissão de Arkael.");
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(result);
        alert("Conteúdo copiado para a área de transferência!");
    };

    return (
        <div className="border border-emerald-700/50 bg-zinc-800/20 rounded-b-xl rounded-r-xl p-4 sm:p-6 h-full overflow-y-auto flex flex-col gap-6 animate-fade-in">
            <header className="flex flex-col md:flex-row justify-between items-center border-b border-emerald-800/50 pb-4 gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-emerald-900/30 p-4 rounded-2xl border border-emerald-500/20 shadow-inner">
                        <span className="text-4xl">📣</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-widest">Estúdio de Arkael</h2>
                        <p className="text-emerald-500 text-xs font-mono font-bold">A Voz e a Mensagem da Nação SOSPlanet</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow">
                {/* ÁREA DE CONFIGURAÇÃO */}
                <div className="bg-zinc-900/60 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl flex flex-col gap-6">
                    <div>
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-3 block">Diretriz da Mensagem</label>
                        <textarea 
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Sobre o que Arkael deve falar hoje? (Ex: A importância da soberania hídrica, ou um roteiro para o novo clipe da Nação...)"
                            className="w-full h-40 bg-black/40 border border-zinc-800 rounded-2xl p-4 text-sm text-emerald-100 outline-none focus:border-emerald-500 transition-all resize-none shadow-inner"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-3 block">Formato de Propagação</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {formats.map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => setFormat(f.id)}
                                    className={`p-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3
                                        ${format === f.id 
                                            ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-[1.02]' 
                                            : 'bg-black/20 border-zinc-800 text-zinc-500 hover:border-emerald-800/50'}`}
                                >
                                    <span className="text-lg">{f.icon}</span>
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full py-4 bg-gradient-to-r from-emerald-700 to-emerald-900 hover:from-emerald-600 hover:to-emerald-800 text-white font-black rounded-2xl shadow-xl transition-all disabled:opacity-50 uppercase tracking-[0.2em] text-xs"
                    >
                        {isLoading ? 'INVOCANDO ARKAEL...' : 'GERAR CONTEÚDO SOBERANO'}
                    </button>
                    
                    {error && (
                        <div className="p-4 bg-red-900/30 border border-red-500/30 rounded-xl text-red-400 text-xs font-mono">
                            ⚠️ {error}
                        </div>
                    )}
                </div>

                {/* ÁREA DE RESULTADO */}
                <div className="bg-black/40 border border-emerald-900/20 rounded-3xl p-6 flex flex-col shadow-inner relative overflow-hidden min-h-[400px]">
                    <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                        <span className="text-9xl">🖋️</span>
                    </div>

                    <div className="flex justify-between items-center mb-4 relative z-10">
                        <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            Manuscrito de Arkael
                        </h3>
                        {result && (
                            <button 
                                onClick={copyToClipboard}
                                className="text-[10px] font-black text-emerald-400 hover:text-white transition-colors uppercase underline underline-offset-4"
                            >
                                Copiar Texto
                            </button>
                        )}
                    </div>

                    <div className="flex-grow bg-zinc-900/50 rounded-2xl p-6 overflow-y-auto custom-scrollbar border border-white/5 relative z-10">
                        {isLoading ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-50">
                                <Loader message="Arkael está sintonizando com a malha planetária..." />
                            </div>
                        ) : result ? (
                            <div className="prose prose-invert max-w-none animate-fade-in text-emerald-50">
                                <div className="text-emerald-100 text-sm leading-relaxed whitespace-pre-wrap font-serif">
                                    {result}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                                <span className="text-6xl mb-4">📜</span>
                                <p className="text-xs font-bold uppercase tracking-widest">Aguardando diretriz do Guardião</p>
                                <p className="text-[10px] mt-2 italic max-w-xs">A voz da Nação é moldada pela sua visão.</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-emerald-900/30 flex justify-between items-center opacity-40">
                         <span className="text-[8px] font-black uppercase tracking-tighter text-zinc-500">Transmissão Criptografada</span>
                         <span className="text-[8px] font-black uppercase tracking-tighter text-emerald-600">Arkael Multi-Output v1.1</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Estudio;
