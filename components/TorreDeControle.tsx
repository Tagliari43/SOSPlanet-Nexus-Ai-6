import React, { useState, useEffect } from 'react';
import { Globe, RefreshCw, Send, Settings, Terminal, Radio } from 'lucide-react';
import { getPortalStateFromSupabase, savePortalStateToSupabase } from '../services/supabaseService';

export const TorreDeControle = () => {
    const [state, setState] = useState({
        arrecadado: 0,
        percentual: 0,
        goal: 50000,
        badgeText: "Soberania Planetária",
        projectStatus: "ATIVO",
        headline: "Pela Liberdade, Propósito e Regeneração da Vida.",
        subheadline: "Uma Nação Digital construída sobre os pilares da tecnologia ética, transparência blockchain e amor pela Terra."
    });

    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);

    useEffect(() => {
        // Tenta buscar do Supabase primeiro
        const fetchInitialState = async () => {
            const supabaseState = await getPortalStateFromSupabase();
            if (supabaseState) {
                setState(supabaseState);
                return;
            }
            // Fallback para API local
            try {
                const res = await fetch('/api/portal-state');
                const data = await res.json();
                if (!data.error) setState(data);
            } catch (e) {
                console.error(e);
            }
        };
        fetchInitialState();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setState(s => ({ ...s, [e.target.name]: e.target.value }));
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setState(s => ({ ...s, [e.target.name]: parseFloat(e.target.value) || 0 }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Tenta salvar via Supabase
            const success = await savePortalStateToSupabase(state);
            
            // Independente disso, salva na API local como backup
            await fetch('/api/portal-state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(state)
            });

            if (success) {
                setLastSaved(new Date().toLocaleTimeString() + " (Supabase Sync)");
            } else {
                setLastSaved(new Date().toLocaleTimeString() + " (Local Sync)");
            }
        } catch (e) {
            console.error("Erro ao salvar:", e);
        }
        setIsSaving(false);
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-emerald-900/50 pb-4">
                <div className="flex items-center gap-3">
                    <Radio className="w-6 h-6 text-emerald-400" />
                    <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                            Transmissor Global (Site Externo)
                        </h2>
                        <p className="text-sm text-emerald-500/70">Controle a interface pública do SOSPlanet</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {lastSaved && <span className="text-xs text-emerald-500/70">Salvo: {lastSaved}</span>}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-900/40 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-800/60 transition-all font-mono text-sm"
                    >
                        {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Transmitir Nova Matriz
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Seção Hero */}
                <div className="bg-[#0A0D0B] border border-emerald-900/30 p-5 rounded-xl space-y-4">
                    <h3 className="font-bold text-emerald-500 mb-4 flex items-center gap-2 border-b border-emerald-900/30 pb-2">
                        <Globe className="w-4 h-4" /> Secção Principal (Hero)
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-mono text-emerald-600 mb-1">Badge Title</label>
                            <input 
                                type="text" name="badgeText" value={state.badgeText} onChange={handleChange}
                                className="w-full bg-black/40 border border-emerald-900/30 rounded px-3 py-2 text-sm text-emerald-100 focus:border-emerald-500/50 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-emerald-600 mb-1">Headline (H2)</label>
                            <input 
                                type="text" name="headline" value={state.headline} onChange={handleChange}
                                className="w-full bg-black/40 border border-emerald-900/30 rounded px-3 py-2 text-sm text-emerald-100 focus:border-emerald-500/50 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-emerald-600 mb-1">Sub-Headline (P)</label>
                            <textarea 
                                name="subheadline" value={state.subheadline} onChange={handleChange} rows={3}
                                className="w-full bg-black/40 border border-emerald-900/30 rounded px-3 py-2 text-sm text-emerald-100 focus:border-emerald-500/50 focus:outline-none resize-none"
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Seção Financeira / Projetos */}
                <div className="bg-[#0A0D0B] border border-emerald-900/30 p-5 rounded-xl space-y-4">
                    <h3 className="font-bold text-emerald-500 mb-4 flex items-center gap-2 border-b border-emerald-900/30 pb-2">
                        <Terminal className="w-4 h-4" /> Tesouraria & Progresso
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-mono text-emerald-600 mb-1">Status do Projeto</label>
                            <input 
                                type="text" name="projectStatus" value={state.projectStatus} onChange={handleChange}
                                className="w-full bg-black/40 border border-emerald-900/30 rounded px-3 py-2 text-sm text-emerald-100 focus:border-emerald-500/50 focus:outline-none font-mono"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-mono text-emerald-600 mb-1">SOS Arrecadado</label>
                                <input 
                                    type="number" name="arrecadado" value={state.arrecadado} onChange={handleNumberChange}
                                    className="w-full bg-black/40 border border-emerald-900/30 rounded px-3 py-2 text-sm text-emerald-100 focus:border-emerald-500/50 focus:outline-none font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-emerald-600 mb-1">Percentual (%)</label>
                                <input 
                                    type="number" name="percentual" value={state.percentual} onChange={handleNumberChange} step="0.1"
                                    className="w-full bg-black/40 border border-emerald-900/30 rounded px-3 py-2 text-sm text-emerald-100 focus:border-emerald-500/50 focus:outline-none font-mono"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-emerald-600 mb-1">Meta SOS</label>
                            <input 
                                type="number" name="goal" value={state.goal} onChange={handleNumberChange}
                                className="w-full bg-black/40 border border-emerald-900/30 rounded px-3 py-2 text-sm text-emerald-100 focus:border-emerald-500/50 focus:outline-none font-mono"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-emerald-950/20 border border-emerald-900/40 p-4 rounded-lg flex items-center justify-between">
                <span className="text-sm font-mono text-emerald-600">Acesse o portal externo para verificar as mudanças:</span>
                <a href="/portal.html" target="_blank" className="text-emerald-400 hover:text-emerald-300 font-bold underline flex items-center gap-1">
                    Abrir Portal Externo <Globe className="w-3 h-3" />
                </a>
            </div>
        </div>
    );
};
