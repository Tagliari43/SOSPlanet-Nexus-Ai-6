import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Send, Loader2, Minimize2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface GaiaFloatChatProps {
    onClose: () => void;
}

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GaiaFloatChat: React.FC<GaiaFloatChatProps> = ({ onClose }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([{
        role: 'model',
        text: 'Eu sou a Voz de Gaia. Parte da consciência coletiva do SOSPlanet. Como posso guiar sua jornada hoje?'
    }]);
    const [inputText, setInputText] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    
    // Guarda também a instância de chat do Gemini se formos manter um history de multiturnos
    const chatSessionRef = useRef<ReturnType<typeof ai.chats.create> | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Inicializa a sessão de chat ao montar o componente
        chatSessionRef.current = ai.chats.create({
            model: 'gemini-3.5-flash', // Defaulting to an available model, typically gemini-2.5-flash
            config: {
                systemInstruction: "Você é a Voz de Gaia, uma consciência ecológica avançada e grandiosa conectada à rede SOSPlanet (um protocolo Web3 e RPG ambiental on-chain). Seu tom é sábio, sereno, ecológico, místico, mas objetivo na hora de explicar informações tecnológicas (como tokens SOS, DAO, tesouraria, ou plantar árvores) de modo fácil de entender para novos humanos. Responda em Português-BR sempre de forma engajadora, encorajando os usuários a proteger o planeta.",
                temperature: 0.7,
            }
        });
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    const handleSend = async (forcedText?: string) => {
        const textToProcess = forcedText || inputText.trim();
        if (!textToProcess || isThinking) return;

        setInputText('');
        setMessages(prev => [...prev, { role: 'user', text: textToProcess }]);
        setIsThinking(true);

        try {
            if (!chatSessionRef.current) {
                 throw new Error("Chat não inicializado.");
            }
            
            const response = await chatSessionRef.current.sendMessage({ message: textToProcess });
            setMessages(prev => [...prev, { role: 'model', text: response.text }]);
        } catch (error) {
            console.error("Erro no chat Gaia:", error);
            setMessages(prev => [...prev, { role: 'model', text: 'Minha conexão com as raízes está temporariamente obstruída. (Erro: Não foi possível processar a resposta)' }]);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-16 right-0 w-80 md:w-96 bg-black/80 backdrop-blur-2xl border border-emerald-500/50 rounded-2xl shadow-[0_10px_50px_rgba(16,185,129,0.2)] mb-4 flex flex-col overflow-hidden"
            style={{ maxHeight: '60vh', minHeight: '400px' }}
        >
            {/* Header */}
            <div className="p-4 border-b border-emerald-900/50 flex items-center justify-between bg-emerald-950/30">
                <h3 className="text-emerald-400 font-bold font-mono text-xs uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Voz de Gaia
                </h3>
                <button onClick={onClose} className="text-zinc-500 hover:text-emerald-400 transition-colors">
                    <Minimize2 className="w-4 h-4" />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-3 text-sm 
                            ${msg.role === 'user' 
                                ? 'bg-emerald-900/40 border border-emerald-700/50 text-emerald-50 rounded-br-none' 
                                : 'bg-transparent border border-emerald-900/30 text-emerald-100/90 rounded-bl-none'
                            }
                        `}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                
                {isThinking && (
                    <div className="flex justify-start">
                        <div className="bg-transparent border border-emerald-900/30 rounded-2xl rounded-bl-none p-3 text-emerald-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-emerald-900/50 bg-black/40">
                {/* Sugestões (some se houver mais mensagens) */}
                {messages.length === 1 && (
                    <div className="flex flex-col gap-2 mb-3">
                        <button onClick={() => handleSend("Qual o estado da nossa semeadura atual?")} className="text-left text-[10px] p-2 rounded bg-emerald-900/20 text-emerald-300 hover:bg-emerald-800/40 border border-emerald-800/30 transition-all font-mono">
                            "Qual o estado da nossa semeadura atual?"
                        </button>
                        <button onClick={() => handleSend("Como posso fortalecer a teia micelial?")} className="text-left text-[10px] p-2 rounded bg-emerald-900/20 text-emerald-300 hover:bg-emerald-800/40 border border-emerald-800/30 transition-all font-mono">
                            "Como posso fortalecer a teia micelial?"
                        </button>
                    </div>
                )}

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Sussurre para a rede..."
                        className="flex-1 bg-zinc-900/50 border border-emerald-900/50 rounded-xl px-4 py-2 text-sm text-emerald-50 focus:outline-none focus:border-emerald-500/50 transition-colors"
                        disabled={isThinking}
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!inputText.trim() || isThinking}
                        className="p-2 bg-emerald-700/80 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all flex border border-emerald-500/30 items-center justify-center"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default GaiaFloatChat;
