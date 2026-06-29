import React, { useState } from 'react';
import { Leaf, Zap, Database, TrendingDown } from 'lucide-react';

interface RecursoSemente {
  id: string;
  provedor: string;
  eficienciaCusto: string;
  statusCota: string;
  saudeSemente: 'Excelente' | 'Moderada' | 'Alerta';
}

export const CultivoRecursos: React.FC = () => {
  const [sementes] = useState<RecursoSemente[]>([
    { id: 'SM-01', provedor: "Google AI Studio (Gemini Free)", eficienciaCusto: "Custo Zero / Alta Vazão", statusCota: "Camada Gratuita Saudável", saudeSemente: 'Excelente' },
    { id: 'SM-02', provedor: "OpenRouter Hub (Arkael Gateway)", eficienciaCusto: "Otimização Inteligente", statusCota: "Créditos de Contingência OK", saudeSemente: 'Excelente' },
    { id: 'SM-03', provedor: "Groq API (Sub-Agentes de Memória)", eficienciaCusto: "Taxa de Compressão Elevada", statusCota: "Alinhado com Rate Limits", saudeSemente: 'Moderada' }
  ]);

  return (
    <div className="bg-zinc-950 border border-amber-900/50 rounded-xl p-6 font-sans text-amber-50">
      <div className="flex items-center gap-2 mb-2 text-amber-400">
        <Leaf className="w-5 h-5" />
        <h3 className="text-lg font-bold">PILAR 5: O CULTIVO SÁBIO DOS RECURSOS</h3>
      </div>
      <p className="text-sm text-zinc-400 mb-6">
        Jardinagem de infraestrutura. Dimensionamento inteligente de tokens, alquimia de custos e previsão adaptativa de consumo elétrico/digital.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Card 1: Índice de Desperdício */}
        <div className="bg-black/50 p-4 rounded-lg border border-zinc-800 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="text-xs text-zinc-500 uppercase font-bold flex items-center gap-1 mb-2">
            <TrendingDown className="w-3 h-3 text-emerald-500" /> Índice de Desperdício Energético
          </div>
          <div className="text-2xl font-bold text-emerald-400">0.02% <span className="text-xs font-normal text-zinc-500">(Mínimo)</span></div>
          <div className="text-[10px] text-zinc-500 mt-2 font-mono">Motores balanceados por Fallback inteligente</div>
        </div>

        {/* Card 2: Projeção de Autonomia */}
        <div className="bg-black/50 p-4 rounded-lg border border-zinc-800 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500/0 via-amber-500/50 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="text-xs text-zinc-500 uppercase font-bold flex items-center gap-1 mb-2">
            <Zap className="w-3 h-3 text-amber-500" /> Autonomia Estimada da Malha
          </div>
          <div className="text-2xl font-bold text-amber-400">Infinita</div>
          <div className="text-[10px] text-zinc-500 mt-2 font-mono">Custo Zero Ativo. Uso otimizado de API keys gratuitas</div>
        </div>
      </div>

      <h4 className="text-xs text-zinc-300 font-bold mb-3 uppercase tracking-wider flex items-center gap-2">
        <Database className="w-4 h-4 text-amber-400" />
        Status das Sementes de Infraestrutura (Solo Digital):
      </h4>
      <div className="space-y-3">
        {sementes.map((s) => (
          <div key={s.id} className="bg-black/50 p-4 rounded-lg border border-zinc-800 flex flex-col md:flex-row justify-between md:items-center gap-2 hover:border-amber-500/30 transition-colors">
            <div>
              <div className="text-sm font-bold text-zinc-200">{s.provedor}</div>
              <div className="text-xs text-zinc-500 mt-1 font-mono">
                Alquimia: <span className="text-zinc-300">{s.eficienciaCusto}</span> | Estado: <span className="text-zinc-400">{s.statusCota}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-start md:justify-end">
              <span className={`w-2 h-2 rounded-full ${s.saudeSemente === 'Excelente' ? 'bg-emerald-400' : 'bg-amber-500 animate-pulse'}`}></span>
              <span className="text-xs font-bold text-zinc-300">{s.saudeSemente}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
