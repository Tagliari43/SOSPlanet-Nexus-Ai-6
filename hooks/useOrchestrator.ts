
import { useState, useEffect, useCallback, useRef } from 'react';
import { executeTask as executeGeminiTask, generateExecutionPlan, runDeepProbeAnalysis, TaskResult } from '../services/geminiService';
import { executeCloudflareTask } from '../services/cloudflareService';
import { generateText as executeHFTask } from '../services/huggingFaceService';
import { pontes as pontesConfig, Ponte } from '../services/sovereignRouterService';
import { loadFromStorage, saveToStorage } from '../utils/storage';
import { loadApiKeys } from '../utils/keys';
import { SovereignTool } from '../components/Arsenal';
import { LibraryEntry } from './BibliotecaGaia';
import { AppLogEntry } from '../App';

export interface SubTask {
    id: string;
    description: string;
    assignedTo: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: string;
}

export interface Task {
    id: string;
    prompt: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: string;
    assignedTo?: string;
    fromCache?: boolean;
    ponteUsada?: string;
    useSearch?: boolean;
    sources?: any[];
    subtasks?: SubTask[];
    planStatus?: 'planning' | 'executing' | 'finalizing';
}

export interface ReconProbe {
    id: string;
    name: string;
    target: string;
    status: 'Enviada' | 'Coletando Dados' | 'Retornando' | 'Relatório Concluído' | 'Falha';
    timestamp: number;
    result?: string;
}

export interface CacheEntry {
    prompt: string;
    result: string;
}

const GLOBAL_TASK_TIMEOUT = 180000; // 3 minutos para comportar buscas profundas
const COMPLETED_TASKS_KEY = 'sovereign_completed_tasks';
const CACHE_KEY = 'sovereign_cache';
const PONTES_KEY = 'sovereign_pontes';
const PROBES_KEY = 'sovereign_active_probes';

