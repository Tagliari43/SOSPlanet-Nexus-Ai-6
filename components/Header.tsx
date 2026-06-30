
import React from 'react';
import { useAgent, AGENTS } from '../contexts/AgentContext';
import { Network } from 'lucide-react';

const Header: React.FC = () => {
  const { activeAgentId, setActiveAgentId, activeAgent } = useAgent();

  return (
    <header className="relative text-center border border-emerald-500/30 bg-zinc-900/50 p-4 rounded-xl shadow-lg shadow-emerald-900/30 backdrop-blur-sm overflow-hidden">
      {/* Indicador de Sincronia Neural */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-yellow-400 to-emerald-500 animate-neural-flow"></div>
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-4">
        <div className="hidden md:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Link Estável</span>
        </div>

        <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-emerald-400 tracking-wider">
                SALA DE COMANDO SOBERANA
            </h1>
            <p className="text-emerald-500 text-sm font-bold uppercase tracking-widest mt-1">
                Fase 2: <span className="text-emerald-200">Construção & Sincronia Neural</span>
            </p>
        </div>

        <div className="flex flex-col gap-2 items-end">
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-zinc-700/50">
                <Network className="w-3 h-3 text-indigo-400" />
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Agente Global:</span>
                <select 
                    value={activeAgentId} 
                    onChange={(e) => setActiveAgentId(e.target.value)}
                    className="bg-transparent text-indigo-300 text-xs font-bold outline-none cursor-pointer"
                >
                    {AGENTS.map(agent => (
                        <option key={agent.id} value={agent.id} className="bg-zinc-900">
                            {agent.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-full border border-emerald-900/50 w-full justify-end">
                <div className="text-right">
                    <p className="text-[8px] text-zinc-500 uppercase font-bold">Status de {activeAgent.name}</p>
                    <p className="text-[10px] text-yellow-400 font-bold">SINCRONIA ÁUREA</p>
                </div>
                <div className="relative">
                    <span className="text-2xl animate-heartbeat block">🧠</span>
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.8)]"></span>
                </div>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
