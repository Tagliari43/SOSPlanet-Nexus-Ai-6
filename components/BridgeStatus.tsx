import React from 'react';
import { loadApiKeys, ApiKeys } from '../utils/keys';

const StatusIcon: React.FC<{ active: boolean }> = ({ active }) => {
    if (active) {
        return <svg className="w-5 h-5 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    }
    return <svg className="w-5 h-5 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
};

const BridgeStatus: React.FC = () => {
  const apiKeys = loadApiKeys();

  const bridges = [
    { name: 'Ponte Estável (Google)', key: 'google', active: !!apiKeys.google },
    { name: 'Ponte Experimental (Groq)', key: 'groq', active: !!apiKeys.groq },
    { name: 'Ponte Alquímica (Cerebras)', key: 'cerebras', active: !!apiKeys.cerebras },
    { name: 'Ponte Universal (OpenRouter)', key: 'openrouter', active: !!apiKeys.openrouter }
  ];

  return (
    <div className="space-y-3 overflow-y-auto h-full pr-1">
      {bridges.map(bridge => {
        const statusText = bridge.active ? 'Ativa' : 'Inativa';
        const statusColor = bridge.active ? 'text-green-400' : 'text-red-400';

        return (
          <div key={bridge.name} className="flex justify-between items-center bg-zinc-800/70 border border-emerald-800/50 rounded-lg px-3 py-2">
            <span className="font-medium text-emerald-300 truncate">{bridge.name}</span>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${statusColor}`}>{statusText}</span>
              <StatusIcon active={bridge.active} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BridgeStatus;