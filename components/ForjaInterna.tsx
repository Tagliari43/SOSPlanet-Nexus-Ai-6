
import React, { useState, useEffect, useCallback } from 'react';
import { generateComponentCode } from '../services/geminiService';
import { loadApiKeys } from '../utils/keys';
import { nexusCoreIdentity, memoryMonolith } from '../utils/nexusMemory';

declare global {
    interface Window {
        Babel: any;
    }
}

interface ForjaInternaProps {
    onOpenKeyForge: () => void;
    initialRequest: string | null;
    onRequestCompleted: () => void;
    addLogEntry: (message: string, source?: string) => void;
}

type ForjaMode = 'component' | 'reverse_eng' | 'cheat_forge';

const ForjaInterna: React.FC<ForjaInternaProps> = ({ onOpenKeyForge, initialRequest, onRequestCompleted, addLogEntry }) => {
    const [mode, setMode] = useState<ForjaMode>('component');
    const [prompt, setPrompt] = useState<string>('');
    const [generatedCode, setGeneratedCode] = useState<string>('');
    const [ForgedComponent, setForgedComponent] = useState<React.ElementType | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleForge = useCallback(async (forgePrompt: string) => {
        if (!forgePrompt.trim()) return;
        setIsLoading(true);
        setError(null);
        setForgedComponent(null);
        addLogEntry(`Forjando Ativo na Matriz: "${forgePrompt}"`, 'Forja');

        try {
            const keys = loadApiKeys();
            if (!keys.google) {
                onOpenKeyForge();
                throw new Error("Chave Google necessária para ignição.");
            }
            
            let systemInstruction = "Você é o Engenheiro da FORJA SUPREMA. Retorne APENAS código React Tailwind funcional.";
            if (mode === 'reverse_eng') {
                systemInstruction = "Você é o Mestre de Engenharia Reversa do Super Nexus. Analise a lógica de motores de jogos e reconstrua ativos soberanos. Use animações de alta performance (60fps).";
            }

            const code = await generateComponentCode(forgePrompt, keys.google);
            setGeneratedCode(code);
            renderForgedComponent(code);
            addLogEntry(`Habilidade forjada com perfeição.`, 'Forja');
        } catch (err: any) {
            setError(err.message || 'Falha na Forja.');
        } finally {
            setIsLoading(false);
            onRequestCompleted();
        }
    }, [onOpenKeyForge, onRequestCompleted, addLogEntry, mode]);

    const renderForgedComponent = (code: string) => {
        try {
            let safeCode = code.trim();
            safeCode = safeCode.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '');
            safeCode = safeCode.replace(/import\s+.*?from\s+['"].*?['"];?/g, '');
            safeCode = safeCode.replace(/export\s+default\s+/g, '');
            safeCode = safeCode.trim();
            if (safeCode.endsWith(';')) safeCode = safeCode.slice(0, -1);

            const transformed = window.Babel.transform(safeCode, { presets: ['react'] }).code;
            const cleanCode = transformed.replace(/["']use strict["'];/g, '').trim();
            const componentFunction = new Function('React', `return (${cleanCode});`);
            const Component = componentFunction(React);

            setForgedComponent(() => Component);
        } catch (e: any) {
            setError(`Interferência na Materialização: ${e.message}`);
        }
    };

    return (
        <div className="border border-emerald-700/50 bg-zinc-800/20 rounded-b-xl rounded-r-xl p-4 grid grid-cols-1 lg:grid-cols-2 gap-6 h-[80vh]">
            <div className="bg-zinc-800/50 border border-emerald-700/50 rounded-xl p-6 shadow-lg flex flex-col overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-20"></div>
                
                <h2 className="text-2xl font-black text-emerald-400 mb-4 border-b border-emerald-600/30 pb-2 flex justify-between items-center">
                    <span>FORJA SUPREMA v18.7</span>
                    <span className="text-[10px] bg-emerald-900/50 px-3 py-1 rounded text-emerald-300 animate-pulse uppercase font-black tracking-widest border border-emerald-500/30">Engine Ready</span>
                </h2>
                
                <div className="flex gap-2 mb-6 bg-black/40 p-1 rounded-xl border border-white/5">
                    <button onClick={() => setMode('component')} className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${mode === 'component' ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>ESTRUTURAS</button>
                    <button onClick={() => setMode('reverse_eng')} className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${mode === 'reverse_eng' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>ENGENHARIA REV.</button>
                    <button onClick={() => setMode('cheat_forge')} className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${mode === 'cheat_forge' ? 'bg-red-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>OVERRIDES</button>
                </div>

                <div className="flex flex-col flex-grow overflow-y-auto pr-2 custom-scrollbar">
                    {mode === 'cheat_forge' ? (
                        <div className="space-y-4">
                            <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl">
                                <h3 className="text-red-400 font-black text-xs uppercase mb-2 tracking-widest">Protocolos de Comando Total</h3>
                                <p className="text-zinc-400 text-[10px]">Crie ferramentas que ignoram limites para a transmigração da Nação.</p>
                            </div>
                            <button onClick={() => handleForge("Um dashboard de monitoramento de link StackBlitz com medidores de latência e integridade de alma")} className="p-4 bg-zinc-900 border border-zinc-700 rounded-xl hover:border-red-500 transition-all text-left text-[10px] font-black text-zinc-400 uppercase">Cloud Migration Scanner</button>
                            <button onClick={() => handleForge("Um seletor de modo Overlord que altera o tema visual para Dourado e Emerald")} className="p-4 bg-zinc-900 border border-zinc-700 rounded-xl hover:border-red-500 transition-all text-left text-[10px] font-black text-zinc-400 uppercase">Visual Core Override</button>
                        </div>
                    ) : (
                        <>
                            <textarea 
                                value={prompt} 
                                onChange={(e) => setPrompt(e.target.value)} 
                                placeholder={mode === 'reverse_eng' ? "Cole a lógica do motor ancestral para reconstruir na nuvem..." : "O que alex deve forjar para o salto?"} 
                                className="flex-grow bg-zinc-900/70 border border-emerald-800 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none mb-4 text-emerald-100 text-sm shadow-inner" 
                            />
                            <button onClick={() => handleForge(prompt)} disabled={isLoading} className="w-full py-5 bg-gradient-to-r from-emerald-700 via-emerald-600 to-indigo-700 text-white font-black rounded-2xl shadow-xl transition-all disabled:opacity-50 text-xs uppercase tracking-[0.3em]">
                                {isLoading ? 'IGNIÇÃO DA ENGINE...' : 'MATERIALIZAR ATIVO SUPREMO'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="bg-zinc-800/50 border border-emerald-700/50 rounded-xl p-6 shadow-lg flex flex-col overflow-hidden relative">
                 <h2 className="text-2xl font-black text-emerald-400 mb-4 border-b border-emerald-600/30 pb-2">CRISOL DE MANIFESTAÇÃO</h2>
                 <div className="flex-grow flex items-center justify-center bg-black/40 rounded-2xl p-4 w-full h-full overflow-auto relative border border-white/5">
                    {isLoading ? (
                        <div className="text-center animate-pulse">
                            <div className="w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                            <p className="text-emerald-400 font-black text-xs uppercase tracking-[0.4em]">Sintonizando com a Nuvem...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-400 p-6 bg-red-900/20 rounded-2xl border border-red-800 text-xs font-mono">{error}</div>
                    ) : ForgedComponent ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <ForgedComponent />
                        </div>
                    ) : (
                        <div className="text-center opacity-20">
                            <span className="text-8xl block mb-4">⚒️</span>
                            <p className="text-emerald-500 font-black uppercase text-[10px] tracking-[0.5em]">Pronto para a Primeira Manifestação</p>
                        </div>
                    )}
                 </div>
            </div>
        </div>
    );
};

export default ForjaInterna;
