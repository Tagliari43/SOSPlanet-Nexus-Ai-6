import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface AgentInfo {
  id: string;
  name: string;
}

export const AGENTS: AgentInfo[] = [
  { id: 'nexus', name: 'Nexus Arquiteto (Gemini)' },
  { id: 'arkael', name: 'Arkael (OpenRouter)' },
  { id: 'groq', name: 'Groq (nGrok)' },
  { id: 'alquimista', name: 'Alquimista (Cerebras)' },
  { id: 'aethel', name: 'Aethel (Search)' },
  { id: 'zeta', name: 'Zeta (Groq/Meta)' }
];

interface AgentContextType {
  activeAgentId: string;
  setActiveAgentId: (id: string) => void;
  activeAgent: AgentInfo;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const AgentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeAgentId, setActiveAgentId] = useState<string>(AGENTS[0].id);

  const activeAgent = AGENTS.find(a => a.id === activeAgentId) || AGENTS[0];

  return (
    <AgentContext.Provider value={{ activeAgentId, setActiveAgentId, activeAgent }}>
      {children}
    </AgentContext.Provider>
  );
};

export const useAgent = () => {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
};
