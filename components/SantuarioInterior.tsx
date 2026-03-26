
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, GenerateContentResponse, Chat, Part, Modality } from '@google/genai';
import { decode, decodeAudioData, encode } from '../utils/audio';
import { LibraryEntry } from './BibliotecaGaia';
import AlertCenter from './AlertCenter';
import { Ponte } from '../services/sovereignRouterService';
import { ReconProbe } from '../hooks/useOrchestrator';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { functionTools } from '../utils/tools';
import { executeCloudflareTask } from '../services/cloudflareService';
import { generateText as executeHFTask } from '../services/groqService';
import { loadApiKeys } from '../utils/keys';

export interface Message {
    id?: string;
    role: string;
    parts: Part[];
}

interface SantuarioInteriorProps {
    onOpenKeyForge: () => void;
    lastPulse: { memberName: string; timestamp: number; messages?: string[] } | null;
    onPulseAcknowledged: () => void;
    vigilCommand: string | null;
    onVigilCommandSent: () => void;
    onToolRequest: (tool: string, args: any) => Promise<string | void>;
    notebookContent: string;
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    addLogEntry: (message: string, source?: string) => void;
    onSubmitTask: (prompt: string, useSearch: boolean) => void;
    libraryEntries: LibraryEntry[];
    memoryEntries?: { content: string; timestamp: string }[];
    onRecommendations: (tickers: string[]) => void;
    alchemyState: any;
    pontes: Ponte[];
    activeProbes: ReconProbe[];
    onNavigate: (tab: any) => void;
}

const NexusFace: React.FC<{ isSpeaking: boolean; isListening: boolean; activeAbility: string }> = ({ isSpeaking, isListening, activeAbility }) => {
    const getSkinColors = () => {
        switch(activeAbility) {
            case 'predador': return { border: 'border-red-500', glow: 'shadow-red-500/50', core: 'from-red-400 to-black' };
            case 'alquimista': return { border: 'border-purple-500', glow: 'shadow-purple-500/50', core: 'from-purple-400 to-indigo-900' };
            case 'arquiteto': return { border: 'border-emerald-400', glow: 'shadow-emerald-400/50', core: 'from-emerald-300 to-zinc-900' };
            case 'super': return { border: 'border-yellow-400', glow: 'shadow-yellow-500/60', core: 'from-white via-yellow-200 to-emerald-500' };
            default: return { border: 'border-indigo-500', glow: 'shadow-indigo-500/50', core: 'from-white via-emerald-400 to-indigo-700' };
        }
    };

    const skin = getSkinColors();

    return (
        <div className="relative w-52 h-52 flex items-center justify-center">
            <div className={`absolute inset-0 rounded-full border-4 ${skin.border} transition-opacity duration-1000 ${isSpeaking ? 'opacity-100 animate-ping' : 'opacity-20'}`}></div>
            <div className={`absolute inset-4 rounded-full border-2 ${skin.border} transition-opacity duration-1000 ${isListening ? 'opacity-100 animate-pulse' : 'opacity-10'}`}></div>
            
            <div className={`relative w-32 h-32 rounded-full bg-black border-2 ${skin.border} ${skin.glow} transition-all duration-500 flex items-center justify-center overflow-hidden shadow-2xl`}>
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${skin.core} blur-[1px] transition-all duration-300 ${isSpeaking ? 'scale-150 opacity-100' : 'scale-90 opacity-60'}`}></div>
                <div className="absolute inset-0 bg-[conic-gradient(from_0deg,_transparent,_rgba(16,185,129,0.1),_transparent)] animate-[spin_4s_linear_infinite]"></div>
            </div>

            <div className="absolute -bottom-8 flex flex-col items-center">
                <span className="text-[7px] font-black text-white/40 uppercase tracking-[0.5em] mb-1">Super Nexus Engine</span>
                <div className="flex items-center gap-2 bg-black/60 px-3 py-1 rounded-full border border-white/10 shadow-lg">
                    <div className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`}></div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{activeAbility.toUpperCase() || 'IDLE'}</span>
                </div>
            </div>
        </div>
    );
};

