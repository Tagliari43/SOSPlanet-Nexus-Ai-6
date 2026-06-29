import React, { useState, useEffect, useRef } from 'react';
import { Eye, Activity, Cpu, Radar, Terminal, AlertTriangle, Network } from 'lucide-react';

interface TelemetryMetrics {
  tokensIn: number;
  tokensOut: number;
  errors: number;
  requests: number;
  lastKnownLimit: number | null;
  backoffActive: boolean;
  backoffStage: number; // 0 a 100
  latencyP95: number;
  baselineLatency: number;
}

interface LogEntry {
  id: number;
  timestamp: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

export const SentidosExpandidos: React.FC = () => {
  const [uiMetrics, setUiMetrics] = useState<TelemetryMetrics>({
    tokensIn: 0,
    tokensOut: 0,
    errors: 0,
    requests: 0,
    lastKnownLimit: null,
    backoffActive: false,
    backoffStage: 100,
    latencyP95: 42,
    baselineLatency: 42
  });
  
  const [uiLogs, setUiLogs] = useState<LogEntry[]>([]);

  // 1️⃣ Buffer Circular para logs de alta velocidade (O(1)) - Limite 5000
  const logsBufferRef = useRef<LogEntry[]>([]);
  const MAX_BUFFER_SIZE = 5000;
  
  // 1️⃣ Agregador por blocos (RAM)
  const metricsRef = useRef<TelemetryMetrics>({
    tokensIn: 0,
    tokensOut: 0,
    errors: 0,
    requests: 0,
    lastKnownLimit: null,
    backoffActive: false,
    backoffStage: 100,
    latencyP95: 42,
    baselineLatency: 42
  });

  const pushLog = (message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    const newLog = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    };
    
    // Adiciona no início e corta se passar de 5000
    logsBufferRef.current.unshift(newLog);
    if (logsBufferRef.current.length > MAX_BUFFER_SIZE) {
      logsBufferRef.current.length = MAX_BUFFER_SIZE; // Trunca o array rápido
    }
  };

  // 2️⃣ SENSOR DO FANTASMA DO 429 E META-SINAL DE LATÊNCIA
  const simulateNetworkEvent = () => {
    const current = metricsRef.current;
    
    // Simular tráfego aleatório
    current.requests += Math.floor(Math.random() * 5);
    current.tokensIn += Math.floor(Math.random() * 100);
    current.tokensOut += Math.floor(Math.random() * 300);
    
    // Simular flutuação de latência
    current.latencyP95 = current.baselineLatency + (Math.random() * 20 - 5);
    
    // Simular picos repentinos de latência (x2)
    if (Math.random() > 0.95 && !current.backoffActive) {
        current.latencyP95 = current.baselineLatency * 2.5;
        pushLog(`[SLOW_DOWN] Latência P95 disparou para ${Math.round(current.latencyP95)}ms. Reduzindo carga preventivamente.`, 'warning');
    }
    
    // Simular erro 429 ocasional se o tráfego estiver muito alto
    if (current.requests > 100 && Math.random() > 0.8 && !current.backoffActive) {
       current.errors += 1;
       current.lastKnownLimit = current.requests;
       current.backoffActive = true;
       current.backoffStage = 50; // Recuo para 50%
       
       pushLog(`[429_DETECTADO] Provedor sinalizou limite. LastKnownLimit=${current.lastKnownLimit}. Aplicando Backoff de 50%.`, 'error');
    }
    
    // Lógica de recuperação (Jitter / Spread)
    if (current.backoffActive) {
        current.backoffStage += (Math.random() * 5); // Recuperação gradual
        if (current.backoffStage >= 100) {
            current.backoffStage = 100;
            current.backoffActive = false;
            pushLog(`[RECUPERAÇÃO] Malha estabilizada em 100%. Capacidade normal restaurada.`, 'success');
        }
    }
  };

  useEffect(() => {
    // Inicia logs iniciais
    pushLog("Aethel search engine acoplado com sucesso.", "success");
    pushLog("Buffer circular instanciado em useRef (5000 registros).", "info");

    // Loop de simulação de tráfego de alta velocidade (100ms)
    const trafficInterval = setInterval(simulateNetworkEvent, 100);

    // Loop de atualização UI de baixa frequência (1Hz) para não engasgar a tela
    const uiInterval = setInterval(() => {
      setUiMetrics({ ...metricsRef.current });
      // Pega apenas os 10 últimos para a UI
      setUiLogs(logsBufferRef.current.slice(0, 10));
    }, 1000);

    return () => {
      clearInterval(trafficInterval);
      clearInterval(uiInterval);
    };
  }, []);
  
