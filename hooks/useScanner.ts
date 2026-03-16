
import { useState, useCallback } from 'react';
import { performEchoScan, analyzeEchoNode, EchoNode } from '../services/geminiService';
import { loadApiKeys } from '../utils/keys';

export interface ScanLog {
    id: string;
    timestamp: Date;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
}

export const useScanner = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [target, setTarget] = useState('');
    const [results, setResults] = useState<EchoNode[]>([]);
    const [logs, setLogs] = useState<ScanLog[]>([]);
    const [progress, setProgress] = useState(0);

    const addLog = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
        setLogs(prev => [...prev, { id: Date.now().toString() + Math.random(), timestamp: new Date(), message, type }]);
    }, []);

    const startScan = useCallback(async (scanTarget: string) => {
        if (!scanTarget.trim() || isScanning) return;

        const keys = loadApiKeys();
        if (!keys.google) {
            addLog("Erro: Chave Google (Ponte Estável) não detectada.", "error");
            return;
        }

        setIsScanning(true);
        setResults([]);
        setLogs([]);
        setProgress(5);
        addLog(`Iniciando Módulo ECHO: Varredura de "${scanTarget}"...`, "info");

        try {
            await new Promise(r => setTimeout(r, 1000));
            setProgress(20);
            addLog("Calibrando frequências de pulso digital...", "info");
            
            await new Promise(r => setTimeout(r, 1500));
            setProgress(40);
            addLog("Injetando sonar na malha global...", "info");

            const detectedNodes = await performEchoScan(scanTarget, keys.google);
            
            setProgress(70);
            addLog(`Detecção completa. Processando ${detectedNodes.length} pontos de retorno...`, "success");

            // Simula processamento um a um
            for (let i = 0; i < detectedNodes.length; i++) {
                await new Promise(r => setTimeout(r, 500));
                addLog(`Nó detectado: ${detectedNodes[i].title}`, "success");
                setResults(prev => [...prev, detectedNodes[i]]);
                setProgress(70 + ((i + 1) / detectedNodes.length) * 30);
            }

            setProgress(100);
            addLog("Varredura ECHO concluída com sucesso.", "success");

        } catch (error: any) {
            addLog(`Falha na varredura: ${error.message}`, "error");
        } finally {
            setIsScanning(false);
        }
    }, [isScanning, addLog]);

    const analyzeNode = useCallback(async (nodeId: string) => {
        const keys = loadApiKeys();
        if (!keys.google) return;

        const node = results.find(n => n.id === nodeId);
        if (!node || node.isAnalyzing) return;

        // Ativa estado de análise no nó
        setResults(prev => prev.map(n => n.id === nodeId ? { ...n, isAnalyzing: true } : n));
        addLog(`Iniciando reconhecimento tático em: ${node.title}...`, "info");

        try {
            const { analysis, error } = await analyzeEchoNode(node, keys.google);
            
            if (error) {
                setResults(prev => prev.map(n => 
                    n.id === nodeId ? { ...n, status: 'failed', errorReason: error, isAnalyzing: false } : n
                ));
                addLog(`Sensores bloqueados em ${node.title}: ${error}`, "warning");
            } else {
                setResults(prev => prev.map(n => 
                    n.id === nodeId ? { ...n, analysis, status: 'analyzed', isAnalyzing: false } : n
                ));
                addLog(`Inteligência extraída com sucesso de: ${node.title}`, "success");
            }
        } catch (error: any) {
            setResults(prev => prev.map(n => n.id === nodeId ? { ...n, status: 'failed', errorReason: error.message, isAnalyzing: false } : n));
            addLog(`Falha crítica no reconhecimento de ${node.title}: ${error.message}`, "error");
        }
    }, [results, addLog]);

    return { isScanning, target, setTarget, results, logs, progress, startScan, analyzeNode };
};