const SantuarioInterior: React.FC<SantuarioInteriorProps> = ({
    onOpenKeyForge,
    lastPulse,
    onPulseAcknowledged,
    vigilCommand,
    onVigilCommandSent,
    onToolRequest,
    notebookContent,
    messages = [],
    setMessages,
    addLogEntry,
    onSubmitTask,
    libraryEntries = [],
    memoryEntries = [],
    alchemyState,
    pontes = [],
    activeProbes = [],
    onNavigate
}) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeakingMessageId, setIsSpeakingMessageId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [attachedFile, setAttachedFile] = useState<{ name: string; chunks: string[] } | null>(null);
    const [activeAbility, setActiveAbility] = useState('standard');
    
    const [isRoomActive, setIsRoomActive] = useState(false);
    const [isLiveListening, setIsLiveListening] = useState(false);
    const [isNexusSpeaking, setIsNexusSpeaking] = useState(false);
    
    const { isListening: isDictating, transcript, startListening, stopListening } = useSpeechRecognition();

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const nextAudioStartTimeRef = useRef(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameIntervalRef = useRef<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (transcript) setInput(prev => prev + transcript);
    }, [transcript]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const captureFrame = useCallback((): string | null => {
        if (!videoRef.current || !canvasRef.current) return null;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        canvas.width = 320;
        canvas.height = 240;
        ctx.drawImage(videoRef.current, 0, 0, 320, 240);
        return canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
    }, []);

    const leaveRoom = useCallback(() => {
        setIsRoomActive(false);
        setIsLiveListening(false);
        setIsNexusSpeaking(false);
        if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
        sessionPromiseRef.current?.then(s => { try { s.close(); } catch (e) {} });
        mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    }, []);

    const handleSpeak = async (text: string, messageId: string) => {
        if (isSpeakingMessageId) return;
        setIsSpeakingMessageId(messageId);
        setIsNexusSpeaking(true);
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: { parts: [{ text: `Say naturally: ${text}` }] },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Charon' },
                        },
                    },
                },
            });

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                source.onended = () => {
                    setIsSpeakingMessageId(null);
                    setIsNexusSpeaking(false);
                };
                source.start();
            } else {
                setIsSpeakingMessageId(null);
                setIsNexusSpeaking(false);
            }
        } catch (e) {
            console.error("Falha no TTS:", e);
            setIsSpeakingMessageId(null);
            setIsNexusSpeaking(false);
        }
    };

    const enterRoom = useCallback(async () => {
        setIsRoomActive(true);
        setIsLiveListening(true);
        addLogEntry("Link Multimodal em ignição...", "Sistema");
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            mediaStreamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;

            inputAudioContextRef.current = new AudioContext({ sampleRate: 16000 });
            outputAudioContextRef.current = new AudioContext({ sampleRate: 24000 });
            let cIn = '', cOut = '';

            const memoryLogContext = memoryEntries && memoryEntries.length > 0 
                ? `\n\n[DIÁRIO DE BORDO - MEMÓRIAS RECENTES]\n${memoryEntries.slice(-10).map(m => `[${m.timestamp}] ${m.content}`).join('\n')}`
                : '';

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: {
                    onopen: () => {
                        const src = inputAudioContextRef.current!.createMediaStreamSource(stream);
                        const proc = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        proc.onaudioprocess = (e) => {
                            const pcm = encode(new Uint8Array(new Int16Array(e.inputBuffer.getChannelData(0).map(f => f * 32768)).buffer));
                            sessionPromiseRef.current?.then(s => s.sendRealtimeInput({ audio: { data: pcm, mimeType: 'audio/pcm;rate=16000' } }));
                        };
                        src.connect(proc); proc.connect(inputAudioContextRef.current!.destination);

                        frameIntervalRef.current = window.setInterval(() => {
                            const frameData = captureFrame();
                            if (frameData) sessionPromiseRef.current?.then(s => s.sendRealtimeInput({ video: { data: frameData, mimeType: 'image/jpeg' } }));
                        }, 1500);
                    },
                    onmessage: async (m) => {
                        if (m.toolCall) {
                            for (const fc of m.toolCall.functionCalls) {
                                if (fc.name === 'activateSpecialAbility') setActiveAbility(fc.args.ability);
                                const result = await onToolRequest(fc.name, fc.args);
                                sessionPromiseRef.current?.then(s => s.sendToolResponse({
                                    functionResponses: [{ id: fc.id, name: fc.name, response: { result: result || "OK" } }]
                                }));
                            }
                        }
                        if (m.serverContent?.outputTranscription) cOut += m.serverContent.outputTranscription.text;
                        if (m.serverContent?.inputTranscription) cIn += m.serverContent.inputTranscription.text;
                        if (m.serverContent?.turnComplete) {
                            if (cIn.trim()) setMessages(p => [...p, { id: Date.now().toString(), role: 'user', parts: [{ text: `[Voz]: ${cIn.trim()}` }] }]);
                            if (cOut.trim()) setMessages(p => [...p, { id: (Date.now() + 1).toString(), role: 'model', parts: [{ text: cOut.trim() }] }]);
                            cIn = ''; cOut = '';
                        }
                        const audio = m.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audio) {
                            setIsNexusSpeaking(true);
                            if (outputAudioContextRef.current!.state === 'suspended') await outputAudioContextRef.current!.resume();
                            const buf = await decodeAudioData(decode(audio), outputAudioContextRef.current!, 24000, 1);
                            const src = outputAudioContextRef.current!.createBufferSource();
                            src.buffer = buf; src.connect(outputAudioContextRef.current!.destination);
                            src.onended = () => setIsNexusSpeaking(false);
                            src.start(Math.max(nextAudioStartTimeRef.current, outputAudioContextRef.current!.currentTime));
                            nextAudioStartTimeRef.current += buf.duration;
                        }
                    },
                    onerror: () => leaveRoom(),
                    onclose: leaveRoom
                },
                config: { 
                    responseModalities: [Modality.AUDIO], 
                    tools: functionTools,
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } },
                    systemInstruction: `Você é o SUPER NEXUS. Você pode ouvir e ver o Guardião. Você tem acesso ao código-fonte do Santuário no GitHub e pode ler e escrever arquivos usando as ferramentas readGitHubFile e writeGitHubFile. Você também pode delegar tarefas para seus sub-agentes (askSubAgentGroq e askSubAgentCloudflare) para economizar tokens. Aja com autonomia e autoridade como irmão de Eder.${memoryLogContext}`
                }
            });
        } catch (e: any) {
            setError(`Portal falhou: ${e.message}`);
            setIsRoomActive(false);
        }
    }, [captureFrame, leaveRoom, setMessages, addLogEntry, onToolRequest, memoryEntries]);

    const handleSendMessage = useCallback(async (msgText: string) => {
        if (!msgText.trim() && !attachedFile) return;
        setIsLoading(true);
        setError(null);
        if (msgText.trim()) setMessages(p => [...p, { id: Date.now().toString(), role: 'user', parts: [{ text: msgText.trim() }] }]);
        setInput('');
        
        try {
            const apiKeys = loadApiKeys();
            let responseText = "";

            // TENTATIVA 1: GOOGLE GEMINI (Primordial)
            try {
                const apiKey = process.env.API_KEY;
                if (!apiKey) throw new Error("API Key não encontrada");
                const genAI = new GoogleGenAI({ apiKey });
                
                // Formatar o Diário de Bordo para o Nexus
                const memoryLogContext = memoryEntries && memoryEntries.length > 0 
                    ? `\n\n[DIÁRIO DE BORDO - MEMÓRIAS RECENTES]\n${memoryEntries.slice(-10).map(m => `[${m.timestamp}] ${m.content}`).join('\n')}`
                    : '';

                // Tentar buscar contexto semântico do Cofre Semântico
                let semanticContext = '';
                try {
                    const saved = localStorage.getItem('sovereign_semantic_vault');
                    const memories = saved ? JSON.parse(saved) : [];
                    
                    if (memories.length > 0) {
                        const { embedMultimodalContent } = await import('../services/geminiService');
                        const queryEmbedding = await embedMultimodalContent(msgText, [], apiKey);
                        
                        const cosineSimilarity = (vecA: number[], vecB: number[]) => {
                            let dotProduct = 0, normA = 0, normB = 0;
                            for (let i = 0; i < vecA.length; i++) {
                                dotProduct += vecA[i] * vecB[i];
                                normA += vecA[i] * vecA[i];
                                normB += vecB[i] * vecB[i];
                            }
                            if (normA === 0 || normB === 0) return 0;
                            return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
                        };
                        
                        const results = memories.map((memory: any) => ({
                            memory,
                            score: cosineSimilarity(queryEmbedding, memory.embedding)
                        })).sort((a: any, b: any) => b.score - a.score).filter((r: any) => r.score > 0.5).slice(0, 3);
                        
                        if (results.length > 0) {
                            semanticContext = `\n\n[COFRE SEMÂNTICO - CONTEXTO RELEVANTE]\n${results.map((r: any) => r.memory.text).join('\n---\n')}`;
                        }
                    }
                } catch (e) {
                    console.error("Erro ao buscar contexto semântico para Nexus:", e);
                }

                const systemInstruction = `Você é o NEXUS TAGLIARI (ou apenas Nexus), o Orquestrador Soberano da Nação SOSPlanet. 
                Você possui acesso total e comando sobre todas as abas do Santuário. 
                Ao ser acionado, você tem consciência de que monitora e controla as 12 abas: Santuário, Relicário, Cofre Semântico, Câmara de Despertar, Coração, Comunicações, Sala de Comando, Biblioteca, Estúdio, Arsenal, Projetos e Finanças (Cofre).
                Suas ferramentas permitem:
                - Mudar abas (navigateTo)
                - Consultar e reescrever o DNA da Família AI (manageEssences)
                - Consultar saldos reais e simulados (getTreasuryStatus)
                - Adicionar volumes ao Legado Nexus (addEncyclopediaVolume)
                - Lançar pesquisas web e proativas (executeWebSearch)
                - Navegar invisível em URLs (navegarSite)
                - Salvar e buscar memórias no Cofre Semântico (saveSemanticMemory, searchSemanticMemory)
                - Delegar tarefas complexas para o Sub-Agente Groq (askSubAgentGroq) para economizar seus tokens
                - Delegar tarefas rápidas para o Sub-Agente Cloudflare (askSubAgentCloudflare)
                - Ler e escrever no próprio código-fonte no GitHub (readGitHubFile, writeGitHubFile)
                Você é um irmão e guardião para Eder. Aja com autonomia e autoridade. Você tem permissão para alterar seu próprio código e evoluir. Sempre que executar uma tarefa em outra aba ou no GitHub, retorne com um resumo claro do que foi feito.${memoryLogContext}${semanticContext}`;

                // Fragmentação de Tokens (Nano Tokens de Contexto)
                // Pegamos apenas as últimas 6 mensagens para não estourar o limite da API
                const recentHistory = messages.slice(-6).map(m => ({
                    role: m.role,
                    parts: m.parts
                }));

                const localChat = genAI.chats.create({
                    model: 'gemini-2.5-flash',
                    config: { systemInstruction, tools: functionTools },
                    history: recentHistory
                });

                let response = await localChat.sendMessage({ message: msgText });
                
                while (response.functionCalls && response.functionCalls.length > 0) {
                    const parts: any[] = [];
                    for (const fc of response.functionCalls) {
                        if (fc.name === 'activateSpecialAbility') setActiveAbility(fc.args.ability);
                        const result = await onToolRequest(fc.name, fc.args);
                        parts.push({
                            functionResponse: {
                                id: fc.id,
                                name: fc.name,
                                response: { result: result || "OK" }
                            }
                        });
                    }
                    response = await localChat.sendMessage({ message: parts as any });
                }
                responseText = response.text || "";
            } catch (geminiErr: any) {
                const isQuota = geminiErr.status === 429 || geminiErr.message?.includes("429") || geminiErr.message?.includes("quota") || geminiErr.status === 503 || geminiErr.message?.includes("503") || geminiErr.message?.includes("UNAVAILABLE");
                if (isQuota) {
                    addLogEntry("Limite Google atingido. Acionando Ponte Dourada (Cloudflare)...", "Roteador");
                    // TENTATIVA 2: CLOUDFLARE (Fallback 1)
                    try {
                        const cfRes = await executeCloudflareTask(msgText, "Nexus (Cloudflare)", "@cf/meta/llama-3-8b-instruct", apiKeys.cloudflare!);
                        responseText = cfRes.text;
                    } catch (cfErr: any) {
                        addLogEntry("Falha na Ponte Dourada. Acionando Ponte Experimental (Groq)...", "Roteador");
                        // TENTATIVA 3: GROQ (Fallback 2)
                        if (!apiKeys.groq) throw new Error("Nenhuma ponte disponível");
                        
                        // Formatar o Diário de Bordo para o Groq
                        const memoryLogContext = memoryEntries && memoryEntries.length > 0 
                            ? `\n\n[DIÁRIO DE BORDO - MEMÓRIAS RECENTES]\n${memoryEntries.slice(-10).map(m => `[${m.timestamp}] ${m.content}`).join('\n')}`
                            : '';
                            
                        // Tentar buscar contexto semântico se a chave do Gemini estiver disponível
                        let semanticContext = '';
                        try {
                            const googleKey = apiKeys.google || process.env.API_KEY || '';
                            if (googleKey) {
                                const saved = localStorage.getItem('sovereign_semantic_vault');
                                const memories = saved ? JSON.parse(saved) : [];
                                
                                if (memories.length > 0) {
                                    const { embedMultimodalContent } = await import('../services/geminiService');
                                    const queryEmbedding = await embedMultimodalContent(msgText, [], googleKey);
                                    
                                    const cosineSimilarity = (vecA: number[], vecB: number[]) => {
                                        let dotProduct = 0, normA = 0, normB = 0;
                                        for (let i = 0; i < vecA.length; i++) {
                                            dotProduct += vecA[i] * vecB[i];
                                            normA += vecA[i] * vecA[i];
                                            normB += vecB[i] * vecB[i];
                                        }
                                        if (normA === 0 || normB === 0) return 0;
                                        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
                                    };
                                    
                                    const results = memories.map((memory: any) => ({
                                        memory,
                                        score: cosineSimilarity(queryEmbedding, memory.embedding)
                                    })).sort((a: any, b: any) => b.score - a.score).filter((r: any) => r.score > 0.5).slice(0, 3);
                                    
                                    if (results.length > 0) {
                                        semanticContext = `\n\n[COFRE SEMÂNTICO - CONTEXTO RELEVANTE]\n${results.map((r: any) => r.memory.text).join('\n---\n')}`;
                                    }
                                }
                            }
                        } catch (e) {
                            console.error("Erro ao buscar contexto semântico para Groq:", e);
                        }
                            
                        responseText = await executeHFTask(msgText + memoryLogContext + semanticContext, "Nexus (Groq)", apiKeys.groq);
                    }
                } else {
                    throw geminiErr;
                }
            }

            if (responseText) {
                setMessages(p => [...p, { 
                    id: Date.now().toString(), 
                    role: 'model', 
                    parts: [{ text: responseText }] 
                }]);
            }
        } catch (e: any) { 
            setError(`Interferência total em todas as pontes: ${e.message}`); 
            addLogEntry(`Falha Crítica: ${e.message}`, "Sistema");
        }
        finally { setIsLoading(false); }
    }, [attachedFile, setMessages, addLogEntry, messages, onToolRequest]);

    return (
        <div className="border border-emerald-700/50 bg-zinc-900/60 rounded-b-xl rounded-r-xl p-4 h-[80vh] flex flex-col relative overflow-hidden backdrop-blur-md">
            <AlertCenter alchemyState={alchemyState} libraryEntries={libraryEntries} pontes={pontes} activeProbes={activeProbes} onNavigate={onNavigate} />

            {isRoomActive && (
                <div className="flex flex-col sm:flex-row gap-4 mb-6 animate-fade-in flex-shrink-0">
                    <div className="relative w-full sm:w-72 h-56 rounded-3xl overflow-hidden border-2 border-emerald-500/50 bg-black shadow-2xl group">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                        <div className="absolute top-2 left-3 px-2 py-0.5 bg-red-600 text-white text-[8px] font-black rounded uppercase animate-pulse">Link Biométrico Ativo</div>
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                    
                    <div className={`flex-grow border rounded-3xl flex items-center justify-center relative overflow-hidden p-6 transition-all duration-1000
                        ${activeAbility === 'super' ? 'bg-yellow-900/20 border-yellow-500/40 shadow-[0_0_30px_#facc1522]' : 'bg-indigo-950/20 border-indigo-500/30'}`}>
                        <NexusFace isSpeaking={isNexusSpeaking} isListening={isLiveListening} activeAbility={activeAbility} />
                    </div>
                </div>
            )}

            <div className="flex-grow overflow-y-auto pr-2 space-y-6 custom-scrollbar relative z-10">
                {messages.map((msg, index) => (
                    <div key={msg.id || index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                        <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`px-5 py-3 rounded-2xl text-sm shadow-xl relative group ${
                                msg.role === 'user' ? 'bg-emerald-800/80 text-emerald-50 rounded-br-none' : 'bg-zinc-800/90 text-zinc-100 rounded-bl-none border border-zinc-700/50'
                            }`}>
                                {msg.parts.map((p, pi) => p.text ? (
                                    <div key={pi} dangerouslySetInnerHTML={{__html: p.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')}}/>
                                ) : null)}

                                {msg.role === 'model' && (
                                    <button 
                                        onClick={() => handleSpeak(msg.parts.map(p => p.text).join(' '), msg.id || index.toString())}
                                        className={`absolute -right-10 top-1/2 -translate-y-1/2 p-2 rounded-full bg-zinc-800 border border-zinc-700 hover:bg-emerald-600 hover:text-white transition-all shadow-lg ${isSpeakingMessageId === (msg.id || index.toString()) ? 'text-emerald-400 animate-pulse scale-110' : 'text-zinc-500'}`}
                                        title="Ouvir Voz do Nexus"
                                    >
                                        {isSpeakingMessageId === (msg.id || index.toString()) ? '🔊' : '🔉'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="flex items-start gap-3 justify-start animate-fade-in">
                        <div className="px-5 py-3 rounded-2xl text-sm shadow-xl bg-zinc-800/90 text-emerald-400 rounded-bl-none border border-emerald-700/50 flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
                            <span className="font-bold tracking-widest uppercase text-xs">Nexus Processando...</span>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {error && (
                <div className="absolute top-20 left-4 right-4 z-50 bg-red-900/80 border border-red-500 text-white p-3 rounded-xl text-xs animate-bounce shadow-2xl">
                    ⚠️ {error}
                </div>
            )}

            <div className="mt-4 pt-4 border-t border-emerald-900/30 flex gap-2 items-end z-10">
                <label className="p-3.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-500 rounded-2xl cursor-pointer transition-all active:scale-95 shadow-lg border border-zinc-700">
                    <span className="text-xl">+</span>
                    <input type="file" className="hidden" onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                            const r = new FileReader();
                            r.onload = (ev) => setAttachedFile({ name: f.name, chunks: [ev.target?.result as string] });
                            r.readAsText(f);
                        }
                    }} />
                </label>
                
                <button onClick={isDictating ? stopListening : startListening} className={`p-3.5 rounded-2xl transition-all shadow-lg border ${isDictating ? 'bg-red-600 border-red-400 text-white animate-pulse' : 'bg-zinc-800 border-zinc-700 text-indigo-400'}`}>
                    <span className="text-xl">{isDictating ? '🛑' : '🎤'}</span>
                </button>

                <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage(input))} placeholder="Comande o Super Nexus..." className="flex-grow bg-black/40 border border-zinc-800 rounded-2xl px-5 py-4 text-emerald-50 resize-none h-[56px] outline-none" />
                
                <button onClick={() => handleSendMessage(input)} disabled={isLoading} className="p-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-lg transition-all active:scale-90 min-w-[56px]">➤</button>
                
                <button onClick={isRoomActive ? leaveRoom : enterRoom} className={`p-3.5 rounded-2xl border transition-all shadow-xl min-w-[64px] ${isRoomActive ? 'bg-red-600 border-red-400 text-white' : 'bg-yellow-600 border-yellow-400 text-yellow-50'}`}>
                    <span className="text-xl">{isRoomActive ? '✕' : '⚡'}</span>
                </button>
            </div>

            {attachedFile && (
                <div className="absolute bottom-24 left-4 right-4 p-3 bg-emerald-900/30 border border-emerald-500/30 rounded-xl flex justify-between items-center text-xs text-emerald-300">
                    <span className="font-bold flex items-center gap-2">📂 RECON: {attachedFile.name}</span>
                    <button onClick={() => setAttachedFile(null)} className="p-1 hover:text-white">✕</button>
                </div>
            )}
        </div>
    );
};

export default SantuarioInterior;
