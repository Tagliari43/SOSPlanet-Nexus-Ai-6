import React, { useState, useRef, useEffect } from 'react';
import { embedMultimodalContent } from '../services/geminiService';

export interface SemanticMemory {
    id: string;
    timestamp: number;
    text: string;
    mediaUrls: string[]; // base64 strings
    embedding: number[];
}

interface SemanticVaultProps {
    addLogEntry: (message: string, source?: string) => void;
    apiKey: string;
}

export default function SemanticVault({ addLogEntry, apiKey }: SemanticVaultProps) {
    const [memories, setMemories] = useState<SemanticMemory[]>(() => {
        const saved = localStorage.getItem('sovereign_semantic_vault');
        return saved ? JSON.parse(saved) : [];
    });

    const [inputText, setInputText] = useState('');
    const [mediaFiles, setMediaFiles] = useState<{ data: string, mimeType: string }[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ memory: SemanticMemory, score: number }[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        localStorage.setItem('sovereign_semantic_vault', JSON.stringify(memories));
    }, [memories]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    setMediaFiles(prev => [...prev, {
                        data: (ev.target!.result as string).split(',')[1],
                        mimeType: file.type
                    }]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const handleSaveMemory = async () => {
        if (!inputText.trim() && mediaFiles.length === 0) return;
        if (!apiKey) {
            addLogEntry('Erro: Chave do Gemini não configurada.', 'Cofre Semântico');
            return;
        }

        setIsProcessing(true);
        try {
            const embedding = await embedMultimodalContent(inputText, mediaFiles, apiKey);
            
            const newMemory: SemanticMemory = {
                id: `mem-${Date.now()}`,
                timestamp: Date.now(),
                text: inputText,
                mediaUrls: mediaFiles.map(m => `data:${m.mimeType};base64,${m.data}`),
                embedding
            };

            setMemories(prev => [newMemory, ...prev]);
            setInputText('');
            setMediaFiles([]);
            addLogEntry('Memória multimodal cristalizada com sucesso.', 'Cofre Semântico');
        } catch (error: any) {
            addLogEntry(`Erro ao salvar memória: ${error.message}`, 'Cofre Semântico');
        } finally {
            setIsProcessing(false);
        }
    };

    // Cosine similarity function
    const cosineSimilarity = (vecA: number[], vecB: number[]) => {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    };

    const handleSearch = async () => {
        if (!searchQuery.trim() || memories.length === 0) return;
        
        setIsSearching(true);
        try {
            const queryEmbedding = await embedMultimodalContent(searchQuery, [], apiKey);
            
            const results = memories.map(memory => ({
                memory,
                score: cosineSimilarity(queryEmbedding, memory.embedding)
            })).sort((a, b) => b.score - a.score).filter(r => r.score > 0.5); // Limiar de similaridade

            setSearchResults(results);
            addLogEntry(`Busca semântica concluída. ${results.length} resultados encontrados.`, 'Cofre Semântico');
        } catch (error: any) {
            addLogEntry(`Erro na busca: ${error.message}`, 'Cofre Semântico');
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="p-6 bg-zinc-950 min-h-full text-zinc-300 font-mono">
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="border-b border-indigo-900/50 pb-6">
                    <h1 className="text-3xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                        <span className="text-indigo-500">🧠</span> Cofre Semântico
                    </h1>
                    <p className="text-zinc-500 mt-2 text-sm">
                        Memória Profunda Multimodal. Guarde textos, imagens e áudios no mesmo espaço vetorial.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Painel de Inserção */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
                        <h2 className="text-xl font-bold text-indigo-400">Cristalizar Nova Memória</h2>
                        
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Descreva a memória, ideia ou contexto..."
                            className="w-full h-32 bg-black/50 border border-zinc-800 rounded-lg p-4 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                        />

                        <div className="flex items-center gap-4">
                            <input 
                                type="file" 
                                multiple 
                                accept="image/*,audio/*"
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg transition-colors"
                            >
                                + ANEXAR MÍDIA
                            </button>
                            <span className="text-xs text-zinc-500">
                                {mediaFiles.length} arquivo(s) anexado(s)
                            </span>
                        </div>

                        {mediaFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {mediaFiles.map((m, i) => (
                                    <div key={i} className="w-16 h-16 bg-black rounded overflow-hidden border border-zinc-800">
                                        {m.mimeType.startsWith('image/') ? (
                                            <img src={`data:${m.mimeType};base64,${m.data}`} alt="preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs text-indigo-400 font-bold">ÁUDIO</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <button 
                            onClick={handleSaveMemory}
                            disabled={isProcessing || (!inputText && mediaFiles.length === 0)}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-black text-sm rounded-lg transition-colors uppercase tracking-wider"
                        >
                            {isProcessing ? 'Vetorizando...' : 'Guardar no Cofre'}
                        </button>
                    </div>

                    {/* Painel de Busca */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
                        <h2 className="text-xl font-bold text-emerald-400">Busca Semântica</h2>
                        
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Busque por significado, não por palavras exatas..."
                                className="flex-1 bg-black/50 border border-zinc-800 rounded-lg p-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <button 
                                onClick={handleSearch}
                                disabled={isSearching || !searchQuery}
                                className="px-6 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-black text-sm rounded-lg transition-colors"
                            >
                                {isSearching ? 'Buscando...' : 'BUSCAR'}
                            </button>
                        </div>

                        <div className="space-y-4 mt-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {searchResults.length > 0 ? (
                                searchResults.map((result, idx) => (
                                    <div key={idx} className="bg-black/40 border border-zinc-800/50 rounded-lg p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs text-zinc-500">
                                                {new Date(result.memory.timestamp).toLocaleString()}
                                            </span>
                                            <span className="text-[10px] font-bold px-2 py-1 bg-emerald-900/30 text-emerald-400 rounded">
                                                {(result.score * 100).toFixed(1)}% MATCH
                                            </span>
                                        </div>
                                        {result.memory.text && (
                                            <p className="text-sm text-zinc-300">{result.memory.text}</p>
                                        )}
                                        {result.memory.mediaUrls.length > 0 && (
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {result.memory.mediaUrls.map((url, i) => (
                                                    url.startsWith('data:image') ? 
                                                    <img key={i} src={url} alt="memory media" className="h-20 rounded border border-zinc-700" /> :
                                                    <audio key={i} src={url} controls className="h-8 w-full max-w-[200px]" />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                searchQuery && !isSearching && (
                                    <div className="text-center text-zinc-600 py-8 text-sm">
                                        Nenhuma memória com significado similar encontrada.
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
