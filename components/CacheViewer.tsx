
import React from 'react';
import { CacheEntry } from '../hooks/useOrchestrator';

interface CacheViewerProps {
    cache: Record<string, CacheEntry>;
}

const CacheViewer: React.FC<CacheViewerProps> = ({ cache = {} }) => {
    const cacheItems = Object.entries(cache || {});

    return (
        <div className="bg-zinc-800/50 border border-emerald-700/50 rounded-xl p-4 shadow-lg shadow-emerald-900/20 backdrop-blur-sm h-64 flex flex-col">
            <h2 className="text-xl font-bold text-emerald-400 mb-3 border-b-2 border-emerald-600/30 pb-2">Núcleo de Cache Soberano</h2>
            <div className="overflow-y-auto flex-grow">
                {cacheItems.length === 0 ? (
                    <p className="text-zinc-500 text-sm italic p-2">Cache está vazio.</p>
                ) : (
                    <ul className="text-xs space-y-2">
                        {cacheItems.map(([key, entry]: [string, CacheEntry]) => (
                            <li key={key} className="bg-zinc-900/50 p-2 rounded-md">
                                <p className="font-bold text-emerald-400 truncate" title={entry.prompt}>
                                    {entry.prompt}
                                </p>

                                <p className="text-zinc-400 truncate" title={entry.result}>
                                    {entry.result}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default CacheViewer;
