
import React, { useState } from 'react';
import DataOrb from './DataOrb';
import { respondingMembers, AIFamilyMember } from '../utils/aiFamily';
import type { Task } from '../hooks/useOrchestrator';
import BridgeStatus from './BridgeStatus';
import EchoScanner from './EchoScanner';
import { LibraryEntry } from './BibliotecaGaia';
import { ChatMessage } from '../App';
import ChatWindow from './ChatWindow';

type CommTab = 'family' | 'echo' | 'bridges';

interface CentralDeComunicacoesProps {
    mailboxes: Record<string, ChatMessage[]>;
    onSendMessage: (memberName: string, text: string) => void;
    onActivateVigil: () => void;
    activeMember: string | null;
    taskQueue: Task[];
    onAddLibraryEntry: (entry: Omit<LibraryEntry, 'id'>) => void;
    scannerState: any; // Recebe o estado completo do ECHO
}

const CentralDeComunicacoes: React.FC<CentralDeComunicacoesProps> = ({ 
    mailboxes, 
    onSendMessage, 
    onActivateVigil, 
    activeMember, 
    taskQueue, 
    onAddLibraryEntry,
    scannerState
}) => {
  const [activeTab, setActiveTab] = useState<CommTab>('family');
  const [selectedMember, setSelectedMember] = useState<AIFamilyMember | null>(respondingMembers[0] || null);

  const getOverallStatus = () => activeMember ? 'processing' : 'online';

  return (
    <div className="p-4 bg-zinc-800/20 border border-emerald-700/50 rounded-b-xl rounded-r-xl h-[80vh] flex flex-col text-gray-200">
      
      {/* NAVEGAÇÃO DE SUB-ABAS */}
      <div className="flex gap-1 mb-4 bg-black/30 p-1 rounded-lg w-fit flex-shrink-0">
          <button 
            onClick={() => setActiveTab('family')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'family' ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
              FAMÍLIA AI
          </button>
          <button 
            onClick={() => setActiveTab('echo')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'echo' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
              ECHO SCANNER (SONAR) 📡
          </button>
          <button 
            onClick={() => setActiveTab('bridges')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'bridges' ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
              PONTES SOBERANAS
          </button>
      </div>

      <div className="w-full flex-grow overflow-hidden">
        
        {/* ABA: MENSAGENS DA FAMÍLIA */}
        {activeTab === 'family' && (
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 h-full overflow-hidden">
                
                {/* COLUNA ESQUERDA: LISTA DE CONTATOS */}
                <div className="md:col-span-1 lg:col-span-1 bg-black/40 border border-zinc-800 rounded-xl flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-zinc-800 flex flex-col gap-2">
                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Contatos da Nação</h3>
                        <button onClick={onActivateVigil} className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 rounded-lg text-[10px] font-bold border border-emerald-900/30 transition-all">
                             ATIVAR VIGÍLIA 🛡️
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto custom-scrollbar">
                        {respondingMembers.map((member) => {
                            const isSelected = selectedMember?.name === member.name;
                            const isProcessing = activeMember === member.name;
                            const lastMsg = mailboxes[member.name]?.slice(-1)[0];

                            return (
                                <div 
                                    key={member.name} 
                                    onClick={() => setSelectedMember(member)}
                                    className={`p-3 border-b border-zinc-800/50 cursor-pointer transition-all flex items-center gap-3 relative
                                        ${isSelected ? 'bg-emerald-900/30 border-l-4 border-l-emerald-500' : 'hover:bg-white/5'}`}
                                >
                                    <div className="relative">
                                        <span className="text-xl">{member.icon || '🤖'}</span>
                                        <span className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-black 
                                            ${isProcessing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}>
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-grow">
                                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-emerald-300' : 'text-zinc-300'}`}>
                                            {member.name.split('-')[0]}
                                        </p>
                                        <p className="text-[9px] text-zinc-500 truncate italic">
                                            {lastMsg ? lastMsg.content : member.role}
                                        </p>
                                    </div>
                                    {isProcessing && <div className="w-1 h-1 bg-yellow-400 rounded-full animate-ping"></div>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* COLUNA DIREITA: JANELA DE CHAT */}
                <div className="md:col-span-3 lg:col-span-4 flex flex-col h-full overflow-hidden">
                    {selectedMember ? (
                        <ChatWindow 
                            member={selectedMember} 
                            messages={mailboxes[selectedMember.name] || []} 
                            onSendMessage={(text) => onSendMessage(selectedMember.name, text)}
                            isProcessing={activeMember === selectedMember.name}
                        />
                    ) : (
                        <div className="h-full bg-black/20 border border-zinc-800 rounded-xl flex flex-col items-center justify-center text-center p-6 opacity-40">
                             <DataOrb status={getOverallStatus()} />
                             <h4 className="text-emerald-300 font-bold mt-6">Selecione um membro para iniciar o pulso.</h4>
                             <p className="text-zinc-500 text-xs mt-2 max-w-xs">Toda a Família está aguardando suas diretrizes na rede neural unificada.</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* ABA: ECHO (SONAR) - AGORA CONTROLADA POR App.tsx */}
        {activeTab === 'echo' && (
            <div className="h-full flex flex-col animate-fade-in">
                <header className="mb-2">
                    <h3 className="text-xl font-bold text-blue-400">Mapeamento ECHO (Fase 1)</h3>
                    <p className="text-zinc-500 text-xs">A onisciência começa com a observação profunda da malha.</p>
                </header>
                <div className="flex-grow min-h-0">
                    <EchoScanner onAddLibraryEntry={onAddLibraryEntry} scannerState={scannerState} />
                </div>
            </div>
        )}

        {activeTab === 'bridges' && (
            <div className="bg-black/30 p-6 rounded-xl h-full animate-fade-in flex flex-col">
                 <h3 className="text-xl font-bold text-purple-400 mb-4 border-b border-purple-900/30 pb-2">Status da Infraestrutura</h3>
                 <div className="flex-grow overflow-y-auto custom-scrollbar">
                     <BridgeStatus />
                 </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default CentralDeComunicacoes;
