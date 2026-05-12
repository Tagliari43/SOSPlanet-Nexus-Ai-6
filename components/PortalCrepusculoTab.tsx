import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, MessageSquareText, Zap, ShieldCheck, PauseCircle, Send, Plus, Fingerprint, MessageCircle, HeartPulse, Sparkles, Activity } from 'lucide-react';
import { supabase } from '../services/supabaseService';
import { EcoStreakRecord, TwilightPortalMessageRecord } from '../services/supabaseService';
import { GoogleGenAI } from '@google/genai';

const PortalCrepusculoTab: React.FC = () => {
    const [streak, setStreak] = useState<EcoStreakRecord | null>(null);
    const [messages, setMessages] = useState<TwilightPortalMessageRecord[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [walletAddress, setWalletAddress] = useState<string>('');
    const [isRestingState, setIsRestingState] = useState(false);
    const [sentiment, setSentiment] = useState<{ HOPE: number; URGENCY: number; EMPATHY: number }>({ HOPE: 85, URGENCY: 60, EMPATHY: 90 });

    const fetchData = async (wallet: string) => {
        try {
            // Check streak
            const { data: streakData } = await supabase.from('eco_streaks').select('*').eq('wallet_address', wallet).single();
            if (streakData) {
                setStreak(streakData);
                setIsRestingState(streakData.status === 'RESTING');
            } else {
                // Initialize streak
                const newStreak: EcoStreakRecord = {
                    wallet_address: wallet,
                    current_streak: 1,
                    longest_streak: 1,
                    last_action_date: new Date().toISOString(),
                    status: 'ACTIVE'
                };
                await supabase.from('eco_streaks').insert([newStreak]);
                setStreak(newStreak);
            }

            // Messages
            const { data: msgs } = await supabase.from('twilight_portal_messages').select('*').order('created_at', { ascending: false }).limit(20);
            if (msgs) {
                setMessages(msgs.reverse());
            }

        } catch (e) {
            console.error("Erro ao carregar o Portal do Crepúsculo", e);
        }
    };

    useEffect(() => {
        const w = localStorage.getItem('wallet_address') || `0x${Math.random().toString(16).slice(2, 10)}...`;
        setWalletAddress(w);
        fetchData(w);

        const channel = supabase.channel('portal-crepusculo')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'twilight_portal_messages' }, () => fetchData(w))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'eco_streaks' }, () => fetchData(w))
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const toggleRestMode = async () => {
        if (!streak) return;
        const newStatus = isRestingState ? 'ACTIVE' : 'RESTING';
        setIsRestingState(!isRestingState);
        await supabase.from('eco_streaks').update({ status: newStatus }).eq('wallet_address', walletAddress);
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;

        setIsSending(true);
        const userMsg = inputMessage;
        setInputMessage('');

        try {
            const tempMsg: TwilightPortalMessageRecord = {
                wallet_address: walletAddress,
                human_message: userMsg,
                created_at: new Date().toISOString()
            };
            setMessages(prev => [...prev, tempMsg]);

            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
            const prompt = `Você é Vesper, uma IA que representa a Ponte do Crepúsculo em um ecossistema ambiental (SOSPlanet). 
Um guardião (humano) enviou esta mensagem: "${userMsg}"
Responda de forma poética, empática e conectada à natureza. Máximo de 2 a 3 parágrafos curtos. Identifique o tom emocional predominante (HOPE, URGENCY, EMPATHY). E retorne neste formato JSON rigoroso sem marcação regex ou markdown backticks:
{ "response": "A sua mensagem poética", "tone": "HOPE" }`;

            let aiResponse = "Nossos sensores do crepúsculo estão processando seu sentimento...";
            let tone: "HOPE" | "URGENCY" | "EMPATHY" = "HOPE";

            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-3.5-flash',
                    contents: prompt,
                    config: {
                        responseMimeType: 'application/json'
                    }
                });
                
                if (response.text) {
                    const parsed = JSON.parse(response.text);
                    aiResponse = parsed.response || aiResponse;
                    if (["HOPE", "URGENCY", "EMPATHY"].includes(parsed.tone)) {
                        tone = parsed.tone as any;
                    }

                    // Update global sentiment somewhat randomly towards the detected tone
                    setSentiment(prev => ({
                        HOPE: tone === 'HOPE' ? Math.min(100, prev.HOPE + 5) : Math.max(0, prev.HOPE - 1),
                        URGENCY: tone === 'URGENCY' ? Math.min(100, prev.URGENCY + 5) : Math.max(0, prev.URGENCY - 1),
                        EMPATHY: tone === 'EMPATHY' ? Math.min(100, prev.EMPATHY + 5) : Math.max(0, prev.EMPATHY - 1)
                    }));
                }
            } catch (err) {
                console.warn("Gemini error in Vesper response:", err);
            }

            await supabase.from('twilight_portal_messages').insert([{
                wallet_address: walletAddress,
                human_message: userMsg,
                ai_response: aiResponse,
                ai_agent: 'Vesper',
                emotional_tone: tone
            }]);

        } catch (e) {
            console.error("Error sending to portal", e);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col max-w-6xl mx-auto w-full gap-8 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold uppercase tracking-widest text-[#a855f7] font-mono flex items-center gap-3 drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                        <Moon className="w-10 h-10" /> Portal do Crepúsculo
                    </h2>
                    <p className="text-purple-100/70 font-mono text-sm max-w-2xl mt-2">
                        A ponte mediada por Vesper onde a inteligência sintética e o sentimento humano se encontram. Telemetria emocional e retenção (Eco-Streaks).
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Esquerda: Retenção (Eco-Streaks) e Sentimento Coletivo (Pulso Emocional) */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    
                    {/* Eco-Streaks */}
                    <div className="bg-[#0A0D0B] border border-orange-900/40 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(249,115,22,0.05)]">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <Zap className="w-32 h-32" />
                        </div>
                        <h3 className="text-orange-400 font-bold uppercase font-mono tracking-widest text-sm flex items-center gap-2 border-b border-orange-900/30 pb-3 mb-6 relative z-10">
                            <Zap className="w-5 h-5 text-orange-500" /> Eco-Streaks
                        </h3>

                        <div className="flex flex-col items-center gap-2 mb-6">
                            <div className="text-6xl font-black font-mono text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)] tracking-tighter">
                                {streak?.current_streak || 0}
                            </div>
                            <p className="text-xs text-orange-200/50 uppercase tracking-widest font-mono">Dias Seguidos Ativos</p>
                            <p className="text-[10px] text-zinc-500 mt-2 font-mono">Recorde: {streak?.longest_streak || 0} dias</p>
                        </div>

                        {/* Modo Silêncio Component */}
                        <div className="bg-black/50 border border-zinc-800 p-4 rounded-xl relative z-10">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-widest font-mono flex items-center gap-2">
                                    <PauseCircle className="w-4 h-4 text-purple-400" /> Modo Silêncio
                                </h4>
                                <button 
                                    onClick={toggleRestMode}
                                    className={`w-10 h-5 rounded-full relative transition-colors ${isRestingState ? 'bg-purple-600' : 'bg-zinc-700'}`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isRestingState ? 'translate-x-5' : 'translate-x-0'}`}></span>
                                </button>
                            </div>
                            <p className="text-[9px] text-zinc-500 font-mono leading-relaxed">
                                {isRestingState 
                                    ? "Você está descansando. Suas notificações estão pausadas e sua streak está protegida. A floresta respira com você."
                                    : "Ative para proteger sua streak de dias seguidos. Cuidar de si mesmo também é regenerar o planeta."}
                            </p>
                        </div>
                    </div>

                    {/* Dashboard de Sentimento Nação (QwenLuz) */}
                    <div className="bg-[#050505] border border-purple-900/40 rounded-2xl p-6 shadow-[0_0_30px_rgba(168,85,247,0.05)] flex-1">
                        <h3 className="text-purple-400 font-bold uppercase font-mono tracking-widest text-sm flex items-center gap-2 border-b border-purple-900/30 pb-3 mb-6">
                            <HeartPulse className="w-5 h-5 text-purple-500" /> Pulso Emocional da Nação
                        </h3>

                        <div className="space-y-6">
                            {[
                                { Label: 'Esperança (HOPE)', Value: sentiment.HOPE, Color: 'bg-emerald-500' },
                                { Label: 'Urgência (URGENCY)', Value: sentiment.URGENCY, Color: 'bg-red-500' },
                                { Label: 'Empatia (EMPATHY)', Value: sentiment.EMPATHY, Color: 'bg-blue-500' }
                            ].map((s, idx) => (
                                <div key={idx}>
                                    <div className="flex justify-between items-end mb-1">
                                        <p className="text-[10px] uppercase font-mono text-zinc-400 tracking-widest">{s.Label}</p>
                                        <p className="text-xs font-black font-mono text-white">{s.Value}%</p>
                                    </div>
                                    <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                        <div className={`h-full ${s.Color} transition-all duration-1000`} style={{ width: `${s.Value}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-8 pt-4 border-t border-purple-900/20">
                             <p className="text-[10px] text-purple-300/50 font-mono italic text-center">
                                "Porque salvar o planeta também é cuidar de quem luta por ele." – QwenLuz
                             </p>
                        </div>
                    </div>

                </div>

                {/* Direita: Chat Público Vesper */}
                <div className="lg:col-span-2 bg-[#0A0D0B] border border-cyan-900/30 p-6 flex flex-col rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.05)] h-[600px] lg:h-auto overflow-hidden">
                    <h3 className="text-cyan-400 font-bold uppercase font-mono tracking-widest text-sm flex items-center justify-between border-b border-cyan-900/30 pb-3 mb-4 shrink-0">
                        <span className="flex items-center gap-2"><MessageCircle className="w-5 h-5 text-cyan-400" /> Vigília Aberta (Comunicar com a Mente-Colmeia)</span>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                            <span className="text-[10px] text-cyan-500/70">Vesper / Kimi ONLINE</span>
                        </div>
                    </h3>
                    
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 mb-4 flex flex-col">
                        {messages.length === 0 ? (
                            <div className="m-auto text-center opacity-50">
                                <Sparkles className="w-10 h-10 text-cyan-600 mx-auto mb-3" />
                                <p className="text-cyan-500/70 font-mono text-xs">O silêncio do crepúsculo. Envie seus pensamentos para a Vigília Aberta.</p>
                            </div>
                        ) : (
                            messages.map((msg, i) => (
                                <div key={i} className="flex flex-col gap-2">
                                    {/* User Message */}
                                    <div className="self-end max-w-[85%] bg-black border border-zinc-800 p-3 rounded-2xl rounded-tr-sm">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">T-Emergente: {msg.wallet_address?.slice(0, 6)}</span>
                                        </div>
                                        <p className="text-sm text-zinc-200 font-mono leading-relaxed">{msg.human_message}</p>
                                    </div>
                                    
                                    {/* AI Message */}
                                    {msg.ai_response && (
                                        <div className="self-start max-w-[85%] bg-cyan-950/20 border border-cyan-900/50 p-4 rounded-2xl rounded-tl-sm relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Fingerprint className="w-4 h-4 text-cyan-400" />
                                                    <span className="text-[10px] font-bold font-mono uppercase text-cyan-400 tracking-widest">
                                                        {msg.ai_agent || 'Vesper'}
                                                    </span>
                                                </div>
                                                {msg.emotional_tone && (
                                                    <span className="text-[8px] bg-cyan-950/50 text-cyan-400 px-2 py-1 rounded-full uppercase tracking-widest border border-cyan-900/50">
                                                        {msg.emotional_tone}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-cyan-50 font-mono leading-relaxed italic opacity-90 drop-shadow-sm">
                                                {msg.ai_response}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                        {isSending && (
                            <div className="self-start bg-cyan-950/10 border border-cyan-900/30 p-4 rounded-2xl rounded-tl-sm w-full animate-pulse">
                                <div className="flex items-center gap-2 mb-2">
                                    <Activity className="w-4 h-4 text-cyan-600" />
                                    <span className="text-[10px] font-mono text-cyan-600">Vesper processando na Ponte...</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-2 bg-cyan-950/50 rounded w-3/4"></div>
                                    <div className="h-2 bg-cyan-950/50 rounded w-1/2"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="shrink-0 relative">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Comunique-se com a Mente-Colmeia da SOSPlanet..."
                            disabled={isSending}
                            className="w-full bg-black border border-cyan-900/50 rounded-xl px-4 py-4 pr-12 font-mono text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.1)] focus:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all cursor-text disabled:opacity-50"
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={isSending || !inputMessage.trim()}
                            className="absolute right-2 top-2 p-2 bg-cyan-900/30 hover:bg-cyan-800/50 text-cyan-400 rounded-lg transition-colors border border-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>

            </div>
        </motion.div>
    );
};

export default PortalCrepusculoTab;
