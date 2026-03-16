
import React, { useState } from 'react';
import { LibraryEntry } from './BibliotecaGaia';

interface EchoScannerProps {
    onAddLibraryEntry?: (entry: Omit<LibraryEntry, 'id'>) => void;
    scannerState: any; // Recebe o estado do hook useScanner instanciado no App.tsx
}

const EchoScanner: React.FC<EchoScannerProps> = ({ onAddLibraryEntry, scannerState }) => {
    const { isScanning, target, setTarget, results, logs, progress, startScan, analyzeNode } = scannerState;
    const [savedNodes, setSavedNodes] = useState<Set<string>>(new Set());
    const [notification, setNotification] = useState<string | null>(null);
    const [manualEntryNode, setManualEntryNode] = useState<string | null>(null);
    const [manualSummary, setManualSummary] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startScan(target);
    };

    const handleSaveToLibrary = (nodeId: string, summary?: string) => {
        if (!onAddLibraryEntry) return;
        const node = results.find((n: any) => n.id === nodeId);
        if (!node) return;

        const finalSummary = summary || node.analysis || `Inteligência capturada via sonar ECHO.`;
        let category = 'tech';
        const t = target.toLowerCase();
        if (t.includes('agro') || t.includes('plant')) category = 'regenerative';
        else if (t.includes('ener') || t.includes('solar')) category = 'renewable';

        const newEntry: Omit<LibraryEntry, 'id'> = {
            title: node.title,
            category: category,
            summary: `Mapeado via ECHO: "${target}".`,
            content: `URL: ${node.url}\n\nDOSSIÊ:\n${finalSummary}`,
            tags: [target, 'ECHO', summary ? 'Manual' : 'AI']
        };

        onAddLibraryEntry(newEntry);
        setSavedNodes(prev => new Set(prev).add(nodeId));
        setManualEntryNode(null);
        setManualSummary('');
        setNotification(`"${node.title}" salvo!`);
        setTimeout(() => setNotification(null), 3000);
    };

    return (
        <div className="flex flex-col gap-4 h-full overflow-hidden relative">
            {notification && <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2 rounded-full text-xs font-bold border border-emerald-400 shadow-lg animate-bounce">✨ {notification}</div>}

            {/* MODAL MANUAL */}
            {manualEntryNode && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-yellow-600/50 rounded-xl p-6 max-w-lg w-full">
                        <h3 className="text-xl font-bold text-yellow-400 mb-4">Intervenção Manual</h3>
                        <textarea value={manualSummary} onChange={(e) => setManualSummary(e.target.value)} placeholder="O que você viu neste site?" className="w-full h-32 bg-black/40 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 mb-4 outline-none focus:border-yellow-500" />
                        <div className="flex gap-2">
                            <button onClick={() => setManualEntryNode(null)} className="flex-1 py-2 bg-zinc-800 text-zinc-400 rounded-lg">CANCELAR</button>
                            <button onClick={() => handleSaveToLibrary(manualEntryNode, manualSummary)} disabled={!manualSummary.trim()} className="flex-[2] py-2 bg-yellow-600 text-white font-bold rounded-lg disabled:opacity-50">SALVAR</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-zinc-900/60 border border-emerald-700/50 rounded-xl p-4">
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                    <input type="text" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Alvo da varredura..." className="flex-grow bg-black/40 border border-emerald-800/50 rounded-lg px-4 py-3 text-emerald-100 outline-none focus:border-emerald-500" disabled={isScanning} />
                    <button type="submit" disabled={isScanning || !target.trim()} className={`px-8 py-3 rounded-lg font-bold text-white transition-all ${isScanning ? 'bg-zinc-700' : 'bg-emerald-600 hover:bg-emerald-500'}`}>{isScanning ? 'VARRENDO...' : 'INICIAR ECHO'}</button>
                </form>
                {isScanning && <div className="mt-4 w-full bg-black/50 h-1.5 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${progress}%` }}></div></div>}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-grow min-h-0">
                <div className="lg:col-span-1 bg-black/40 border border-zinc-800 rounded-xl p-3 overflow-y-auto font-mono text-[10px]">
                    {logs.map((log: any) => (<div key={log.id} className={`flex gap-2 ${log.type === 'success' ? 'text-emerald-400' : log.type === 'error' ? 'text-red-400' : 'text-zinc-400'}`}><span>[{log.timestamp.toLocaleTimeString()}]</span>{log.message}</div>))}
                </div>
                <div className="lg:col-span-2 bg-black/20 border border-emerald-900/30 rounded-xl p-4 overflow-y-auto space-y-3">
                    {results.map((node: any) => (
                        <div key={node.id} className={`bg-zinc-900/80 border rounded-lg p-3 ${node.status === 'analyzed' ? 'border-blue-500/50' : 'border-zinc-800'}`}>
                            <div className="flex justify-between items-start">
                                <div className="min-w-0 flex-grow"><h5 className="font-bold text-emerald-100 truncate">{node.title}</h5><p className="text-zinc-500 text-[10px] truncate">{node.url}</p></div>
                                <div className="flex gap-2">
                                    <button onClick={() => analyzeNode(node.id)} disabled={node.isAnalyzing || node.status === 'analyzed'} className={`px-3 py-2 rounded text-[10px] font-bold ${node.status === 'analyzed' ? 'bg-blue-600 text-white' : 'bg-emerald-700 text-white'}`}>
                                        {node.isAnalyzing ? '...' : node.status === 'analyzed' ? 'Ok' : 'Analisar'}
                                    </button>
                                    {node.status === 'failed' && <button onClick={() => setManualEntryNode(node.id)} className="px-3 py-2 bg-yellow-600 text-white rounded text-[10px] font-bold">Manual</button>}
                                </div>
                            </div>
                            {node.status === 'analyzed' && node.analysis && (
                                <div className="mt-2 p-2 bg-blue-900/10 border-l-2 border-blue-500 text-xs text-zinc-300 flex flex-col gap-2">
                                    <p className="italic">{node.analysis}</p>
                                    <button onClick={() => handleSaveToLibrary(node.id)} disabled={savedNodes.has(node.id)} className="text-[9px] uppercase font-bold text-white bg-blue-700 px-2 py-1 rounded self-end">{savedNodes.has(node.id) ? 'Salvo' : 'Arquivar'}</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EchoScanner;
