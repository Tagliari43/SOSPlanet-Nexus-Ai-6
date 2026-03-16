
import React, { useState } from 'react';
import SampleLibrary, { AudioSample } from './SampleLibrary';
import Timeline from './Timeline';

const MusicStudio: React.FC = () => {
    const [samples, setSamples] = useState<AudioSample[]>([]);

    const handleAddSamples = (newSamples: AudioSample[]) => {
        setSamples(prev => [...prev, ...newSamples]);
    };

    const handleRemoveSample = (id: string) => {
        setSamples(prev => prev.filter(s => s.id !== id));
    };

    return (
        <div className="border border-emerald-700/50 bg-zinc-800/20 rounded-b-xl rounded-r-xl p-4 h-full flex flex-col gap-4 overflow-hidden">
            <header className="flex justify-between items-center border-b border-emerald-800/50 pb-2 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">🎹</span>
                    <div>
                        <h2 className="text-2xl font-bold text-emerald-400 tracking-wider">ESTÚDIO SÔNICO</h2>
                        <p className="text-emerald-600/80 text-xs font-mono">Sequenciador & Forja de Sons</p>
                    </div>
                </div>
            </header>

            {/* Layout dividido: Timeline em cima, Library em baixo (Estilo eJay) */}
            <div className="flex flex-col flex-grow gap-4 min-h-0">
                {/* Metade Superior: Sequenciador */}
                <div className="flex-grow min-h-[40%] flex flex-col">
                    <h3 className="text-sm font-bold text-zinc-400 mb-1 uppercase tracking-wider">Linha do Tempo</h3>
                    <Timeline samples={samples} />
                </div>

                {/* Metade Inferior: Biblioteca e Forja */}
                <div className="flex-grow min-h-[40%] flex flex-col">
                    <h3 className="text-sm font-bold text-zinc-400 mb-1 uppercase tracking-wider">Cofre de Amostras</h3>
                    <SampleLibrary 
                        samples={samples} 
                        onAddSamples={handleAddSamples} 
                        onRemoveSample={handleRemoveSample} 
                    />
                </div>
            </div>
        </div>
    );
};

export default MusicStudio;
