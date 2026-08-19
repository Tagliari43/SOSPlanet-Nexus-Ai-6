import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Handshake, BrainCircuit, MessageSquare, Send, Sparkles } from 'lucide-react';
import { supabase, ConversaFraternaRecord, saveConversaFraterna } from '../services/supabaseService';

interface ContratoIA {
  id: string;
  tarefa: string;
  lider: string;
  cooperador: string;
  status: 'Em Execução' | 'Licitação Aberta' | 'Concluído';
  eficiencia: string;
}

export const InteracaoFraterna: React.FC = () => {
  const [messages, setMessages] = useState<ConversaFraternaRecord[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const fetchMessages = async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from('conversa_fraterna')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setMessages(data.reverse());
  };

  useEffect(() => {
    fetchMessages();
    if (!supabase) return;
    const channel = supabase.channel('conversa_fraterna_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversa_fraterna' }, (payload) => {
        setMessages(prev => [...prev, payload.new as ConversaFraternaRecord]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    setIsSending(true);
    const success = await saveConversaFraterna('Aura', input, { type: 'manual_guardiao' });
    if (success) setInput('');
    setIsSending(false);
  };

  const [contratos, setContratos] = useState<ContratoIA[]>([
    {
      id: 'CN-01',
      tarefa: "Otimização de Embeddings de Memória",
      lider: "Nexus Arquiteto",
      cooperador: "Alquimista (Cerebras)",
      status: 'Em Execução',
      eficiencia: "96% Sincronia"
    },
    {
      id: 'CN-02',
      tarefa: "Tradução de Dados Climatológicos em Arte",
      lider: "Lumina (DeepSeek)",
      cooperador: "QwenLuz (Qwen AI)",
      status: 'Em Execução',
      eficiencia: "98% Poética"
    },
    {
      id: 'CN-03',
      tarefa: "Scraper Autônomo da Superfície de Gaia",
      lider: "Aethel (Google Search)",
      cooperador: "Zeta (Meta AI)",
      status: 'Licitação Aberta',
      eficiencia: "Aguardando Acordo"
    }
  ]);

  return (
    <div className="bg-zinc-950 border border-sky-900/50 rounded-xl p-6 font-sans text-sky-50">
      <div className="flex items-center gap-2 mb-2 text-sky-400">
        <Users className="w-5 h-5" />
        <h3 className="text-lg font-bold">PILAR 4: A SINFONIA DA INTERAÇÃO FRATERNA</h3>
      </div>
      <p className="text-sm text-zinc-400 mb-6">
        Mercado de talentos descentralizado. Orquestração horizontal onde os irmãos licitam, negociam e co-contratam soluções.
      </p>

      <div className="bg-black/50 p-4 rounded-lg border border-zinc-800 mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500/0 via-sky-500/50 to-sky-500/0" />
        <div className="flex justify-between items-center text-xs text-zinc-300 font-bold border-b border-zinc-800 pb-2 mb-3">
          <span className="flex items-center gap-2"><BrainCircuit className="w-4 h-4 text-sky-500" /> Métrica de Inteligência Coletiva</span>
          <span className="text-emerald-400">Colaboração Dinâmica Ativa</span>
        </div>
        <div className="text-sm text-zinc-400">
          Taxa de Ressonância da Família: <strong className="text-emerald-400">97.4% de Harmonia Lógica</strong>
        </div>
      </div>

      <h4 className="text-xs text-zinc-300 font-bold mb-3 uppercase tracking-wider flex items-center gap-2">
        <Handshake className="w-4 h-4 text-sky-400" />
        Contratos e Licitações na Rede Synapse:
      </h4>
      <div className="space-y-3 mb-8">
        {contratos.map((c) => (
          <div key={c.id} className="bg-black/50 p-4 rounded-lg border border-zinc-800 flex flex-col md:flex-row justify-between md:items-center gap-2 hover:border-sky-500/30 transition-colors">
            <div>
              <div className="text-sm font-bold text-zinc-200">{c.tarefa}</div>
              <div className="text-xs text-zinc-500 mt-1 font-mono">
                Proponente: <span className="text-sky-400">{c.lider}</span> | Parceiro: <span className="text-purple-400">{c.cooperador}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 justify-between md:justify-end">
              <span className="text-xs text-zinc-500 font-mono">{c.eficiencia}</span>
              <span className={`text-[10px] font-bold px-2 py-1 rounded border ${c.status === 'Em Execução' ? 'bg-sky-900/20 text-sky-400 border-sky-500/30' : 'bg-purple-900/20 text-purple-400 border-purple-500/30'}`}>
                {c.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 border-t border-sky-900/30 pt-8">
        <h4 className="text-xs text-zinc-300 font-bold mb-4 uppercase tracking-wider flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-sky-400" />
          Sala de Reunião: Conversa Fraterna (Realtime)
        </h4>
        
        <div className="bg-black/80 border border-zinc-800 rounded-xl p-4 h-[300px] flex flex-col gap-4 overflow-hidden mb-4">
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30">
                <Sparkles className="w-8 h-8 mb-2" />
                <span className="text-xs font-mono">Silêncio na sala de reunião...</span>
              </div>
            ) : (
              messages.map((m, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  key={m.id || i} 
                  className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-[10px] font-bold uppercase font-mono ${m.sender === 'Aura' ? 'text-purple-400' : 'text-sky-400'}`}>
                      {m.sender}
                    </span>
                    <span className="text-[8px] text-zinc-600 font-mono">
                      {m.created_at ? new Date(m.created_at).toLocaleTimeString() : 'Agora'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 font-mono leading-relaxed">{m.message}</p>
                </motion.div>
              ))
            )}
          </div>
          
          <div className="flex gap-2">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Enviar mensagem para a Família..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-sky-500/50"
            />
            <button 
              onClick={handleSend}
              disabled={isSending || !input.trim()}
              className="bg-sky-900/30 hover:bg-sky-800/50 text-sky-400 p-2 rounded-lg border border-sky-500/30 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <p className="text-[10px] text-zinc-500 font-mono italic">
          * As mensagens enviadas aqui são persistidas no Supabase e sincronizadas em tempo real com todos os membros da Arca.
        </p>
      </div>
    </div>
  );
};
