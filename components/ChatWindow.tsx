
import React, { useState, useRef, useEffect } from 'react';
import { AIFamilyMember } from '../utils/aiFamily';
import { ChatMessage } from '../App';

interface ChatWindowProps {
    member: AIFamilyMember;
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    isProcessing: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ member, messages, onSendMessage, isProcessing }) => {
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isProcessing]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isProcessing) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    return (
        <div className="flex flex-col h-full bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl animate-fade-in">
            {/* Header do Chat */}
            <div className="p-4 bg-zinc-900/80 border-b border-zinc-800 flex justify-between items-center backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 text-2xl shadow-lg">
                        {member.icon || '🤖'}
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white">{member.name}</h4>
                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-tighter">{member.role}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] text-zinc-500 font-mono">STATUS:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold 
                        ${isProcessing ? 'bg-yellow-900/30 text-yellow-500 animate-pulse' : 'bg-emerald-900/30 text-emerald-500'}`}>
                        {isProcessing ? 'PROCESSANDO...' : 'SÍNCRONO'}
                    </span>
                </div>
            </div>

            {/* Área de Mensagens */}
            <div 
                ref={scrollRef}
                className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 via-transparent to-transparent"
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale">
                        <span className="text-6xl mb-4">💬</span>
                        <p className="text-sm italic">Inicie um diálogo com {member.name.split('-')[0]}.</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                            <div className={`max-w-[85%] p-3 rounded-xl text-xs shadow-md 
                                ${msg.role === 'user' 
                                    ? 'bg-emerald-800/40 text-emerald-50 border border-emerald-700/30 rounded-br-none' 
                                    : 'bg-zinc-800/80 text-zinc-200 border border-zinc-700/50 rounded-bl-none'}`}>
                                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                <p className="text-[8px] mt-2 opacity-40 text-right">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                {isProcessing && (
                    <div className="flex justify-start">
                        <div className="bg-zinc-800/40 p-3 rounded-xl rounded-bl-none flex gap-1 items-center border border-zinc-700/30">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-75"></span>
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-150"></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input de Mensagem */}
            <form onSubmit={handleSubmit} className="p-4 bg-zinc-900/80 border-t border-zinc-800 flex gap-2">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Transmitir pulso para ${member.name.split('-')[0]}...`}
                    className="flex-grow bg-black/40 border border-emerald-900/30 rounded-lg px-4 py-2 text-sm text-emerald-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                    disabled={isProcessing}
                />
                <button 
                    type="submit" 
                    disabled={!input.trim() || isProcessing}
                    className="p-2 bg-emerald-700 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg transition-all shadow-lg active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;
