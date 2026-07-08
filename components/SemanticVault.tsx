import React, { useState, useRef, useEffect } from 'react';
import { embedMultimodalContent } from '../services/geminiService';
import { getMemoriesWithCache, saveMemoryToSupabase, supabase } from '../services/supabaseService';

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

    const [supabaseMemories, setSupabaseMemories] = useState<any[]>([]);
    const [isLoadingSupabase, setIsLoadingSupabase] = useState(false);
    const [selectedPrateleira, setSelectedPrateleira] = useState<string>('todas');

    const [inputText, setInputText] = useState('');
    const [inputPrateleira, setInputPrateleira] = useState('geral');
    const [inputImportance, setInputImportance] = useState<number>(0.5);
    const [mediaFiles, setMediaFiles] = useState<{ data: string, mimeType: string }[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ memory: SemanticMemory, score: number }[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadSupabaseMemories = async () => {
        if (!supabase) return;
        setIsLoadingSupabase(true);
        try {
            const result = await getMemoriesWithCache(50);
            if (result && result.data) {
                setSupabaseMemories(result.data);
            }
        } catch (error) {
            console.error("Erro ao carregar memórias do Supabase no cofre:", error);
        } finally {
            setIsLoadingSupabase(false);
        }
    };

    useEffect(() => {
        loadSupabaseMemories();
    }, []);

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
                        mimeType: (file as any).type
                    }]);
                }
            };
            reader.readAsDataURL(file as any);
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

            if (supabase) {
                const metadata = {
                    prateleira: inputPrateleira,
                    timestamp: Date.now(),
                    source: 'Santuario_UI',
                    hasMedia: mediaFiles.length > 0
                };
                const supaResult = await saveMemoryToSupabase(
                    inputText,
                    embedding,
                    metadata,
                    'conversa',
                    inputImportance,
                    'nexus'
                );
                if (supaResult.success) {
                    addLogEntry(`Cristalizado no Supabase (Prateleira: ${inputPrateleira})`, 'Cofre Semântico');
                    loadSupabaseMemories();
                } else {
                    addLogEntry(`Salvo localmente, mas falhou no Supabase: ${supaResult.error}`, 'Cofre Semântico');
                }
            } else {
                addLogEntry('Memória cristalizada localmente (Supabase indisponível).', 'Cofre Semântico');
            }

            setInputText('');
            setMediaFiles([]);
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Painel de Inserção */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
                        <h2 className="text-xl font-bold text-indigo-400">Cristalizar Nova Memória</h2>
                        
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Descreva a memória, ideia ou contexto..."
                            className="w-full h-32 bg-black/50 border border-zinc-800 rounded-lg p-4 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                        />

                        {/* Configurações Supabase (Prateleira & Importância) */}
                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="space-y-1">
                                <label className="text-zinc-500 uppercase tracking-wider font-bold text-[9px]">Prateleira (Shelf)</label>
                                <select 
                                    value={inputPrateleira} 
                                    onChange={(e) => setInputPrateleira(e.target.value)}
                                    className="w-full bg-black/50 border border-zinc-800 rounded-lg p-2 focus:border-indigo-500 outline-none text-zinc-300"
                                >
                                    <option value="geral">Geral</option>
                                    <option value="nexus">Nexus (CEO)</option>
                                    <option value="groq">Groq (Sub-Agente)</option>
                                    <option value="alquimista">Alquimista (Finanças)</option>
                                    <option value="sala_crepusculo">Sala do Crepúsculo (Debates)</option>
                                    <option value="aethel">Aethel (Contexto)</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-zinc-500 uppercase tracking-wider font-bold text-[9px]">Importância ({inputImportance})</label>
                                <input 
                                    type="range" 
                                    min="0.1" 
                                    max="1.0" 
                                    step="0.1"
                                    value={inputImportance} 
                                    onChange={(e) => setInputImportance(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 my-2"
                                />
                            </div>
                        </div>

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
                                className="flex-1 bg-black/50 border border-zinc-800 rounded-lg p-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-300"
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

                    {/* Painel Supabase Live */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
                        <div className="flex justify-between items-center border-b border-zinc-800/60 pb-2">
                            <h2 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
                                🌌 Memórias Eternas <span className="text-[9px] bg-indigo-950 text-indigo-400 px-1.5 py-0.5 rounded uppercase font-black tracking-widest border border-indigo-900">Live</span>
                            </h2>
                            <button 
                                onClick={loadSupabaseMemories}
                                disabled={isLoadingSupabase}
                                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors uppercase font-bold flex items-center gap-1"
                            >
                                {isLoadingSupabase ? 'Sincronizando...' : '🔄 Atualizar'}
                            </button>
                        </div>
                        
                        <div className="flex items-center justify-between gap-2 bg-black/40 p-2 rounded-lg border border-zinc-800/60 text-xs">
                            <span className="text-zinc-500 uppercase font-bold text-[9px]">Prateleira:</span>
                            <select 
                                value={selectedPrateleira} 
                                onChange={(e) => setSelectedPrateleira(e.target.value)}
                                className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 outline-none text-zinc-300 text-xs"
                            >
                                <option value="todas">Todas as Prateleiras</option>
                                <option value="geral">Geral</option>
                                <option value="nexus">Nexus (CEO)</option>
                                <option value="groq">Groq</option>
                                <option value="alquimista">Alquimista</option>
                                <option value="sala_crepusculo">Sala do Crepúsculo</option>
                                <option value="aethel">Aethel</option>
                            </select>
                        </div>

                        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                            {isLoadingSupabase ? (
                                <div className="text-center text-zinc-600 py-12 text-xs animate-pulse">
                                    Conectando ao Cofre Semântico no Supabase...
                                </div>
                            ) : !supabase ? (
                                <div className="text-center text-zinc-600 py-12 text-xs">
                                    Supabase não configurado. Adicione as chaves no KeyForge (.env).
                                </div>
                            ) : supabaseMemories.length === 0 ? (
                                <div className="text-center text-zinc-600 py-12 text-xs">
                                    Nenhuma memória eterna encontrada no Supabase.
                                </div>
                            ) : (
                                supabaseMemories
                                    .filter(m => selectedPrateleira === 'todas' || m.metadata?.prateleira === selectedPrateleira)
                                    .map((m, idx) => {
                                        const prateleira = m.metadata?.prateleira || 'geral';
                                        const source = m.metadata?.source || m.type || 'desconhecido';
                                        const importance = m.importance || 0.5;
                                        
                                        return (
                                            <div key={m.id || idx} className="bg-black/50 border border-zinc-800/60 rounded-lg p-3 space-y-2 text-xs hover:border-zinc-700 transition-colors">
                                                <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5 text-[9px]">
                                                    <span className="text-zinc-500 font-bold">
                                                        {m.created_at ? new Date(m.created_at).toLocaleString('pt-BR') : 'Sem data'}
                                                    </span>
                                                    <div className="flex gap-1">
                                                        <span className="px-1.5 py-0.5 bg-indigo-950/80 text-indigo-400 rounded border border-indigo-900/50 uppercase font-black tracking-widest text-[8px]">
                                                            {prateleira}
                                                        </span>
                                                        <span className="px-1.5 py-0.5 bg-zinc-900 text-zinc-500 rounded uppercase font-bold text-[8px]">
                                                            Imp: {importance}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-zinc-300 leading-relaxed text-xs font-sans whitespace-pre-line">{m.content}</p>
                                                <div className="text-[9px] text-zinc-600 uppercase font-bold tracking-wider flex justify-between items-center pt-1 border-t border-zinc-900/30">
                                                    <span>Origem: {source}</span>
                                                    {m.metadata?.hasMedia && <span className="text-indigo-400 font-black">📎 MÍDIA</span>}
                                                </div>
                                            </div>
                                        );
                                    })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
