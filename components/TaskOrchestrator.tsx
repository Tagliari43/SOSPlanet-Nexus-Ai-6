
import React, { useState } from 'react';
import { Task, SubTask } from '../hooks/useOrchestrator';

interface TaskOrchestratorProps {
    onSubmit: (task: string, useSearch: boolean) => void;
    queue: Task[];
    completed: Task[];
    isProcessing: boolean;
    activeMember: string | null;
    error: string | null;
}

const TaskOrchestrator: React.FC<TaskOrchestratorProps> = ({ onSubmit, queue = [], completed = [], isProcessing, activeMember, error }) => {
    const [newTask, setNewTask] = useState('');
    const [useSearch, setUseSearch] = useState(false);
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTask.trim()) {
            onSubmit(newTask.trim(), useSearch);
            setNewTask('');
            setUseSearch(false);
        }
    };
    
    const toggleExpand = (taskId: string) => {
        setExpandedTaskId(prevId => (prevId === taskId ? null : taskId));
    };

    const displayedCompleted = [...(completed || [])].reverse().slice(0, 10);

    const renderSubtasks = (subtasks: SubTask[]) => {
        if (!subtasks) return null;
        return (
            <div className="mt-3 bg-black/20 rounded p-2 border border-zinc-700/50">
                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-2">Plano de Execução Tático</p>
                <div className="space-y-2">
                    {subtasks.map((step) => {
                        let statusColor = 'bg-zinc-600';
                        let icon = '⏳';
                        if (step.status === 'processing') { statusColor = 'bg-yellow-500 animate-pulse'; icon = '⚙️'; }
                        else if (step.status === 'completed') { statusColor = 'bg-green-500'; icon = '✅'; }
                        else if (step.status === 'failed') { statusColor = 'bg-red-500'; icon = '❌'; }

                        return (
                            <div key={step.id} className="flex items-center gap-2 text-xs">
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white flex-shrink-0 ${statusColor}`}>
                                    {icon}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-300 font-medium truncate">{step.description}</span>
                                        <span className="text-emerald-500 text-[10px] ml-2">{step.assignedTo}</span>
                                    </div>
                                    {step.status === 'processing' && <div className="h-0.5 bg-yellow-500/30 w-full mt-1 rounded overflow-hidden"><div className="h-full bg-yellow-500 animate-progress"></div></div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-zinc-800/50 border border-emerald-700/50 rounded-xl p-6 shadow-lg shadow-emerald-900/20 backdrop-blur-sm h-full flex flex-col">
            <h2 className="text-2xl font-bold text-emerald-400 mb-4 border-b-2 border-emerald-600/30 pb-2">Orquestrador de Tarefas Soberano</h2>
            <form onSubmit={handleSubmit}>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        placeholder="Digite a diretriz para a família (Ex: Analise X, Pesquise Y e Crie Z)..."
                        className="flex-grow bg-zinc-900/70 border border-emerald-800 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-sm"
                    />
                    <button
                        type="submit"
                        disabled={isProcessing && queue.length > 0}
                        className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg shadow-md shadow-emerald-500/20 hover:bg-emerald-500 transition-all duration-300 disabled:bg-zinc-600 disabled:text-zinc-400 disabled:cursor-not-allowed disabled:shadow-none text-sm"
                    >
                        Executar
                    </button>
                </div>
                <div className="mt-3 flex items-center">
                    <input
                        id="useSearch"
                        type="checkbox"
                        checked={useSearch}
                        onChange={(e) => setUseSearch(e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="useSearch" className="ml-2 text-xs text-emerald-300">
                        Ativar Navegador Soberano 🌐 (para informações em tempo real)
                    </label>
                </div>
            </form>

            {error && <p className="text-red-400 mt-4 animate-pulse text-sm">{error}</p>}
            
            <div className='mt-6 flex-grow overflow-hidden flex flex-col'>
                <h3 className="text-sm font-bold text-emerald-400 mb-2 uppercase tracking-wide">Fila de Execução</h3>
                <div className="bg-black/30 rounded-lg p-2 mb-4 overflow-y-auto h-48 space-y-2 border border-zinc-800">
                    {(!queue || queue.length === 0) && !isProcessing && <p className="text-zinc-500 text-xs italic p-2">Fila de tarefas vazia.</p>}
                    
                    {/* Active Task with Live Plan */}
                    {isProcessing && queue && queue[0] && (
                        <div className="p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-md text-sm">
                            <div className="flex justify-between items-center mb-1">
                                <p className="font-bold text-emerald-200 truncate">{queue[0].prompt}</p>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 flex-shrink-0 ml-2 animate-pulse">
                                    {queue[0].planStatus === 'planning' ? 'PLANEJANDO...' : 'EXECUTANDO'}
                                </span>
                            </div>
                            {queue[0].subtasks && renderSubtasks(queue[0].subtasks)}
                        </div>
                    )}

                    {/* Pending Tasks */}
                    {queue && queue.length > 0 && queue.slice(isProcessing ? 1 : 0).map((task) => (
                        <div key={task.id} className="p-2 text-sm bg-zinc-900/40 rounded-md opacity-70">
                            <div className="flex justify-between items-center">
                                <p className="text-zinc-300 truncate">{task.prompt}</p>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-600 text-zinc-300 flex-shrink-0 ml-2">Em Espera</span>
                            </div>
                        </div>
                    ))}
                </div>

                <h3 className="text-sm font-bold text-emerald-400 mb-2 uppercase tracking-wide">Histórico de Missões</h3>
                <div className="bg-black/30 rounded-lg p-2 flex-grow overflow-y-auto border border-zinc-800">
                    {displayedCompleted.length === 0 && <p className="text-zinc-500 text-xs italic p-2">Nenhuma tarefa concluída ainda.</p>}
                    {displayedCompleted.map(task => {
                        const isExpanded = task.id === expandedTaskId;
                        const isSuccess = task.status === 'completed';
                        return (
                            <div key={task.id} className="p-3 mb-2 bg-zinc-900/50 rounded-lg border-l-4 cursor-pointer transition-colors hover:bg-zinc-800/50" 
                                 style={{ borderColor: isSuccess ? 'var(--tw-color-emerald-600)' : 'var(--tw-color-red-600)' }} 
                                 onClick={() => toggleExpand(task.id)}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-emerald-500">
                                            {task.subtasks ? `Plano Tático (${task.subtasks.length} etapas)` : `Execução Direta: ${task.assignedTo}`}
                                        </p>
                                        <p className="font-bold text-emerald-200 text-xs truncate" title={task.prompt}>{task.prompt}</p>
                                    </div>
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${isSuccess ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                        {task.status === 'completed' ? 'Concluído' : 'Falhou'}
                                    </span>
                                </div>
                                {isExpanded && (
                                    <div className="mt-2 pt-2 border-t border-zinc-700/50">
                                        {task.subtasks ? (
                                            <div className="space-y-3">
                                                {task.subtasks.map((step, idx) => (
                                                    <div key={idx} className="text-xs">
                                                        <p className="text-emerald-400 font-bold mb-1">Passo {idx+1}: {step.description} <span className="text-zinc-500 font-normal">({step.assignedTo})</span></p>
                                                        <p className="text-zinc-300 pl-2 border-l border-zinc-700">{step.result}</p>
                                                    </div>
                                                ))}
                                                <div className="mt-2 pt-2 border-t border-emerald-800/30">
                                                    <p className="text-xs text-yellow-400 font-bold">Relatório Consolidado:</p>
                                                    <p className="text-xs text-zinc-400 mt-1 whitespace-pre-wrap">{task.result}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className={`whitespace-pre-wrap text-xs mt-1 leading-relaxed ${isSuccess ? 'text-slate-300' : 'text-red-300'}`}>{task.result}</p>
                                        )}
                                        
                                        {task.fromCache && <p className="text-[10px] text-yellow-400 italic mt-2">(Retornado do Núcleo de Cache Soberano)</p>}
                                        {task.sources && task.sources.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-emerald-800/50">
                                                <p className="text-[10px] text-emerald-400 font-bold mb-1">Fontes do Navegador Soberano:</p>
                                                <ul className="list-disc list-inside text-[10px] space-y-1">
                                                    {task.sources.map((source, index) => (
                                                        <li key={index}>
                                                            <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-300 hover:underline truncate">
                                                                {source.web.title || source.web.uri}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            <style>{`
                @keyframes progress {
                    0% { width: 0%; }
                    50% { width: 70%; }
                    100% { width: 90%; }
                }
                .animate-progress {
                    animation: progress 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default TaskOrchestrator;
