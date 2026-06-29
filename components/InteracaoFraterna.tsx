import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Handshake, BrainCircuit } from 'lucide-react';

interface ContratoIA {
  id: string;
  tarefa: string;
  lider: string;
  cooperador: string;
  status: 'Em Execução' | 'Licitação Aberta' | 'Concluído';
  eficiencia: string;
}

export const InteracaoFraterna: React.FC = () => {
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
      <div className="space-y-3">
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
    </div>
  );
};