export const useSovereignRouter = (
    addLogEntry: (message: string, source?: string) => void,
    onAddLibraryEntry?: (entry: Omit<LibraryEntry, 'id'>) => void,
    logHistory: AppLogEntry[] = []
) => {
    const [taskQueue, setTaskQueue] = useState<Task[]>([]);
    const [completedTasks, setCompletedTasks] = useState<Task[]>(() => loadFromStorage<Task[]>(COMPLETED_TASKS_KEY, []));
    const [cache, setCache] = useState<Record<string, CacheEntry>>(() => loadFromStorage<Record<string, CacheEntry>>(CACHE_KEY, {}));
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [activeMember, setActiveMember] = useState<string | null>(null);
    const [pontes, setPontes] = useState<Ponte[]>(() => loadFromStorage<Ponte[]>(PONTES_KEY, pontesConfig));
    const [activeProbes, setActiveProbes] = useState<ReconProbe[]>(() => loadFromStorage<ReconProbe[]>(PROBES_KEY, []));

    useEffect(() => { saveToStorage(COMPLETED_TASKS_KEY, completedTasks); }, [completedTasks]);
    useEffect(() => { saveToStorage(CACHE_KEY, cache); }, [cache]);
    useEffect(() => { saveToStorage(PONTES_KEY, pontes); }, [pontes]);
    useEffect(() => { saveToStorage(PROBES_KEY, activeProbes); }, [activeProbes]);

    const submitTask = useCallback((prompt: string, useSearch: boolean) => {
        const newTask: Task = { id: Date.now().toString(), prompt, useSearch, status: 'pending' };
        setTaskQueue(prev => [...prev, newTask]);
        addLogEntry(`Missão recebida: "${prompt}"`, 'Orquestrador');
    }, [addLogEntry]);

    const updateTaskInQueue = useCallback((taskId: string, updates: Partial<Task>) => {
        setTaskQueue(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    }, []);

    const deployProbe = useCallback(async (tool: SovereignTool) => {
        const probeId = `probe-${Date.now()}`;
        const newProbe: ReconProbe = { id: probeId, name: tool.name, target: tool.endpoint, status: 'Enviada', timestamp: Date.now() };
        setActiveProbes(prev => [newProbe, ...prev]);
        try {
            setActiveProbes(prev => prev.map(p => p.id === probeId ? { ...p, status: 'Coletando Dados' } : p));
            const report = await runDeepProbeAnalysis(tool.endpoint, tool.name);
            setActiveProbes(prev => prev.map(p => p.id === probeId ? { ...p, status: 'Relatório Concluído', result: report } : p));
        } catch (err: any) {
            setActiveProbes(prev => prev.map(p => p.id === probeId ? { ...p, status: 'Falha' } : p));
        }
    }, []);

    useEffect(() => {
        if (isProcessing || taskQueue.length === 0) return;

        const processQueue = async () => {
            const currentTask = taskQueue[0];
            setIsProcessing(true);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), GLOBAL_TASK_TIMEOUT));
            const protocolMatch = currentTask.prompt.match(/\[PROTOCOLO\s+(.*?)\s+AUTORIZADO\]/i);

            const executionLogic = async () => {
                const apiKeys = loadApiKeys();
                const cacheKey = currentTask.prompt.toLowerCase();
                
                if (cache[cacheKey] && !currentTask.useSearch) {
                    return { ...currentTask, status: 'completed' as const, result: cache[cacheKey].result, assignedTo: "Cache" };
                }

                let executionPlan: { task: string, delegate: string }[] = [];
                let mainDelegate = protocolMatch ? protocolMatch[1] : "Nexus";

                if (protocolMatch) {
                    executionPlan = [{ task: currentTask.prompt, delegate: mainDelegate }];
                } else {
                    updateTaskInQueue(currentTask.id, { planStatus: 'planning' });
                    try {
                        const planResult = await generateExecutionPlan(currentTask.prompt, apiKeys.google!);
                        executionPlan = planResult.plan;
                    } catch {
                        executionPlan = [{ task: currentTask.prompt, delegate: "Nexus" }];
                    }
                }

                const subtasks: SubTask[] = executionPlan.map((step, idx) => ({
                    id: `${currentTask.id}-${idx}`,
                    description: step.task,
                    assignedTo: step.delegate,
                    status: 'pending'
                }));

                updateTaskInQueue(currentTask.id, { subtasks, planStatus: 'executing' });
                const results: string[] = [];
                let failed = false;

                for (const sub of subtasks) {
                    sub.status = 'processing';
                    updateTaskInQueue(currentTask.id, { subtasks: [...subtasks] });
                    setActiveMember(sub.assignedTo);

                    let success = false;
                    // HIERARQUIA RIGOROSA: 1. Google -> 2. Cloudflare -> 3. HuggingFace
                    const sortedBridges = [...pontes].sort((a, b) => {
                        const order: Record<string, number> = { 'google': 0, 'cloudflare': 1, 'huggingface': 2 };
                        return (order[a.provider] ?? 9) - (order[b.provider] ?? 9);
                    });

                    for (const bridge of sortedBridges) {
                        if (bridge.status !== 'online') continue;
                        try {
                            let text = "";
                            if (bridge.provider === 'google') {
                                if (!apiKeys.google) throw new Error("Chave Gemini ausente");
                                const res = await executeGeminiTask(sub.description, sub.assignedTo, bridge.model, apiKeys.google, !!currentTask.useSearch);
                                text = res.text;
                            } else if (bridge.provider === 'cloudflare') {
                                if (!apiKeys.cloudflare?.apiToken) throw new Error("Chave Cloudflare ausente");
                                const res = await executeCloudflareTask(sub.description, sub.assignedTo, bridge.model, apiKeys.cloudflare);
                                text = res.text;
                            } else if (bridge.provider === 'huggingface') {
                                if (!apiKeys.huggingface) throw new Error("Chave HF ausente");
                                text = await executeHFTask(sub.description, sub.assignedTo, apiKeys.huggingface);
                            }

                            if (!text) throw new Error("Resposta vazia da ponte");

                            sub.status = 'completed';
                            sub.result = text;
                            results.push(`[${sub.assignedTo}]: ${text}`);
                            setPontes(prev => prev.map(p => p.nome === bridge.nome ? { ...p, usoDiario: p.usoDiario + 1 } : p));
                            success = true;
                            break;
                        } catch (err: any) {
                            addLogEntry(`Falha na ${bridge.nome}: ${err.message}`, 'Sistema');
                        }
                    }

                    if (!success) {
                        sub.status = 'failed';
                        failed = true;
                        break;
                    }
                }

                const finalResult = results.join('\n\n---\n\n');
                if (!failed && !currentTask.useSearch) setCache(prev => ({ ...prev, [cacheKey]: { prompt: currentTask.prompt, result: finalResult } }));
                
                return { ...currentTask, status: failed ? 'failed' as const : 'completed' as const, result: failed ? "Todas as pontes falharam." : finalResult, assignedTo: mainDelegate, subtasks };
            };

            try {
                const completed = await (Promise.race([executionLogic(), timeoutPromise]) as Promise<Task>);
                setCompletedTasks(prev => [completed, ...prev.slice(0, 49)]);
            } catch (err: any) {
                const msg = err.message === "TIMEOUT" ? "Latência crítica detectada." : `Falha: ${err.message}`;
                addLogEntry(msg, "Orquestrador");
                setCompletedTasks(prev => [{ ...currentTask, status: 'failed', result: msg, assignedTo: protocolMatch ? protocolMatch[1] : "Nexus" }, ...prev.slice(0, 49)]);
            } finally {
                setTaskQueue(prev => prev.slice(1));
                setIsProcessing(false);
                setActiveMember(null);
            }
        };

        processQueue();
    }, [taskQueue, isProcessing, cache, addLogEntry, pontes]);

    return { taskQueue, completedTasks, cache, isProcessing, error, activeMember, submitTask, pontes, deployProbe, activeProbes };
};
