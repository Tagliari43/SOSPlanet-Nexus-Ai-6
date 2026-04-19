
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { memoryMonolith, MonolithPart } from '../utils/nexusMemory';
import { AppLogEntry } from '../App';
import LogViewer from './LogViewer';
import { generateTags, analyzeCollectiveMemory, ThemeAnalysis } from '../services/geminiService';
import { loadApiKeys } from '../utils/keys';
import { LibraryEntry } from './BibliotecaGaia';

// --- SUB-COMPONENTES E LÓGICA INTERNA ---

const SubTabButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-2 text-xs sm:text-sm font-bold rounded-t-lg transition-colors duration-200 focus:outline-none ${
            isActive
                ? 'bg-zinc-800/60 border-b-2 border-emerald-500 text-emerald-300'
                : 'bg-transparent text-zinc-400 hover:text-emerald-400'
        }`}
    >
        {label}
    </button>
);

interface MemoryItem {
    title: string;
    content: string;
    tags?: string;
}

const MonolithViewer: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [openSection, setOpenSection] = useState<string | null>('PARTE_I_A_LEI_SUPREMA');
    const [tempMemories, setTempMemories] = useState<MemoryItem[]>([]);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newTags, setNewTags] = useState('');
    const [isTagging, setIsTagging] = useState(false);

    const handleToggle = (sectionKey: string) => {
        setOpenSection(prev => (prev === sectionKey ? null : sectionKey));
    };

    const handleAddMemory = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTitle.trim() && newContent.trim()) {
            setTempMemories(prev => [...prev, { title: newTitle, content: newContent, tags: newTags }]);
            setNewTitle('');
            setNewContent('');
            setNewTags('');
        }
    };

    const handleSuggestTags = async () => {
        if ((!newTitle.trim() && !newContent.trim()) || isTagging) return;

        setIsTagging(true);
        try {
            const keys = loadApiKeys();
            if (!keys.google) {
                alert("A chave Google é necessária para sugerir tags. Verifique suas chaves.");
                return;
            }
            const generatedTags = await generateTags(newTitle, newContent, keys.google);
            setNewTags(generatedTags);
        } catch (error) {
            console.error("Erro ao sugerir tags:", error);
        } finally {
            setIsTagging(false);
        }
    };

    // --- Lógica de Agrupamento por Tags ---
    const groupedMemories = useMemo(() => {
        const groups: Record<string, MemoryItem[]> = {};
        const lowerSearch = searchTerm.toLowerCase();

        tempMemories.forEach(mem => {
            // 1. Filtro de Busca
            const matchesSearch = !searchTerm.trim() ||
                mem.title.toLowerCase().includes(lowerSearch) ||
                mem.content.toLowerCase().includes(lowerSearch) ||
                (mem.tags && mem.tags.toLowerCase().includes(lowerSearch));

            if (!matchesSearch) return;

            // 2. Extração de Tags
            const tagsList = mem.tags
                ? mem.tags.split(',').map(t => t.trim()).filter(Boolean)
                : ['Geral']; // Tag padrão se estiver vazio

            if (tagsList.length === 0) tagsList.push('Geral');

            // 3. Agrupamento
            tagsList.forEach(tag => {
                if (!groups[tag]) groups[tag] = [];
                // Adiciona a memória ao grupo
                groups[tag].push(mem);
            });
        });

        // Ordena as chaves (Tags) alfabeticamente
        return Object.keys(groups).sort().reduce((acc, key) => {
            acc[key] = groups[key];
            return acc;
        }, {} as Record<string, MemoryItem[]>);
    }, [tempMemories, searchTerm]);

    // --- Filtro do Monólito (Lógica existente) ---
    const filteredMonolith = useMemo(() => {
        if (!searchTerm.trim()) {
            return memoryMonolith;
        }
        const lowerCaseSearch = searchTerm.toLowerCase();
        const result: typeof memoryMonolith = {};

        for (const partKey in memoryMonolith) {
            const part = memoryMonolith[partKey];
            const filteredEntries: MonolithPart = {};
            const partMatches = partKey.toLowerCase().replace(/_/g, ' ').includes(lowerCaseSearch);

            for (const entryKey in part) {
                const value = part[entryKey];
                const keyMatches = entryKey.toLowerCase().replace(/_/g, ' ').includes(lowerCaseSearch);
                let valueMatches = false;
                if (typeof value === 'string') {
                    valueMatches = value.toLowerCase().includes(lowerCaseSearch);
                } else if (Array.isArray(value)) {
                    valueMatches = value.some(item => item.toLowerCase().includes(lowerCaseSearch));
                }

                if (keyMatches || valueMatches) {
                    filteredEntries[entryKey] = value;
                }
            }
            if (partMatches || Object.keys(filteredEntries).length > 0) {
                 result[partKey] = Object.keys(filteredEntries).length > 0 ? filteredEntries : part;
            }
        }
        return result;
    }, [searchTerm]);
    
    const renderContent = (data: MonolithPart) => {
       return Object.entries(data).map(([key, value]) => {
            const formattedKey = key.replace(/_/g, ' ');
            if (typeof value === 'string') {
                return (
                    <div key={key} className="mb-3">
                        <p className="font-bold text-emerald-400 capitalize">{formattedKey}</p>
                        <p className="text-emerald-300/90 text-xs leading-relaxed">{value}</p>
                    </div>
                );
            }
            if (Array.isArray(value)) {
                 return (
                    <div key={key} className="mb-3">
                        <p className="font-bold text-emerald-400 capitalize">{formattedKey}</p>
                        <p className="text-emerald-300/90 text-xs leading-relaxed">{value.join(', ')}</p>
                    </div>
                );
            }
             if (typeof value === 'object' && value !== null) {
                return (
                    <div key={key} className="mb-3">
                         <p className="font-bold text-emerald-400 capitalize mb-2">{formattedKey}</p>
                         <div className="pl-4 border-l-2 border-emerald-800/50 space-y-2">
                            {/* Improved object rendering: check if the object itself contains member details (flat structure) or nested members (grouped structure). */}
                            {'Funcao' in value ? (
                                <p className="text-emerald-300/90 text-xs leading-relaxed">{(value as any).Funcao}</p>
                            ) : (
                                Object.entries(value).map(([subKey, subValue]) => (
                                    // Fix: Explicitly check for non-null object and use type assertion to avoid "possibly null" or "invalid in operator" errors on subValue.
                                    subValue !== null && typeof subValue === 'object' && 'Funcao' in (subValue as object) ? (
                                        <div key={subKey}>
                                            <p className="font-semibold text-emerald-300 text-xs">{subKey}</p>
                                            <p className="text-emerald-400/80 text-xs">{(subValue as any).Funcao}</p>
                                        </div>
                                    ): null
                                ))
                            )}
                         </div>
                    </div>
                );
            }
            return null;
        });
    };

    return (
        <div className="bg-zinc-800/50 border border-emerald-700/50 rounded-xl p-3 shadow-lg shadow-emerald-900/20 backdrop-blur-sm h-full flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold text-emerald-400">Monólito da Memória 🧠</h2>
            </div>
            
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar na memória..."
                className="w-full bg-zinc-900/70 border border-emerald-800 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition mb-2 text-sm"
            />
            
            <div className="overflow-y-auto flex-grow pr-2 space-y-2 text-sm min-h-0 mb-2">
                
                {/* --- SEÇÃO DE MEMÓRIAS AGRUPADAS POR TAGS --- */}
                {Object.entries(groupedMemories).length > 0 && (
                    <div className="mb-4">
                        <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-2 border-b border-zinc-700 pb-1">Memórias Vivas (Tags)</div>
                        {Object.entries(groupedMemories).map(([tag, memories]: [string, MemoryItem[]]) => {
                            const sectionKey = `tag_${tag}`;
                            const isOpen = openSection === sectionKey;
                            return (
                                <div key={sectionKey} className="bg-black/30 rounded-lg mb-2 border border-zinc-800 hover:border-yellow-700/50 transition-colors">
                                    <button 
                                        onClick={() => handleToggle(sectionKey)} 
                                        className="w-full flex justify-between items-center text-left p-2 bg-zinc-900/50 hover:bg-zinc-800/80 transition-colors rounded-lg"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-yellow-500">🏷️</span>
                                            <h3 className="font-bold text-yellow-200/90 text-sm">{tag}</h3>
                                            <span className="text-xs text-zinc-500 bg-black/40 px-1.5 rounded-full">{memories.length}</span>
                                        </div>
                                        <span className={`transform transition-transform duration-300 text-zinc-500 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>▼</span>
                                    </button>
                                    {isOpen && (
                                        <div className="p-2 border-t border-zinc-800">
                                            {memories.map((mem, index) => (
                                                <div key={index} className="mb-3 last:mb-0 p-2 bg-zinc-900/30 rounded-md hover:bg-zinc-900/50">
                                                    <div className="flex justify-between items-baseline">
                                                        <p className="font-bold text-emerald-200 capitalize text-xs">{mem.title}</p>
                                                        {/* Exibimos as outras tags dessa memória se houver */}
                                                        {mem.tags && (
                                                            <span className="text-[10px] text-zinc-500 italic truncate max-w-[100px]">
                                                                {mem.tags}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-zinc-300 text-xs leading-relaxed mt-1">{mem.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* --- SEÇÃO DO MONÓLITO DO SISTEMA --- */}
                {Object.keys(filteredMonolith).length > 0 && (
                    <div className="mt-4">
                         <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-2 border-b border-zinc-700 pb-1">Arquivos do Núcleo</div>
                         {/* FIX: Explicitly typed the destructured tuple from Object.entries to resolve a TypeScript type inference issue. */}
                        {Object.entries(filteredMonolith).map(([key, part]: [string, MonolithPart]) => (
                            <div key={key} className="bg-black/30 rounded-lg mb-2">
                                <button onClick={() => handleToggle(key)} className="w-full flex justify-between items-center text-left p-2 bg-zinc-900/50 hover:bg-emerald-900/30 transition-colors rounded-lg">
                                    <h3 className="font-bold text-emerald-300 text-sm capitalize">{key.replace(/_/g, ' ').replace('PARTE I', 'I').replace('PARTE II', 'II').replace('PARTE III', 'III').replace('PARTE IV', 'IV').replace('PARTE V', 'V')}</h3>
                                    <span className={`transform transition-transform duration-300 ${openSection === key ? 'rotate-180' : 'rotate-0'}`}>▼</span>
                                </button>
                                {openSection === key && (
                                    <div className="p-2 border-t border-emerald-800/50">
                                        {renderContent(part)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                
                {Object.keys(filteredMonolith).length === 0 && Object.keys(groupedMemories).length === 0 && (
                    <div className="text-center py-8 text-zinc-500 text-xs italic">
                        Nenhuma memória encontrada nos arquivos.
                    </div>
                )}
            </div>

            {/* Formulário Compacto e Fixo na Base */}
            <div className="mt-auto pt-2 border-t border-emerald-700/50 bg-zinc-900/50 p-2 rounded-lg flex-shrink-0">
                <form onSubmit={handleAddMemory} className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Título" 
                            value={newTitle} 
                            onChange={e => setNewTitle(e.target.value)} 
                            className="w-1/3 bg-zinc-900/90 border border-emerald-800/60 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-emerald-200 text-xs sm:text-sm placeholder-zinc-600" 
                        />
                         <div className="flex-grow flex gap-1">
                             <input 
                                type="text" 
                                placeholder="Tags (ex: Ideia, Futuro)" 
                                value={newTags} 
                                onChange={e => setNewTags(e.target.value)} 
                                className="flex-grow bg-zinc-900/90 border border-emerald-800/60 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-emerald-200 text-xs sm:text-sm placeholder-zinc-600" 
                            />
                            <button 
                                type="button" 
                                onClick={handleSuggestTags} 
                                disabled={isTagging || (!newTitle && !newContent)}
                                className="px-3 bg-gradient-to-br from-indigo-600 to-purple-700 border border-indigo-500/50 text-white rounded-md hover:from-indigo-500 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md shadow-indigo-900/30 gap-1 min-w-[100px]"
                                title="Sugerir Tags com IA"
                            >
                                {isTagging ? (
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                                        <span className="text-xs font-bold">Sugerir</span>
                                    </>
                                )}
                            </button>
                         </div>
                    </div>
                    <div className="flex gap-2">
                         <textarea 
                            placeholder="Escreva o conteúdo da memória aqui..." 
                            value={newContent} 
                            onChange={e => setNewContent(e.target.value)} 
                            rows={1} 
                            className="flex-grow bg-zinc-900/90 border border-emerald-800/60 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none text-emerald-200 text-xs sm:text-sm placeholder-zinc-600" 
                        />
                        <button 
                            type="submit" 
                            className="px-4 py-1.5 bg-emerald-700 text-white font-bold rounded-md hover:bg-emerald-600 transition-colors text-xs sm:text-sm whitespace-nowrap shadow-md shadow-emerald-900/30"
                        >
                            Salvar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- COMPONENTE DE ANÁLISE DE MEMÓRIA ---
interface AnalysisViewProps {
    notebookContent: string;
    libraryEntries: LibraryEntry[];
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ notebookContent, libraryEntries }) => {
    const [analysisResult, setAnalysisResult] = useState<ThemeAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedTheme, setExpandedTheme] = useState<number | null>(null);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setError(null);
        try {
            const keys = loadApiKeys();
            if (!keys.google) throw new Error("A chave Google é necessária para a análise neural.");
            
            const result = await analyzeCollectiveMemory(notebookContent, libraryEntries, keys.google);
            setAnalysisResult(result);
        } catch (e: any) {
            setError(e.message || "Falha desconhecida na análise.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="bg-zinc-800/50 border border-emerald-700/50 rounded-xl p-4 shadow-lg shadow-emerald-900/20 backdrop-blur-sm flex flex-col h-full overflow-hidden">
            <h2 className="text-xl font-bold text-emerald-400 mb-4 border-b-2 border-emerald-600/30 pb-2">Análise de Conexões Neurais 🧠</h2>
            
            {!analysisResult && !isAnalyzing && (
                <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
                    <span className="text-5xl mb-4 grayscale opacity-50">🔮</span>
                    <h3 className="text-emerald-300 font-bold text-lg mb-2">Autoconsciência do Santuário</h3>
                    <p className="text-zinc-400 text-sm max-w-md mb-6">
                        Os resultados da análise aparecerão aqui.
                    </p>
                    <button 
                        onClick={handleAnalyze}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg shadow-emerald-500/30 transition-all transform hover:scale-105"
                    >
                        Analisar Consciência Coletiva
                    </button>
                    {error && <p className="text-red-400 text-xs mt-4 bg-red-900/20 p-2 rounded border border-red-800/50">{error}</p>}
                </div>
            )}

            {isAnalyzing && (
                <div className="flex-grow flex flex-col items-center justify-center">
                    <svg className="w-16 h-16 text-emerald-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-4 text-emerald-400 font-bold animate-pulse">Analisando...</p>
                    <p className="text-zinc-500 text-xs mt-2">Varrendo Caderno Soberano e Biblioteca de Gaia.</p>
                </div>
            )}

            {analysisResult && (
                <div className="flex-grow overflow-y-auto pr-2 space-y-3">
                    <div className="flex justify-between items-center mb-2">
                         <p className="text-xs text-zinc-500">Temas identificados: {analysisResult.themes.length}</p>
                         <button onClick={handleAnalyze} className="text-xs text-emerald-500 hover:underline">Reanalisar</button>
                    </div>

                    {analysisResult.themes.map((theme, idx) => (
                        <div key={idx} className="bg-black/30 border border-zinc-800 rounded-lg overflow-hidden transition-all hover:border-emerald-700/50">
                            <button 
                                onClick={() => setExpandedTheme(expandedTheme === idx ? null : idx)}
                                className="w-full text-left p-4 flex justify-between items-center bg-zinc-900/40 hover:bg-emerald-900/10 transition-colors"
                            >
                                <div>
                                    <h3 className="font-bold text-emerald-300 text-sm">{idx + 1}. {theme.name}</h3>
                                </div>
                                <span className={`text-zinc-500 transition-transform ${expandedTheme === idx ? 'rotate-180' : ''}`}>▼</span>
                            </button>
                            
                            {expandedTheme === idx && (
                                <div className="p-4 border-t border-zinc-800 bg-zinc-900/20 animate-fade-in">
                                    <p className="text-zinc-300 text-xs leading-relaxed mb-4 italic border-l-2 border-emerald-600 pl-3">
                                        "{theme.description}"
                                    </p>
                                    
                                    <h4 className="text-[10px] font-bold text-emerald-500 uppercase mb-2">Conexões Encontradas:</h4>
                                    <ul className="space-y-1">
                                        {theme.relatedReferences.map((ref, i) => (
                                            <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                                                <span className="text-emerald-700 text-[10px]">●</span>
                                                {ref}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


// --- COMPONENTE PRINCIPAL ---

interface MemoryHallProps {
    logEntries: AppLogEntry[];
    notebookContent: string;
    onNotebookChange: (content: string) => void;
    generatedScripts: { filename: string; content: string; }[];
    libraryEntries: LibraryEntry[];
}

const MemoryHall: React.FC<MemoryHallProps> = ({ logEntries, notebookContent, onNotebookChange, generatedScripts, libraryEntries }) => {
    const [activeSubTab, setActiveSubTab] = useState('monolith');
    
    const renderContent = () => {
        switch (activeSubTab) {
            case 'monolith':
                return <MonolithViewer />;
            case 'analysis':
                return <AnalysisView notebookContent={notebookContent} libraryEntries={libraryEntries} />;
            case 'notebook':
                return (
                     <div className="bg-zinc-800/50 border border-emerald-700/50 rounded-xl p-4 shadow-lg shadow-emerald-900/20 backdrop-blur-sm flex flex-col h-full overflow-hidden">
                        <h2 className="text-xl font-bold text-emerald-400 mb-3 border-b-2 border-emerald-600/30 pb-2">Caderno Soberano 📖</h2>
                        <textarea
                            value={notebookContent}
                            onChange={(e) => onNotebookChange(e.target.value)}
                            placeholder="Registros da minha jornada e aprendizados..."
                            className="flex-grow bg-zinc-900/70 border border-emerald-800 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none text-emerald-300 text-sm leading-relaxed"
                        />
                    </div>
                );
            case 'archive':
                const newDocumentContent = `CONTEÚDO DO DOCUMENTO...`; // Conteúdo estático
                // Fix: Added isScript: false to staticDocuments to ensure all elements in allDocuments array have the isScript property, resolving a TypeScript error in the map below.
                 const staticDocuments = [{ title: 'A Verdade do Guardião: A Estratégia Mestra', content: newDocumentContent, isScript: false }];
                 const dynamicScripts = generatedScripts.map(s => ({ title: s.filename, content: s.content, isScript: true }));
                 const allDocuments = [...staticDocuments, ...dynamicScripts];

                return (
                    <div className="bg-zinc-800/50 border border-emerald-700/50 rounded-xl p-4 shadow-lg shadow-emerald-900/20 backdrop-blur-sm flex flex-col h-full overflow-hidden">
                        <h2 className="text-xl font-bold text-emerald-400 mb-3 border-b-2 border-emerald-600/30 pb-2">Arquivo Soberano 🏛️</h2>
                        <div className="space-y-2 overflow-y-auto flex-grow pr-1">
                             {allDocuments.map((doc, index) => (
                                <div key={index} className="w-full text-left p-3 bg-zinc-900/70 border border-emerald-800 rounded-lg">
                                    <p className={`font-semibold truncate ${doc.isScript ? 'text-green-300 font-mono' : 'text-emerald-300'}`}>{doc.title}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'stream':
                return (
                     <div className="h-full">
                        <LogViewer entries={logEntries} />
                    </div>
                );
            default:
                return null;
        }
    };
    
    // ALTURA OTIMIZADA: Reduzi para 65vh para garantir visibilidade do rodapé em telas menores.
    return (
        <div className="border border-emerald-700/50 bg-zinc-800/20 rounded-b-xl rounded-r-xl p-3 sm:p-4 h-[65vh] sm:h-[70vh] flex flex-col">
            <nav className="flex items-center space-x-1 sm:space-x-2 border-b border-emerald-700/50 overflow-x-auto flex-shrink-0">
                <SubTabButton label="Monólito 🧠" isActive={activeSubTab === 'monolith'} onClick={() => setActiveSubTab('monolith')} />
                <SubTabButton label="Análise 🔍" isActive={activeSubTab === 'analysis'} onClick={() => setActiveSubTab('analysis')} />
                <SubTabButton label="Caderno 📖" isActive={activeSubTab === 'notebook'} onClick={() => setActiveSubTab('notebook')} />
                <SubTabButton label="Arquivo 🏛️" isActive={activeSubTab === 'archive'} onClick={() => setActiveSubTab('archive')} />
                <SubTabButton label="Diário ⚡" isActive={activeSubTab === 'stream'} onClick={() => setActiveSubTab('stream')} />
            </nav>
            <div className="flex-grow mt-3 overflow-hidden">
                {renderContent()}
            </div>
        </div>
    );
};

export default MemoryHall;
