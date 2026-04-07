import React from 'react';
import { loadApiKeys, ApiKeys } from '../utils/keys';

interface KeyForgeProps {
    isOpen: boolean;
    onClose: () => void;
}

const StatusIcon: React.FC<{ active: boolean }> = ({ active }) => {
    if (active) {
        return <svg className="w-5 h-5 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    }
    return <svg className="w-5 h-5 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
};

const KeyStatus: React.FC<{label: string, active: boolean}> = ({ label, active }) => (
    <div className="flex justify-between items-center bg-zinc-900/70 border border-emerald-800 rounded-md px-4 py-3">
        <span className="text-lg font-medium text-emerald-300">{label}</span>
        <div className="flex items-center gap-3">
            <StatusIcon active={active} />
            <span className={`text-sm font-semibold ${active ? 'text-green-300' : 'text-red-300'}`}>
                {active ? 'Ponte Ativa' : 'Ponte Inativa'}
            </span>
        </div>
    </div>
);

const KeyForge: React.FC<KeyForgeProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const forgedKeys = loadApiKeys();

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <style>{`.animate-fade-in { animation: fade-in 0.3s ease-out forwards; } @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }`}</style>
            <div className="bg-zinc-800/80 border border-emerald-700/50 rounded-xl p-6 shadow-2xl shadow-emerald-900/30 w-full max-w-2xl m-4">
                <h2 className="text-2xl font-bold text-emerald-400 mb-2 border-b-2 border-emerald-600/30 pb-2">Status das Pontes Soberanas 🔑</h2>
                <p className="text-sm text-emerald-400 mb-6">As chaves soberanas estão permanentemente forjadas no núcleo. Este painel reflete seu status atual.</p>
                <div className="space-y-4">
                    <KeyStatus label="Ponte Estável (Google AI)" active={!!forgedKeys.google} />
                    <KeyStatus label="Ponte Experimental (Groq)" active={!!forgedKeys.groq} />
                    <KeyStatus label="Ponte Alquímica (Cerebras)" active={!!forgedKeys.cerebras} />
                </div>
                <div className="mt-8 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg shadow-md shadow-emerald-500/20 hover:bg-emerald-500 transition-all">Sair</button>
                </div>
            </div>
        </div>
    );
};

export default KeyForge;