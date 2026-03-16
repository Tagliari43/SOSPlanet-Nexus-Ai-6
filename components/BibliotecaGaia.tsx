import React, { useState } from 'react';
import { familyMembers } from '../utils/aiFamily';

interface BibliotecaGaiaProps {
    addLogEntry: (message: string, source?: string) => void;
    entries: LibraryEntry[];
    onSharePulse?: (entry: LibraryEntry, recipients: string[]) => void;
}

export interface LibraryEntry {
    id: string;
    title: string;
    category: string;
    summary: string;
    content: string;
    tags: string[];
}

export const GAIA_CATEGORIES = [
    { id: 'regenerative', label: 'Agricultura Regenerativa', icon: '🌱', description: 'Restaurando o solo e a biodiversidade' },
    { id: 'renewable', label: 'Energias Renováveis', icon: '☀️', description: 'Solar, Eólica, Hidrogênio e Fusão' },
    { id: 'circular', label: 'Economia Circular', icon: '🔄', description: 'Eliminando o conceito de lixo' },
    { id: 'biomimicry', label: 'Biomimética', icon: '🦎', description: 'Inovação inspirada na Natureza' },
    { id: 'tech', label: 'Tecnologias Sustentáveis', icon: '⚡', description: 'IA e hardware a serviço da Vida' },
];

