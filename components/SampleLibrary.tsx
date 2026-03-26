
import React, { useState, useRef, useCallback } from 'react';
import { loadApiKeys } from '../utils/keys';

export interface AudioSample {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    isGenerated?: boolean;
}

interface SampleLibraryProps {
    samples: AudioSample[];
    onAddSamples: (newSamples: AudioSample[]) => void;
    onRemoveSample: (id: string) => void;
}

const SampleLibrary: React.FC<SampleLibraryProps> = ({ samples, onAddSamples, onRemoveSample }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [playingSampleId, setPlayingSampleId] = useState<string | null>(null);
    
    // Estados da Forja Sonora
    const [prompt, setPrompt] = useState('');
    const [isForging, setIsForging] = useState(false);
    const [forgeError, setForgeError] = useState<string | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    }, []);

    const processFiles = (files: FileList | null) => {
        if (!files) return;
        const newSamples: AudioSample[] = [];

        Array.from(files).forEach(file => {
            if (file.type.startsWith('audio/')) {
                const url = URL.createObjectURL(file);
                newSamples.push({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    url: url,
                    type: file.type,
                    size: file.size
                });
            }
        });

        if (newSamples.length > 0) {
            onAddSamples(newSamples);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        processFiles(e.dataTransfer.files);
    }, [onAddSamples]);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        processFiles(e.target.files);
    };

    // --- Lógica de Arrastar para a Timeline ---
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, sample: AudioSample) => {
        e.dataTransfer.setData("application/json", JSON.stringify(sample));
        e.dataTransfer.effectAllowed = "copy";
    };

    const handleForgeSound = async () => {
        if (!prompt.trim()) return;

        const keys = loadApiKeys();
        if (!keys.groq) {
            setForgeError("Chave da Ponte Experimental (Groq) não encontrada. Verifique a Forja de Chaves.");
            return;
        }

        setIsForging(true);
        setForgeError(null);

        try {
            // Mocking music generation for Groq since it doesn't support it directly
            // In a real scenario, you'd use a dedicated audio generation API
            const blob = new Blob(["mock audio data"], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            
            const newSample: AudioSample = {
                id: Date.now().toString(),
                name: `Forjado: "${prompt}"`,
                url: url,
                type: 'audio/wav', // A API geralmente retorna FLAC ou WAV
                size: blob.size,
                isGenerated: true
            };

            onAddSamples([newSample]);
            setPrompt(''); // Limpa o prompt após sucesso
        } catch (err: any) {
            setForgeError(err.message || "Falha ao forjar o som.");
        } finally {
            setIsForging(false);
        }
    };

    const playSample = (sample: AudioSample) => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        if (playingSampleId === sample.id) {
            setPlayingSampleId(null);
            return;
        }

        const audio = new Audio(sample.url);
        audioRef.current = audio;
        setPlayingSampleId(sample.id);
        
        audio.play().catch(e => console.error("Erro ao reproduzir:", e));
        
        audio.onended = () => {
            setPlayingSampleId(null);
        };
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="flex flex-col h-full gap-4">
            
            {/* SEÇÃO 1: GERADOR DE AMOSTRAS IA (A FORJA DE SONS) */}
            <div className="bg-gradient-to-r from-zinc-900 to-emerald-900/20 border border-emerald-700/50 rounded-xl p-4 shadow-lg">
                <h3 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
                    <span className="text-xl">⚡</span> Gerador de Amostras IA
                </h3>
                
                <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                        type="text" 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Descreva o som (ex: 'batida de hip hop lenta', 'melodia de piano triste', 'trovões')"
                        className="flex-grow bg-black/40 border border-emerald-800/50 rounded-lg px-4 py-3 text-emerald-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                        disabled={isForging}
                        onKeyPress={(e) => e.key === 'Enter' && handleForgeSound()}
                    />
                    <button 
                        onClick={handleForgeSound}
                        disabled={isForging || !prompt.trim()}
                        className={`px-6 py-3 rounded-lg font-bold text-white shadow-lg transition-all flex items-center gap-2 justify-center min-w-[150px]
                            ${isForging 
                                ? 'bg-zinc-600 cursor-not-allowed' 
                                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'}`}
                    >
                        {isForging ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Forjando...
                            </>
                        ) : (
                            'FORJAR SOM'
                        )}
                    </button>
                </div>
                {forgeError && (
                    <p className="text-red-400 text-xs mt-2 bg-red-900/20 p-2 rounded border border-red-800/50 animate-pulse">
                        ⚠️ {forgeError}
                    </p>
                )}
            </div>

            <div className="flex gap-4 h-[300px]">
                {/* SEÇÃO 2: ÁREA DE UPLOAD */}
                <div 
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-4 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer relative group w-1/4
                        ${isDragging 
                            ? 'border-emerald-400 bg-emerald-900/30 scale-[1.01]' 
                            : 'border-zinc-700 bg-black/20 hover:bg-zinc-800/50 hover:border-emerald-700'}`}
                >
                    <input 
                        type="file" 
                        multiple 
                        accept="audio/*" 
                        onChange={handleFileInput} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center gap-2 text-center">
                        <span className="text-2xl group-hover:scale-110 transition-transform">📂</span>
                        <p className="font-bold text-zinc-400 group-hover:text-emerald-400 transition-colors text-sm">Importar</p>
                        <p className="text-[10px] text-zinc-600">Arraste ou clique</p>
                    </div>
                </div>

                {/* SEÇÃO 3: LISTA DE SAMPLES (A BIBLIOTECA) */}
                <div className="flex-grow overflow-y-auto bg-black/20 rounded-xl border border-emerald-900/30 p-2">
                    {samples.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-600 italic">
                            <p>A forja está vazia.</p>
                            <p className="text-xs">Crie novos sons com a IA ou carregue seus arquivos.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {samples.slice().reverse().map(sample => (
                                <div 
                                    key={sample.id} 
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, sample)}
                                    className={`border rounded-lg p-2 flex items-center justify-between group transition-all cursor-grab active:cursor-grabbing ${sample.isGenerated ? 'bg-emerald-900/10 border-emerald-800 hover:bg-emerald-900/20' : 'bg-zinc-900/80 border-zinc-800 hover:border-emerald-600/50'}`}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <button 
                                            onClick={() => playSample(sample)}
                                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                                playingSampleId === sample.id 
                                                    ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]' 
                                                    : 'bg-zinc-800 text-emerald-500 hover:bg-emerald-900'
                                            }`}
                                        >
                                            {playingSampleId === sample.id ? '⏸' : '▶'}
                                        </button>
                                        <div className="min-w-0">
                                            <p className={`text-xs font-bold truncate transition-colors ${sample.isGenerated ? 'text-emerald-200' : 'text-zinc-300 group-hover:text-emerald-300'}`} title={sample.name}>
                                                {sample.name}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                {sample.isGenerated && <span className="text-[8px] bg-emerald-600 text-white px-1 rounded">IA</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => onRemoveSample(sample.id)}
                                        className="text-zinc-600 hover:text-red-400 p-1 rounded hover:bg-red-900/20 transition-colors opacity-50 group-hover:opacity-100"
                                        title="Remover Amostra"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SampleLibrary;
