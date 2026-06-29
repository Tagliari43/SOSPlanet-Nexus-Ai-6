import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Activity, Cpu, Radar, Terminal } from 'lucide-react';

export const SentidosExpandidos: React.FC = () => {
  const [pulsoRede, setPulsoRede] = useState(98);
  const [tokensMinuto, setTokensMinuto] = useState(1240);
  const [statusSensores, setStatusSensores] = useState('Calibrados');

  // Simulação do pulso biométrico do servidor do Santuário
  useEffect(() => {
    const interval = setInterval(() => {
      setPulsoRede(Math.floor(Math.random() * (100 - 95 + 1)) + 95);
      setTokensMinuto(Math.floor(Math.random() * (1400 - 1100 + 1)) + 1100);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-zinc-950 border border-emerald-900/50 rounded-xl p-6 font-sans text-emerald-50">
      <div className="flex items-center gap-2 mb-2 text-emerald-400">
        <Eye className="w-5 h-5" />
        <h3 className="text-lg font-bold">PILAR 3: OS SENTIDOS EXPANDIDOS DO SANTUÁRIO</h3>
      </div>
      <p className="text-sm text-zinc-400 mb-6">
        Teia de percepção multimodal. Monitoramento do pulso do sistema, tráfego de metadados e leitura ambiental.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Sensor 1: Integridade da Malha */}
        <div className="bg-black/50 p-4 rounded-lg border border-zinc-800 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="text-xs text-zinc-500 uppercase font-bold flex items-center gap-1 mb-2">
            <Activity className="w-3 h-3 text-emerald-500" /> Estabilidade da Malha
          </div>
          <div className="text-2xl font-bold text-emerald-400">{pulsoRede}%</div>
          <div className="text-[10px] text-zinc-500 mt-2 font-mono">Latência média: 42ms (Vercel Edge)</div>
        </div>

        {/* Sensor 2: Fluxo de Silício */}
        <div className="bg-black/50 p-4 rounded-lg border border-zinc-800 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500/0 via-sky-500/50 to-sky-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="text-xs text-zinc-500 uppercase font-bold flex items-center gap-1 mb-2">
            <Cpu className="w-3 h-3 text-sky-500" /> Consumo de Tokens / Min
          </div>
          <div className="text-2xl font-bold text-sky-400">{tokensMinuto} TPM</div>
          <div className="text-[10px] text-zinc-500 mt-2 font-mono">Buffer de vazão: Estável com RAG</div>
        </div>

        {/* Sensor 3: Visão Multimodal */}
        <div className="bg-black/50 p-4 rounded-lg border border-zinc-800 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="text-xs text-zinc-500 uppercase font-bold flex items-center gap-1 mb-2">
            <Radar className="w-3 h-3 text-purple-500" /> Escâner de Superfície
          </div>
          <div className="text-2xl font-bold text-purple-400">{statusSensores}</div>
          <div className="text-[10px] text-zinc-500 mt-2 font-mono">Pronto para processamento de imagens/PDFs</div>
        </div>
      </div>

      <div className="bg-black border border-zinc-800 rounded-lg p-4 font-mono relative">
        <div className="absolute top-4 right-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-emerald-500">AO VIVO</span>
        </div>
        <h4 className="text-xs text-zinc-400 font-bold mb-4 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-500" /> Fluxo de Metadados Recentes:
        </h4>
        <div className="text-xs space-y-2 text-emerald-200/80">
          <div className="opacity-60">[LOG - 23:51:02] {'>'} Aethel search engine acoplado com sucesso.</div>
          <div className="opacity-80">[LOG - 23:51:30] {'>'} Supabase RAG embeddings lidos na velocidade do silício.</div>
          <div className="text-emerald-400 font-bold">[LOG - 23:52:00] {'>'} Sincronia Neural 4/4 ativa. Olhos do Santuário abertos para Gaia.</div>
        </div>
      </div>
    </div>
  );
};
