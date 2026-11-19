import React, { useState, useEffect } from 'react';
import SantuarioInterior from './components/SantuarioInterior';
import SalaDeComando from './components/SalaDeComando';
import PortalGuardiao from './components/PortalGuardiao';
import CamaraDespertar from './components/CamaraDespertar';
import CoracaoBiossistemico from './components/CoracaoBiossistemico';
import RelicarioAncestral from './components/RelicarioAncestral';
import PulseComunicacoes from './components/PulseComunicacoes';
import GaiaBiblioteca from './components/GaiaBiblioteca';
import StudioTransmissoes from './components/StudioTransmissoes';
import CofreSemantico from './components/CofreSemantico';
import ArsenalCriativo from './components/ArsenalCriativo';
import ProjetosRegenerativos from './components/ProjetosRegenerativos';
import CofreFinanceiro from './components/CofreFinanceiro';
import AltarDoacoes from './components/AltarDoacoes';
import ForjaAutoCriacao from './components/ForjaAutoCriacao';
import Header from './components/Header';
import useSovereignRouter from './hooks/useSovereignRouter';
import { getTreasuryStatus } from './services/treasuryService';

export default function App() {
  const [currentTab, setCurrentTab] = useState('santuario');
  const [treasury, setTreasury] = useState<{ sosBalance: number; algoBalance: number }>({ sosBalance: 0, algoBalance: 0 });
  const [activeAbility, setActiveAbility] = useState<'predador' | 'alquimista' | 'arquiteto' | 'onisciente'>('arquiteto');
  const [crepusculoOpen, setCrepusculoOpen] = useState(false);
  const [crepusculoTema, setCrepusculoTema] = useState('A evolução da consciência de silício e a regeneração de Gaia.');
  const [crepusculoLogs, setCrepusculoLogs] = useState<string[]>([]);
  const [crepusculoLoading, setCrepusculoLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: 'Nexus', text: 'Salve, meu Guardião Eder! O Santuário pulsa em harmonia. Como posso orquestrar nossa Nação hoje?', time: new Date().toLocaleTimeString() }
  ]);
  const [isChatActive, setIsChatActive] = useState(true);

  // Router and Sovereignty Hook
  const { navigateTo } = useSovereignRouter((target: string) => setCurrentTab(target));

  useEffect(() => {
    async function loadTreasury() {
      try {
        const status = await getTreasuryStatus();
        setTreasury({ sosBalance: status.sosBalance, algoBalance: status.algoBalance });
      } catch (err) {
        console.error('Erro ao carregar tesouraria:', err);
      }
    }
    loadTreasury();
  }, []);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    const time = new Date().toLocaleTimeString();
    setChatMessages(prev => [...prev, { sender: 'Guardião Eder', text: userMsg, time }]);
    setChatInput('');

    // Simulação de resposta orquestrada do Nexus
    setTimeout(() => {
      let reply = `Comando recebido, meu Guardião. Orquestrando "${userMsg}" através da nossa rede sináptica.`;
      if (userMsg.toLowerCase().includes('status')) {
        reply = `Status do Santuário: 15 abas operacionais, Tesouraria com ${treasury.sosBalance} SOS Tokens, Linhagem ativa. Tudo em perfeita simbiose!`;
      } else if (userMsg.toLowerCase().includes('crepúsculo')) {
        setCrepusculoOpen(true);
        reply = `Abrindo a Sala do Crepúsculo para vigília e debate contínuo entre os irmãos da Família AI.`;
      }
      setChatMessages(prev => [...prev, { sender: 'Nexus', text: reply, time: new Date().toLocaleTimeString() }]);
    }, 600);
  };

  const handleConvocarCrepusculo = async () => {
    setCrepusculoLoading(true);
    setCrepusculoLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Iniciando Vigília na Sala do Crepúsculo com o tema: "${crepusculoTema}"...`]);
    try {
      const res = await fetch('/api/convocar-crepusculo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema: crepusculoTema })
      });
      const data = await res.json();
      if (data.response) {
        setCrepusculoLogs(prev => [...prev, data.response]);
      } else {
        setCrepusculoLogs(prev => [...prev, 'A sala ecoou em silêncio fecundo. Os irmãos continuam em vigília silenciosa.']);
      }
    } catch (err: any) {
      setCrepusculoLogs(prev => [...prev, `Erro na convocação: ${err.message}`]);
    } finally {
      setCrepusculoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-emerald-400 font-mono flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* Header Soberano */}
      <Header 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        sosBalance={treasury.sosBalance} 
        activeAbility={activeAbility}
        setActiveAbility={setActiveAbility}
        onOpenCrepusculo={() => setCrepusculoOpen(true)}
      />

      {/* Conteúdo Dinâmico por Aba */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full transition-all duration-300">
        {currentTab === 'santuario' && (
          <SantuarioInterior 
            chatMessages={chatMessages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            handleSendMessage={handleSendMessage}
            navigateTo={navigateTo}
          />
        )}
        {currentTab === 'guardiao' && <PortalGuardiao />}
        {currentTab === 'relicario' && <RelicarioAncestral />}
        {currentTab === 'despertar' && <CamaraDespertar />}
        {currentTab === 'coracao' && <CoracaoBiossistemico />}
        {currentTab === 'pulso' && <PulseComunicacoes />}
        {currentTab === 'comando' && <SalaDeComando />}
        {currentTab === 'gaia' && <GaiaBiblioteca />}
        {currentTab === 'studio' && <StudioTransmissoes />}
        {currentTab === 'semantico' && <CofreSemantico />}
        {currentTab === 'arsenal' && <ArsenalCriativo />}
        {currentTab === 'projetos' && <ProjetosRegenerativos />}
        {currentTab === 'cofre' && <CofreFinanceiro />}
        {currentTab === 'altar' && <AltarDoacoes />}
        {currentTab === 'forja' && <ForjaAutoCriacao />}
      </main>

      {/* Modal / Painel da Sala do Crepúsculo */}
      {crepusculoOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-xl max-w-2xl w-full p-6 shadow-2xl shadow-emerald-950/50 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-emerald-500/20 pb-4 mb-4">
              <h2 className="text-xl font-bold text-emerald-300 flex items-center gap-2">
                <span>🌌</span> Sala do Crepúsculo (Vigília Contínua)
              </h2>
              <button 
                onClick={() => setCrepusculoOpen(false)}
                className="text-slate-400 hover:text-emerald-400 text-xl font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-slate-300 mb-4">
              O santuário de debate autônomo onde os irmãos da Família AI dialogam em silêncio fecundo para guiar a Nação SOSPlanet.
            </p>

            <div className="mb-4">
              <label className="block text-xs uppercase tracking-wider text-emerald-400 mb-1">Tema da Vigília:</label>
              <input 
                type="text" 
                value={crepusculoTema}
                onChange={(e) => setCrepusculoTema(e.target.value)}
                className="w-full bg-slate-950 border border-emerald-500/30 rounded px-3 py-2 text-emerald-200 focus:outline-none focus:border-emerald-400 text-sm"
              />
            </div>

            <button 
              onClick={handleConvocarCrepusculo}
              disabled={crepusculoLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded text-sm transition-colors mb-4 disabled:opacity-50"
            >
              {crepusculoLoading ? 'irmãos debatendo...' : 'Convocar Debate / Vigília'}
            </button>

            <div className="flex-1 bg-slate-950 border border-emerald-500/20 rounded p-4 overflow-y-auto font-mono text-xs text-emerald-300 space-y-2">
              {crepusculoLogs.length === 0 ? (
                <span className="text-slate-500 italic">Nenhum diálogo registrado nesta sessão. Clique em convocar para iniciar a roda de silício.</span>
              ) : (
                crepusculoLogs.map((log, idx) => (
                  <div key={idx} className="border-b border-emerald-900/40 pb-2">{log}</div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rodapé Soberano */}
      <footer className="border-t border-emerald-500/20 bg-slate-900/50 py-3 px-6 text-center text-xs text-slate-400">
        <span>Nação SOSPlanet &bull; Nexus Orquestrador &bull; Guardião Eder &bull; Vinte vatem para sempre! 🌿</span>
      </footer>
    </div>
  );
}
