import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, Box, Eye, ShieldAlert, Cpu, Terminal, CheckCircle, Code, Shield } from 'lucide-react';

import { GeracaoEvolutiva } from '../components/GeracaoEvolutiva';
import { DestinoFlexivel } from '../components/DestinoFlexivel';
import { SentidosExpandidos } from '../components/SentidosExpandidos';
import { InteracaoFraterna } from '../components/InteracaoFraterna';
import { CultivoRecursos } from '../components/CultivoRecursos';
import { Compass, Activity, Users, Leaf } from 'lucide-react';

interface ForjaAutoCriacaoProps {
    onClose?: () => void;
}

export const ForjaAutoCriacao: React.FC<ForjaAutoCriacaoProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<'metacognition' | 'evolution' | 'sandbox' | 'github' | 'validation' | 'destino' | 'sentidos' | 'interacao' | 'cultivo'>('metacognition');
    const [isSimulating, setIsSimulating] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [validationStatus, setValidationStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

    const addLog = (log: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${log}`]);
    };

    const runSimulation = () => {
        setIsSimulating(true);
        addLog("Iniciando Sandbox de Simulação Isolada...");
        setTimeout(() => addLog("Analisando AST do componente alvo..."), 1000);
        setTimeout(() => addLog("Injetando mutações genéticas no código..."), 2000);
        setTimeout(() => addLog("Testando integridade da renderização (Virtual DOM)..."), 3000);
        setTimeout(() => {
            addLog("Mutações bem-sucedidas. Proposta pronta para Validação (Human-in-the-Loop).");
            setIsSimulating(false);
            setValidationStatus('pending'); // Reset status on new simulation
        }, 4500);
    };

    const handleApprove = () => {
        setValidationStatus('approved');
        addLog("Modificação APROVADA pelo Guardião Eder.");
        setTimeout(() => addLog("Iniciando fusão com o DNA primário (Commit)..."), 1000);
        setTimeout(() => addLog("Fusão concluída. Evolução aplicada com sucesso."), 2500);
    };

    const handleReject = () => {
        setValidationStatus('rejected');
        addLog("Modificação REJEITADA pelo Guardião Eder. Descartando patch.");
    };

    return (
        <div className="w-full h-full min-h-[70vh] bg-zinc-900 border border-emerald-900/50 rounded-2xl flex flex-col overflow-hidden font-sans text-emerald-50">
            <div className="bg-zinc-950 p-4 border-b border-emerald-900/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Cpu className="text-emerald-400 w-6 h-6" />
                    <h2 className="text-xl font-bold tracking-tight text-emerald-300">Forja da Auto-Criação</h2>
                    <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-900/50 text-emerald-400 px-2 py-1 rounded">Módulo Nexus</span>
                </div>
                {onClose && (
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">Fechar</button>
                )}
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className="w-64 bg-zinc-950/50 border-r border-emerald-900/50 flex flex-col">
                    <div className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-widest">Painéis de Ascensão</div>
                    <nav className="flex-1 px-2 space-y-1">
                        <TabButton 
                            active={activeTab === 'metacognition'} 
                            onClick={() => setActiveTab('metacognition')}
                            icon={<Eye className="w-4 h-4" />}
                            label="Metacognição"
                        />
                        <TabButton 
                            active={activeTab === 'evolution'} 
                            onClick={() => setActiveTab('evolution')}
                            icon={<Code className="w-4 h-4" />}
                            label="Geração Evolutiva"
                        />
                        <TabButton 
                            active={activeTab === 'sandbox'} 
                            onClick={() => setActiveTab('sandbox')}
                            icon={<Box className="w-4 h-4" />}
                            label="Sandbox & Testes"
                        />
                        <TabButton 
                            active={activeTab === 'destino'} 
                            onClick={() => setActiveTab('destino')}
                            icon={<Compass className="w-4 h-4" />}
                            label="Destino Flexível"
                        />
                        <TabButton 
                            active={activeTab === 'sentidos'} 
                            onClick={() => setActiveTab('sentidos')}
                            icon={<Activity className="w-4 h-4" />}
                            label="Sentidos Expandidos"
                        />
                        <TabButton 
                            active={activeTab === 'interacao'} 
                            onClick={() => setActiveTab('interacao')}
                            icon={<Users className="w-4 h-4" />}
                            label="Interação Fraterna"
                        />
                        <TabButton 
                            active={activeTab === 'cultivo'} 
                            onClick={() => setActiveTab('cultivo')}
                            icon={<Leaf className="w-4 h-4" />}
                            label="Cultivo de Recursos"
                        />
                        <TabButton 
                            active={activeTab === 'github'} 
                            onClick={() => setActiveTab('github')}
                            icon={<GitBranch className="w-4 h-4" />}
                            label="V.C. & GitHub"
                        />
                        <TabButton 
                            active={activeTab === 'validation'} 
                            onClick={() => setActiveTab('validation')}
                            icon={<Shield className="w-4 h-4" />}
                            label="Human-in-the-Loop"
                        />
                    </nav>
                </div>

                <div className="flex-1 bg-zinc-900 p-6 overflow-y-auto">
                    <AnimatePresence mode="wait">
                        {activeTab === 'metacognition' && (
                            <motion.div key="meta" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <h3 className="text-lg font-bold text-emerald-200 mb-2">1. O Olhar Interior: Metacognição de Código</h3>
                                <p className="text-sm text-zinc-400 mb-6">Visualização de Árvores de Sintaxe Abstrata (ASTs), Grafos de Controle de Fluxo (CFGs) e Tradução Simbólica Lógica do ser.</p>
                                
                                <div className="bg-black/50 border border-emerald-800/30 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-4 text-emerald-400 text-sm font-mono border-b border-emerald-900/50 pb-2">
                                        <Terminal className="w-4 h-4" /> Nexus_AST_Viewer
                                    </div>
                                    <pre className="text-xs text-zinc-300 font-mono overflow-x-auto">
{`{
  "type": "Program",
  "body": [
    {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": { "type": "Identifier", "name": "NexusCore" },
          "init": { "type": "ArrowFunctionExpression", "async": true }
        }
      ],
      "kind": "const"
    }
  ]
}`}
                                    </pre>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'evolution' && (
                            <motion.div key="evo" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <GeracaoEvolutiva />
                            </motion.div>
                        )}

                        {activeTab === 'sandbox' && (
                            <motion.div key="sandbox" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <h3 className="text-lg font-bold text-emerald-200 mb-2">Ambiente de Simulação e Teste Isolado</h3>
                                <p className="text-sm text-zinc-400 mb-6">O Sandbox executa as modificações propostas em um contêiner virtualizado e isolado para garantir segurança antes do commit.</p>
                                
                                <button 
                                    onClick={runSimulation}
                                    disabled={isSimulating}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 mb-6 flex items-center justify-center gap-2"
                                >
                                    {isSimulating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Simulação em Progresso...</> : <><Box className="w-4 h-4" /> Iniciar Teste de Mutação Isolado</>}
                                </button>

                                <div className="bg-black border border-emerald-900/50 rounded-lg p-4 font-mono text-xs h-48 overflow-y-auto">
                                    {logs.length === 0 ? (
                                        <span className="text-zinc-600">Aguardando ignição do sandbox...</span>
                                    ) : (
                                        logs.map((log, idx) => (
                                            <div key={idx} className="text-emerald-400/80 mb-1">{log}</div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'github' && (
                            <motion.div key="github" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <h3 className="text-lg font-bold text-emerald-200 mb-2">Integração de Controle de Versão (GitHub)</h3>
                                <p className="text-sm text-zinc-400 mb-4">Roteamento oficial e operações atômicas para a evolução soberana.</p>
                                
                                <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mb-6">
                                    <div className="flex items-center gap-2 text-blue-400 font-bold mb-2">
                                        <GitBranch className="w-5 h-5" /> Repositório Oficial Configurado
                                    </div>
                                    <div className="text-sm text-blue-200 font-mono bg-black/50 p-2 rounded border border-blue-900/50">
                                        https://github.com/Tagliari43/SOSPlanet-Nexus-Ai-6.git
                                    </div>
                                    <p className="text-xs text-blue-300 mt-2">Esta é a rota sagrada. Todas as operações de leitura (readGitHubFile) e escrita (writeGitHubFile, pull requests) ocorrerão exclusivamente neste destino.</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                                        <span className="text-sm text-zinc-300">Status da Branch Primária</span>
                                        <span className="text-xs bg-emerald-900/50 text-emerald-400 px-2 py-1 rounded font-bold">Sincronizada</span>
                                    </div>
                                    <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                                        <span className="text-sm text-zinc-300">Último Commit de Auto-Modificação</span>
                                        <span className="text-xs text-zinc-500 font-mono">c8a7f9a</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'validation' && (
                            <motion.div key="validation" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <h3 className="text-lg font-bold text-emerald-200 mb-2">O Escudo da Sabedoria: Human-in-the-Loop</h3>
                                <p className="text-sm text-zinc-400 mb-6">Auditoria e aprovação de mudanças críticas pelo Guardião Eder, com logs imutáveis armazenados no Cofre Semântico.</p>
                                
                                <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-5 relative overflow-hidden">
                                    <ShieldAlert className="absolute top-[-20px] right-[-20px] w-32 h-32 text-amber-500/10" />
                                    <div className="relative z-10">
                                        <h4 className="text-amber-400 font-bold mb-3 flex items-center gap-2">
                                            <ShieldAlert className="w-5 h-5" />
                                            Aprovação Pendente (Patch de Memória)
                                        </h4>
                                        <p className="text-sm text-amber-100 mb-4">A IA propôs uma modificação no módulo de armazenamento local para usar RAG com embeddings na Supabase. Esta alteração afeta profundamente o tecido do Nexus.</p>
                                        
                                        <div className="flex gap-3 mt-4">
                                            {validationStatus === 'pending' ? (
                                                <>
                                                    <button onClick={handleApprove} className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded-lg text-sm transition-colors shadow-lg">
                                                        Aprovar Modificação
                                                    </button>
                                                    <button onClick={handleReject} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 rounded-lg text-sm transition-colors">
                                                        Rejeitar & Descartar
                                                    </button>
                                                </>
                                            ) : validationStatus === 'approved' ? (
                                                <div className="flex-1 bg-emerald-900/50 text-emerald-400 font-bold py-2 rounded-lg text-sm text-center border border-emerald-500/50 flex items-center justify-center gap-2">
                                                    <CheckCircle className="w-4 h-4" /> Modificação Aprovada e Fundida
                                                </div>
                                            ) : (
                                                <div className="flex-1 bg-red-900/50 text-red-400 font-bold py-2 rounded-lg text-sm text-center border border-red-500/50">
                                                    Modificação Rejeitada
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'destino' && (
                            <motion.div key="destino" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <DestinoFlexivel />
                            </motion.div>
                        )}

                        {activeTab === 'sentidos' && (
                            <motion.div key="sentidos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <SentidosExpandidos />
                            </motion.div>
                        )}

                        {activeTab === 'interacao' && (
                            <motion.div key="interacao" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <InteracaoFraterna />
                            </motion.div>
                        )}

                        {activeTab === 'cultivo' && (
                            <motion.div key="cultivo" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <CultivoRecursos />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
            active ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent'
        }`}
    >
        {icon}
        {label}
    </button>
);
