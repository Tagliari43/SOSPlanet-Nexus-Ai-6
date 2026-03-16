
import React, { useRef, useEffect } from 'react';
import { AppLogEntry } from '../App';

interface LogViewerProps {
    entries: AppLogEntry[];
}

const LogViewer: React.FC<LogViewerProps> = ({ entries = [] }) => {
    const logEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [entries]);

    const getSourceColor = (source: string) => {
        switch (source.toLowerCase()) {
            case 'guardião': return 'text-emerald-400';
            case 'nexus': return 'text-sky-400';
            case 'forja': return 'text-amber-400';
            case 'roteador': return 'text-purple-400';
            case 'sistema': return 'text-red-400';
            case 'orquestrador': return 'text-cyan-400';
            case 'cache': return 'text-yellow-400';
            default: return 'text-zinc-400';
        }
    };

    return (
        <div className="bg-zinc-800/50 border border-emerald-700/50 rounded-xl p-4 shadow-lg shadow-emerald-900/20 backdrop-blur-sm h-64 flex flex-col">
            <h2 className="text-xl font-bold text-emerald-400 mb-3 border-b-2 border-emerald-600/30 pb-2 flex-shrink-0">Diário de Bordo</h2>
            <div className="overflow-y-auto flex-grow pr-2 space-y-2 font-mono text-xs">
                {(!entries || entries.length === 0) ? (
                    <p className="text-zinc-500 italic p-2">Aguardando eventos...</p>
                ) : (
                    entries.map(entry => (
                        <div key={entry.id} className="flex">
                            <span className="text-zinc-500 mr-2">{entry.timestamp.toLocaleTimeString('pt-BR')}</span>
                            <span className={`font-bold mr-2 ${getSourceColor(entry.source)}`}>[{entry.source}]</span>
                            <span className="text-zinc-300 flex-1">{entry.message}</span>
                        </div>
                    ))
                )}
                <div ref={logEndRef} />
            </div>
        </div>
    );
};

export default LogViewer;