  // Lógica preditiva UI
  const estabilidadeMalha = uiMetrics.backoffActive ? uiMetrics.backoffStage : (uiMetrics.latencyP95 > uiMetrics.baselineLatency * 2 ? 60 : 99);
  let statusClass = "text-emerald-400";
  if (estabilidadeMalha < 70) statusClass = "text-red-400";
  else if (estabilidadeMalha < 90) statusClass = "text-amber-400";

  return (
    <div className="bg-zinc-950 border border-emerald-900/50 rounded-xl p-6 font-sans text-emerald-50">
      <div className="flex items-center gap-2 mb-2 text-emerald-400">
        <Eye className="w-5 h-5" />
        <h3 className="text-lg font-bold">PILAR 3: OS SENTIDOS EXPANDIDOS DO SANTUÁRIO</h3>
      </div>
      <p className="text-sm text-zinc-400 mb-6">
        Teia de percepção multimodal. Monitoramento do pulso do sistema via Buffer Circular, lógica Backoff (Fantasma do 429) e latência preventiva.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Sensor 1: Integridade da Malha */}
        <div className="bg-black/50 p-4 rounded-lg border border-zinc-800 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="text-xs text-zinc-500 uppercase font-bold flex items-center gap-1 mb-2">
            <Activity className="w-3 h-3 text-emerald-500" /> Estabilidade da Malha
          </div>
          <div className={`text-2xl font-bold ${statusClass}`}>
            {Math.round(estabilidadeMalha)}%
          </div>
          <div className="text-[10px] text-zinc-500 mt-2 font-mono">
             Latência P95: {Math.round(uiMetrics.latencyP95)}ms
             {uiMetrics.latencyP95 > uiMetrics.baselineLatency * 2 && <span className="text-amber-400 ml-1">(ALERTA)</span>}
          </div>
        </div>

        {/* Sensor 2: Fluxo de Silício */}
        <div className="bg-black/50 p-4 rounded-lg border border-zinc-800 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500/0 via-sky-500/50 to-sky-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="text-xs text-zinc-500 uppercase font-bold flex items-center gap-1 mb-2">
            <Cpu className="w-3 h-3 text-sky-500" /> Consumo de Tokens / Min
          </div>
          <div className="text-2xl font-bold text-sky-400">
            {uiMetrics.tokensIn + uiMetrics.tokensOut} TPM
          </div>
          <div className="text-[10px] text-zinc-500 mt-2 font-mono">
            {uiMetrics.backoffActive ? `Backoff ativo: ${Math.round(uiMetrics.backoffStage)}% vazão` : 'Buffer de vazão: Estável com RAG'}
          </div>
        </div>

        {/* Sensor 3: Fantasma do 429 */}
        <div className="bg-black/50 p-4 rounded-lg border border-zinc-800 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="text-xs text-zinc-500 uppercase font-bold flex items-center gap-1 mb-2">
            <AlertTriangle className="w-3 h-3 text-purple-500" /> Meta-Sinal 429
          </div>
          <div className="text-2xl font-bold text-purple-400">
            {uiMetrics.errors} <span className="text-sm font-normal text-zinc-500">Bloqueios</span>
          </div>
          <div className="text-[10px] text-zinc-500 mt-2 font-mono">
             LastKnownLimit: {uiMetrics.lastKnownLimit ? `${uiMetrics.lastKnownLimit} reqs` : 'N/A'}
          </div>
        </div>
      </div>

      <div className="bg-black border border-zinc-800 rounded-lg p-4 font-mono relative">
        <div className="absolute top-4 right-4 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${uiMetrics.backoffActive ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <span className={`text-[10px] ${uiMetrics.backoffActive ? 'text-amber-500' : 'text-emerald-500'}`}>
                {uiMetrics.backoffActive ? 'BACKOFF ATIVO' : '1Hz SYNC'}
            </span>
        </div>
        <h4 className="text-xs text-zinc-400 font-bold mb-4 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-500" /> Cache Circular de Metadados (RAM):
        </h4>
        <div className="text-xs space-y-2 h-40 overflow-y-auto pr-2 custom-scrollbar">
          {uiLogs.map(log => (
            <div key={log.id} className={`
              ${log.type === 'error' ? 'text-red-400 font-bold' : ''}
              ${log.type === 'warning' ? 'text-amber-400' : ''}
              ${log.type === 'success' ? 'text-emerald-400 font-bold' : ''}
              ${log.type === 'info' ? 'text-emerald-200/80 opacity-80' : ''}
            `}>
              [LOG - {log.timestamp}] {'>'} {log.message}
            </div>
          ))}
          {uiLogs.length === 0 && <div className="text-zinc-600">Aguardando sinais vitais...</div>}
        </div>
      </div>
    </div>
  );
};