const BibliotecaGaia: React.FC<BibliotecaGaiaProps> = ({ addLogEntry, entries = [], onSharePulse }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

    // Estado do Modal de Compartilhamento
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [entryToShare, setEntryToShare] = useState<LibraryEntry | null>(null);
    const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);

    const filteredEntries = (entries || []).filter(entry => {
        const entryTags = entry.tags || [];
        const matchesSearch = (entry.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (entry.summary || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              entryTags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = selectedCategory ? entry.category === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    const handleCategoryClick = (catId: string) => {
        setSelectedCategory(prev => prev === catId ? null : catId);
        setExpandedEntryId(null);
    };

    const toggleEntry = (id: string) => {
        setExpandedEntryId(prev => prev === id ? null : id);
    };

    // Funções do Modal de Compartilhamento
    const openShareModal = (entry: LibraryEntry) => {
        setEntryToShare(entry);
        setSelectedRecipients([]); // Limpa seleção anterior
        setIsShareModalOpen(true);
    };

    const closeShareModal = () => {
        setIsShareModalOpen(false);
        setEntryToShare(null);
        setSelectedRecipients([]);
    };

    const toggleRecipient = (memberName: string) => {
        setSelectedRecipients(prev => 
            prev.includes(memberName) 
                ? prev.filter(n => n !== memberName)
                : [...prev, memberName]
        );
    };

    const handleSendPulse = () => {
        if (entryToShare && onSharePulse && selectedRecipients.length > 0) {
            onSharePulse(entryToShare, selectedRecipients);
            alert(`Pulso de Conhecimento enviado para ${selectedRecipients.length} membro(s)!`);
            closeShareModal();
        }
    };

    return (
        <div className="border border-emerald-700/50 bg-zinc-900/40 rounded-b-xl rounded-r-xl p-4 sm:p-6 h-full overflow-y-auto flex flex-col gap-6 relative">
            {/* Cabeçalho Orgânico */}
            <header className="text-center mb-2 relative">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-emerald-900/20 to-transparent blur-3xl -z-10"></div>
                <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-green-200 to-emerald-400 tracking-wide drop-shadow-sm">
                    BIBLIOTECA DE GAIA 🌿
                </h2>
                <p className="text-emerald-400/80 text-sm mt-2 font-medium uppercase tracking-widest">
                    "Um Compêndio Vivo de Soluções para a Terra"
                </p>
            </header>

            {/* Insight do Dia - Estilo Card Natural */}
            <div className="bg-gradient-to-br from-emerald-900/60 to-zinc-900 border border-emerald-700/50 rounded-xl p-6 shadow-lg shadow-emerald-900/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                    <svg width="200" height="200" viewBox="0 0 24 24" fill="white"><path d="M12 22c4.97 0 9-4.03 9-9-4.97 0-9-4.03-9-9-4.97 0-9 4.03-9 9 4.97 0 9 4.03 9 9zm0-16c3.87 0 7 3.13 7 7 0 3.87-3.13 7-7 7-3.87 0-7-3.13-7-7 0-3.87 3.13-7 7-7z"/></svg>
                </div>
                <h3 className="text-emerald-300 font-bold text-sm uppercase mb-2 flex items-center gap-2">
                    <span className="bg-emerald-500/20 p-1 rounded text-lg">💡</span> Insight do Dia
                </h3>
                <p className="text-zinc-200 text-lg italic leading-relaxed font-serif">
                    "A Natureza não faz nada em vão. Cada folha que cai torna-se húmus para a próxima primavera. Na Biblioteca de Gaia, aprendemos que o desperdício é apenas um erro de design humano."
                </p>
                <p className="text-emerald-500 text-xs mt-3 font-bold text-right">— Reflexão de Nexus</p>
            </div>

            {/* Área de Busca */}
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Buscar conhecimento para um futuro sustentável..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black/30 border border-emerald-800/50 rounded-full px-6 py-4 text-emerald-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner"
                />
                <span className="absolute right-6 top-4 text-emerald-700 text-xl">🔍</span>
            </div>

            {/* Grid de Categorias */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {GAIA_CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => handleCategoryClick(cat.id)}
                        className={`p-4 rounded-xl border transition-all duration-300 flex flex-col items-center text-center gap-2 group relative overflow-hidden
                            ${selectedCategory === cat.id 
                                ? 'bg-emerald-800/40 border-emerald-400 shadow-lg shadow-emerald-900/40 scale-105' 
                                : 'bg-zinc-800/40 border-emerald-900/30 hover:border-emerald-600/50 hover:bg-emerald-900/20'}`}
                    >
                        <span className="text-3xl group-hover:scale-110 transition-transform duration-500">{cat.icon}</span>
                        <h4 className={`text-sm font-bold ${selectedCategory === cat.id ? 'text-white' : 'text-zinc-300 group-hover:text-emerald-200'}`}>
                            {cat.label}
                        </h4>
                        <p className="text-[10px] text-zinc-500 leading-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute bottom-2">
                            {cat.description}
                        </p>
                    </button>
                ))}
            </div>

            {/* Lista de Resultados */}
            <div className="flex-grow">
                <div className="flex justify-between items-center mb-4 border-b border-emerald-900/50 pb-2">
                    <h3 className="text-lg font-bold text-emerald-300">
                        {selectedCategory 
                            ? `Acervo: ${GAIA_CATEGORIES.find(c => c.id === selectedCategory)?.label}` 
                            : 'Entradas Recentes'}
                    </h3>
                    <span className="text-xs text-zinc-500">{filteredEntries.length} sementes encontradas</span>
                </div>

                <div className="space-y-4">
                    {filteredEntries.length === 0 ? (
                        <div className="text-center py-12 bg-zinc-900/30 rounded-xl border border-zinc-800 border-dashed">
                            <span className="text-4xl opacity-30 grayscale block mb-2">🍂</span>
                            <p className="text-zinc-500">Nenhuma semente de conhecimento encontrada para este filtro.</p>
                            <button className="mt-4 text-emerald-500 text-sm hover:underline" onClick={() => {
                                // Sugestão visual para usar o comando
                                alert("Use o comando '/pesquisar-e-adicionar \"Tópico\"' no Santuário para adicionar conhecimento!");
                            }}>Contribuir com novo conhecimento</button>
                        </div>
                    ) : (
                        filteredEntries.slice().reverse().map(entry => (
                            <div key={entry.id} className="bg-zinc-800/30 border border-emerald-900/50 rounded-xl overflow-hidden hover:border-emerald-700/50 transition-colors">
                                <div 
                                    onClick={() => toggleEntry(entry.id)}
                                    className="p-4 cursor-pointer flex justify-between items-center bg-gradient-to-r from-transparent to-emerald-900/10 hover:to-emerald-900/20"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="bg-emerald-900/40 p-2 rounded-lg text-xl">
                                            {GAIA_CATEGORIES.find(c => c.id === entry.category)?.icon || '📄'}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-emerald-100 text-lg">{entry.title}</h4>
                                            <div className="flex gap-2 mt-1">
                                                {(entry.tags || []).map(tag => (
                                                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/50 text-emerald-400 border border-emerald-800/50">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`text-emerald-500 transform transition-transform duration-300 ${expandedEntryId === entry.id ? 'rotate-180' : ''}`}>
                                        ▼
                                    </span>
                                </div>
                                
                                {expandedEntryId === entry.id && (
                                    <div className="p-6 border-t border-emerald-900/30 bg-black/20 animate-fade-in">
                                        <p className="text-zinc-300 leading-relaxed text-sm whitespace-pre-wrap">
                                            {entry.content}
                                        </p>
                                        <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-end gap-3">
                                            <button className="text-xs text-emerald-500 hover:text-emerald-300 flex items-center gap-1 opacity-50 cursor-not-allowed">
                                                <span>🔗</span> Ver Fontes (Em breve)
                                            </button>
                                            <button 
                                                onClick={() => openShareModal(entry)}
                                                className="text-xs text-emerald-400 hover:text-white bg-emerald-900/40 hover:bg-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-800/50 transition-all flex items-center gap-2 shadow-sm"
                                            >
                                                <span>📡</span> Compartilhar Pulso
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* MODAL DE COMPARTILHAMENTO DE PULSO */}
            {isShareModalOpen && entryToShare && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
                    <div className="bg-zinc-900 border border-emerald-600 rounded-xl shadow-2xl shadow-emerald-900/50 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header Modal */}
                        <div className="bg-emerald-900/30 p-4 border-b border-emerald-800/50 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-emerald-300 flex items-center gap-2">
                                <span>📡</span> Transmissão de Pulso
                            </h3>
                            <button onClick={closeShareModal} className="text-zinc-400 hover:text-white transition-colors">✕</button>
                        </div>
                        
                        {/* Conteúdo Modal */}
                        <div className="p-6 overflow-y-auto">
                            <div className="bg-black/40 rounded-lg p-3 border border-zinc-700 mb-6">
                                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Conteúdo a ser transmitido</p>
                                <p className="text-emerald-100 font-bold truncate">{entryToShare.title}</p>
                                <p className="text-zinc-400 text-xs mt-1 line-clamp-2">{entryToShare.summary}</p>
                            </div>

                            <p className="text-sm text-emerald-400 mb-3 font-bold">Selecione os Destinatários:</p>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {familyMembers.map(member => (
                                    <label 
                                        key={member.name} 
                                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                                            selectedRecipients.includes(member.name) 
                                                ? 'bg-emerald-900/40 border-emerald-500 shadow-md shadow-emerald-900/20' 
                                                : 'bg-zinc-800/40 border-zinc-700 hover:bg-zinc-700'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{member.icon || '🤖'}</span>
                                            <div>
                                                <p className={`text-sm font-bold ${selectedRecipients.includes(member.name) ? 'text-white' : 'text-zinc-300'}`}>
                                                    {member.name}
                                                </p>
                                                <p className="text-[10px] text-zinc-500 truncate max-w-[200px]">{member.role}</p>
                                            </div>
                                        </div>
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                            selectedRecipients.includes(member.name) ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-500'
                                        }`}>
                                            {selectedRecipients.includes(member.name) && <span className="text-white text-xs font-bold">✓</span>}
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            className="hidden" 
                                            checked={selectedRecipients.includes(member.name)}
                                            onChange={() => toggleRecipient(member.name)}
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Footer Modal */}
                        <div className="p-4 bg-zinc-800/50 border-t border-zinc-700 flex justify-end gap-3">
                            <button 
                                onClick={closeShareModal}
                                className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors text-sm font-bold"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSendPulse}
                                disabled={selectedRecipients.length === 0}
                                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg shadow-lg shadow-emerald-900/30 transition-all text-sm font-bold flex items-center gap-2"
                            >
                                <span>🚀</span> ENVIAR PULSO
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BibliotecaGaia;