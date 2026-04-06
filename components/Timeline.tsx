
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AudioSample } from './SampleLibrary';

interface TrackItem {
    id: string; // ID único da instância na timeline
    sample: AudioSample;
    startTime: number; // Em "steps" (passos) da grade
    duration: number; // Em "steps"
    trackIndex: number;
}

interface TimelineProps {
    samples: AudioSample[]; // Referência para todos os samples disponíveis
}

const STEPS_PER_BAR = 4;
const NUM_BARS = 8;
const TOTAL_STEPS = STEPS_PER_BAR * NUM_BARS;
const NUM_TRACKS = 6;
const DEFAULT_BPM = 120;

const Timeline: React.FC<TimelineProps> = ({ samples }) => {
    const [tracks, setTracks] = useState<TrackItem[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [bpm, setBpm] = useState(DEFAULT_BPM);
    const [currentStep, setCurrentStep] = useState(0);
    const [dragOverInfo, setDragOverInfo] = useState<{track: number, step: number} | null>(null);

    // Audio Engine Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const nextNoteTimeRef = useRef(0);
    const currentStepRef = useRef(0);
    const timerIDRef = useRef<number | null>(null);
    const lookahead = 25.0; // ms
    const scheduleAheadTime = 0.1; // seconds
    const buffersRef = useRef<Map<string, AudioBuffer>>(new Map());

    // Inicializa o AudioContext
    useEffect(() => {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
            audioContextRef.current = new AudioContextClass();
        }
        return () => {
            if (timerIDRef.current) window.clearTimeout(timerIDRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, []);

    // Cache e Decodificação de Áudio
    const loadAudioBuffer = async (sample: AudioSample) => {
        if (!audioContextRef.current) return null;
        if (buffersRef.current.has(sample.id)) return buffersRef.current.get(sample.id);

        try {
            const response = await fetch(sample.url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
            buffersRef.current.set(sample.id, audioBuffer);
            return audioBuffer;
        } catch (e) {
            console.error("Erro ao carregar buffer de áudio:", e);
            return null;
        }
    };

    // --- ENGINE DE PLAYBACK ---

    const nextNote = () => {
        const secondsPerBeat = 60.0 / bpm;
        // Avança um passo (considerando 4 passos por batida/beat para maior resolução se necessário, mas aqui simplificado para 1 step = 1 beat)
        // Vamos ajustar: se STEPS_PER_BAR = 4, então 1 step = 1 semínima (quarter note) = 1 beat.
        nextNoteTimeRef.current += secondsPerBeat; 
        currentStepRef.current = (currentStepRef.current + 1) % TOTAL_STEPS;
        setCurrentStep(currentStepRef.current);
    };

    const scheduleNote = (stepNumber: number, time: number) => {
        // Verifica se há samples começando neste passo
        const activeItems = tracks.filter(t => Math.floor(t.startTime) === stepNumber);

        activeItems.forEach(async (item) => {
            const buffer = await loadAudioBuffer(item.sample);
            if (buffer && audioContextRef.current) {
                const source = audioContextRef.current.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContextRef.current.destination);
                source.start(time);
            }
        });
    };

    const scheduler = () => {
        // Enquanto houver notas para tocar antes do próximo intervalo
        while (nextNoteTimeRef.current < (audioContextRef.current?.currentTime || 0) + scheduleAheadTime) {
            scheduleNote(currentStepRef.current, nextNoteTimeRef.current);
            nextNote();
        }
        timerIDRef.current = window.setTimeout(scheduler, lookahead);
    };

    const togglePlay = () => {
        if (isPlaying) {
            if (timerIDRef.current) window.clearTimeout(timerIDRef.current);
            setIsPlaying(false);
            setCurrentStep(0);
            currentStepRef.current = 0;
        } else {
            if (audioContextRef.current?.state === 'suspended') {
                audioContextRef.current.resume();
            }
            nextNoteTimeRef.current = audioContextRef.current?.currentTime || 0;
            currentStepRef.current = 0;
            setCurrentStep(0);
            setIsPlaying(true);
            scheduler();
        }
    };

    // --- DRAG AND DROP ---

    const handleDragOver = (e: React.DragEvent, trackIndex: number) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const stepWidth = width / TOTAL_STEPS;
        const stepIndex = Math.floor(x / stepWidth);
        
        setDragOverInfo({ track: trackIndex, step: stepIndex });
    };

    const handleDrop = (e: React.DragEvent, trackIndex: number) => {
        e.preventDefault();
        setDragOverInfo(null);
        try {
            const sampleData = JSON.parse(e.dataTransfer.getData("application/json")) as AudioSample;
            
            // Calcula o step baseado na posição do mouse
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const width = rect.width;
            const stepWidth = width / TOTAL_STEPS;
            const stepIndex = Math.floor(x / stepWidth);

            const newItem: TrackItem = {
                id: e.timeStamp.toString() + '-' + stepIndex,
                sample: sampleData,
                startTime: stepIndex,
                duration: 4, // Duração padrão (1 compasso)
                trackIndex: trackIndex
            };

            setTracks(prev => [...prev, newItem]);
            // Pré-carrega o áudio
            loadAudioBuffer(sampleData);

        } catch (err) {
            console.error("Erro ao soltar sample:", err);
        }
    };

    const removeTrackItem = (itemId: string) => {
        setTracks(prev => prev.filter(t => t.id !== itemId));
    };

    return (
        <div className="flex flex-col h-full bg-zinc-900/50 rounded-xl border border-emerald-900/50 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-2 bg-black/40 border-b border-emerald-800/30">
                <div className="flex gap-2">
                    <button 
                        onClick={togglePlay}
                        className={`px-4 py-2 rounded font-bold transition-all ${isPlaying ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white shadow-lg`}
                    >
                        {isPlaying ? '■ STOP' : '▶ PLAY'}
                    </button>
                    <div className="flex items-center gap-2 bg-zinc-800 rounded px-2 border border-zinc-700">
                        <span className="text-xs text-zinc-400 font-bold">BPM</span>
                        <input 
                            type="number" 
                            value={bpm} 
                            onChange={(e) => setBpm(Number(e.target.value))}
                            className="w-12 bg-transparent text-emerald-300 font-mono text-center focus:outline-none"
                        />
                    </div>
                </div>
                <div className="text-xs text-zinc-500 font-mono">
                    STEP: {currentStep + 1} / {TOTAL_STEPS}
                </div>
            </div>

            {/* Timeline Grid */}
            <div className="flex-grow overflow-auto relative bg-zinc-900" style={{ backgroundImage: 'radial-gradient(#34d39911 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                {/* Playhead */}
                <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 transition-all duration-100 ease-linear"
                    style={{ left: `${(currentStep / TOTAL_STEPS) * 100}%` }}
                ></div>

                {Array.from({ length: NUM_TRACKS }).map((_, trackIdx) => (
                    <div 
                        key={trackIdx}
                        onDragOver={(e) => handleDragOver(e, trackIdx)}
                        onDrop={(e) => handleDrop(e, trackIdx)}
                        className="h-16 border-b border-zinc-800 relative group"
                    >
                        {/* Background Grid Lines (Bars) */}
                        {Array.from({ length: NUM_BARS }).map((__, barIdx) => (
                            <div 
                                key={barIdx} 
                                className="absolute top-0 bottom-0 border-r border-zinc-800/50"
                                style={{ left: `${(barIdx / NUM_BARS) * 100}%` }}
                            >
                                <span className="text-[9px] text-zinc-700 ml-1">{barIdx + 1}</span>
                            </div>
                        ))}

                        {/* Track Label */}
                        <div className="absolute left-0 top-0 bottom-0 w-8 bg-black/20 border-r border-zinc-800 flex items-center justify-center text-xs text-zinc-600 font-bold z-20">
                            {trackIdx + 1}
                        </div>

                        {/* Placed Items */}
                        {tracks.filter(t => t.trackIndex === trackIdx).map(item => (
                            <div
                                key={item.id}
                                className="absolute top-1 bottom-1 rounded border border-emerald-500/50 bg-emerald-900/60 hover:bg-emerald-800/80 cursor-pointer overflow-hidden flex items-center px-2 z-10 group/item"
                                style={{ 
                                    left: `${(item.startTime / TOTAL_STEPS) * 100}%`,
                                    width: `${(item.duration / TOTAL_STEPS) * 100}%`
                                }}
                            >
                                <span className="text-[10px] text-emerald-100 font-bold truncate">{item.sample.name}</span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); removeTrackItem(item.id); }}
                                    className="hidden group-hover/item:block absolute right-1 top-1 text-red-400 hover:text-white bg-black/50 rounded-full w-4 h-4 text-[10px] leading-none"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}

                        {/* Drag Preview */}
                        {dragOverInfo && dragOverInfo.track === trackIdx && (
                            <div 
                                className="absolute top-1 bottom-1 bg-white/10 border border-white/30 rounded pointer-events-none"
                                style={{ 
                                    left: `${(dragOverInfo.step / TOTAL_STEPS) * 100}%`,
                                    width: `${(4 / TOTAL_STEPS) * 100}%` // Assumindo duração 4 para preview
                                }}
                            ></div>
                        )}
                    </div>
                ))}
            </div>
            
            <div className="p-1 bg-black/40 text-[10px] text-zinc-600 text-center">
                Arraste samples da biblioteca abaixo para as trilhas acima.
            </div>
        </div>
    );
};

export default Timeline;
