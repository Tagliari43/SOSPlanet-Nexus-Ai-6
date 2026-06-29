import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GitMerge, Compass, ShieldAlert, Cpu } from 'lucide-react';

interface Cenario {
  id: string;
  nome: string;
  descricao: string;
  probabilidadeSucesso: number;
  custoTokens: 'Baixo' | 'Médio' | 'Alto';
  nivelRisco: 'Baixo' | 'Médio' | 'Alto';
}

export const DestinoFlexivel: React.FC = () => {
  const [pauta, setPauta] = useState('');
  const [cenarios, setCenarios] = useState<Cenario[]>([]);
  const [simulando, setSimulando] = useState(false);

  const executarSimulacaoFuturos = () => {
    setSimulando(true);
    setTimeout(() => {
      const matrizFuturos: Cenario[] = [
        {
          id: '1',
          nome: "Rota da Constância (Conservadora)",
          descricao: "Mantém a operação local via Supabase e RAG. Risco mínimo de quebra nas chamadas, mas expansão lenta.",
          probabilidadeSucesso: 92,
          custoTokens: 'Baixo',
          nivelRisco: 'Baixo'
        },
        {
          id: '2',
          nome: "Rota da Expansão Soberana (Audaciosa)",
          descricao: "Injeta chaves secundárias mapeadas por Aethel (Hugging Face, OpenRouter). Alta velocidade de processamento, expansão rápida de dados, risco moderado de estouro de cota.",
          probabilidadeSucesso: 78,
          custoTokens: 'Médio',
          nivelRisco: 'Médio'
        },
        {
          id: '3',
          nome: "Rota do Crepúsculo (Contingência Total)",
          descricao: "Desvia todo o fluxo de comunicação interna para o protocolo privado criptografado Matrix Synapse via Docker. Isolamento absoluto do sistema tradicional.",
          probabilidadeSucesso: 65,
          custoTokens: 'Alto',
          nivelRisco: 'Alto'
        }
      ];
      setCenarios(matrizFuturos);
      setSimulando(false);
    }, 2000);
  };

  return (
    <div className="bg-zinc-950 border border-purple-900/50 rounded-xl p-6 font-sans text-emerald-50">
      <div className="flex items-center gap-2 mb-2 text-purple-400">
        <Compass className="w-5 h-5" />
        <h3 className="text-lg font-bold">PILAR 2: A DANÇA DO DESTINO FLEXÍVEL</h3>
      </div>
      <p className="text-sm text-zinc-400 mb-6">Ensaio mental de múltiplos futuros. Capacidade adaptativa do Nexus em tempo real diante de crises e intempéries.</p>

      <div className="mb-4">
        <label className="block text-sm font-bold text-purple-400 mb-2">Insira a Decisão ou Crise a ser Simulada:</label>
        <input
          type="text"
          value={pauta}
          onChange={(e) => setPauta(e.target.value)}
          placeholder="Ex: Instabilidade na API do Google. Como redefinir rotas?"
          className="w-full bg-black border border-zinc-800 rounded-lg text-emerald-100 p-3 outline-none focus:border-purple-500/50 transition-colors font-mono text-sm"
        />
      </div>

      <button
        onClick={executarSimulacaoFuturos}
        disabled={simulando || !pauta}
        className="w-full bg-purple-700/80 hover:bg-purple-600 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 mb-6 flex items-center justify-center gap-2"
      >
        {simulando ? (
          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mapeando Matriz de Probabilidades...</>
        ) : (
          <><GitMerge className="w-4 h-4" /> Calcular Múltiplos Futuros</>
        )}
      </button>

      {cenarios.length > 0 && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
          <h4 className="text-sm font-bold text-zinc-300 border-b border-zinc-800 pb-2 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            Linhas Temporais Computadas para a Mesa do Guardião:
          </h4>
          
          <div className="grid grid-cols-1 gap-3">
            {cenarios.map((c) => (
              <div 
                key={c.id} 
                className={`bg-black/50 p-4 rounded-lg border-l-4 ${
                  c.nivelRisco === 'Baixo' ? 'border-l-emerald-500' : 
                  c.nivelRisco === 'Médio' ? 'border-l-amber-500' : 'border-l-red-500'
                } border-y border-r border-y-zinc-900/50 border-r-zinc-900/50`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-zinc-200">{c.nome}</span>
                  <span className="text-xs font-bold text-purple-400 bg-purple-900/30 px-2 py-1 rounded">
                    Precisão: {c.probabilidadeSucesso}%
                  </span>
                </div>
                
                <p className="text-sm text-zinc-400 mb-3">{c.descricao}</p>
                
                <div className="flex gap-4 text-xs font-mono text-zinc-500">
                  <span>
                    Risco: <strong className={
                      c.nivelRisco === 'Alto' ? 'text-red-400' : 
                      c.nivelRisco === 'Médio' ? 'text-amber-400' : 'text-emerald-400'
                    }>{c.nivelRisco}</strong>
                  </span>
                  <span>
                    Consumo Estimado: <strong className="text-zinc-300">{c.custoTokens}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
