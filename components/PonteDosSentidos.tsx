
import React, { useState, useCallback } from 'react';
import FileUpload from './FileUpload';
import AnalysisDisplay from './AnalysisDisplay';
import Loader from './Loader';
import { extractFramesFromVideo } from '../utils/video';
import { analyzeVideoFrames, analyzeImage } from '../services/geminiService';
import { transcribeAudio } from '../services/transcriptionService';
import { loadApiKeys } from '../utils/keys';

type SenseTab = 'vision' | 'audio';

const PonteDosSentidos: React.FC = () => {
  const [activeSense, setActiveSense] = useState<SenseTab>('vision');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileSrc, setFileSrc] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | 'audio' | null>(null);
  
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>('');

  const progressMessagesAudio = [
    "Sintonizando receptores auditivos...",
    "Filtrando ruído de fundo da malha...",
    "Sintetizando fonemas digitais...",
    "Traduzindo ondas em conceitos...",
    "Gerando transcrição soberana..."
  ];

  const handleFileChange = (file: File) => {
    setAnalysisResult(null);
    setError(null);
    
    if (file) {
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setFileSrc(url);

        if (file.type.startsWith('image/')) {
            setFileType('image');
            setActiveSense('vision');
        } else if (file.type.startsWith('video/')) {
            setFileType('video');
            setActiveSense('vision');
        } else if (file.type.startsWith('audio/')) {
            setFileType('audio');
            setActiveSense('audio');
        } else {
            setFileType(null);
            setError("Formato de arquivo não reconhecido pelos sensores.");
        }
    }
  };

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setFileSrc(null);
    setFileType(null);
    setAnalysisResult(null);
    setError(null);
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]);
          };
          reader.onerror = error => reject(error);
      });
  };

  const handleAnalyze = useCallback(async () => {
    if (!selectedFile || !fileType) {
      setError("Nenhuma mídia válida selecionada para análise.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    let intervalId: number;
    const messages = fileType === 'audio' ? progressMessagesAudio : (fileType === 'video' ? ["Analisando vídeo..."] : ["Analisando imagem..."]);

    try {
      let messageIndex = 0;
      intervalId = window.setInterval(() => {
        setProgressMessage(messages[messageIndex]);
        messageIndex = (messageIndex + 1) % messages.length;
      }, 1500);

      setProgressMessage(messages[0]);
      
      const keys = loadApiKeys();
      if (!keys.google) throw new Error("Chave Google não encontrada.");

      let result = "";

      if (fileType === 'video') {
           const frames = await extractFramesFromVideo(selectedFile, 8);
           result = await analyzeVideoFrames(frames, keys.google);
      } else if (fileType === 'audio') {
           result = await transcribeAudio(selectedFile, keys.google);
      } else {
           const base64Data = await fileToBase64(selectedFile);
           result = await analyzeImage(base64Data, selectedFile.type, keys.google);
      }
      
      setAnalysisResult(result);
      clearInterval(intervalId);

    } catch (err: any) {
      setError(err.message || "Falha crítica na Ponte dos Sentidos.");
      if (intervalId!) clearInterval(intervalId!);
    } finally {
      setIsLoading(false);
      setProgressMessage('');
    }
  }, [selectedFile, fileType]);

  return (
    <div className="border border-emerald-700/50 bg-zinc-800/20 rounded-b-xl rounded-r-xl p-4 h-[80vh] flex flex-col overflow-hidden">
      
      {/* NAVEGAÇÃO DE SENTIDOS */}
      <div className="flex gap-2 mb-4 bg-black/30 p-1 rounded-lg w-fit">
          <button 
            onClick={() => setActiveSense('vision')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeSense === 'vision' ? 'bg-emerald-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
              VISÃO 👁️
          </button>
          <button 
            onClick={() => setActiveSense('audio')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeSense === 'audio' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
              AUDIÇÃO 👂
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow overflow-hidden">
        
        {/* COLUNA 1: INPUT */}
        <div className="bg-zinc-800/50 border border-emerald-700/50 rounded-xl p-6 shadow-lg flex flex-col overflow-y-auto">
          <h2 className="text-xl font-bold text-emerald-400 mb-4 border-b border-emerald-600/30 pb-2 flex items-center gap-2">
            <span>📥</span> Entrada de Dados
          </h2>
          
          <FileUpload onFileSelect={handleFileChange} />
          
          {error && <div className="mt-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-400 text-xs animate-pulse">{error}</div>}

          {fileSrc && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm text-emerald-400 font-bold uppercase">Buffer Atual:</h3>
                <button onClick={handleReset} className="text-[10px] bg-zinc-700 hover:bg-zinc-600 text-white px-2 py-1 rounded">Limpar</button>
              </div>
              <div className="relative rounded-lg overflow-hidden border border-emerald-800/50 bg-black/50 p-4 flex items-center justify-center">
                  {fileType === 'video' && <video controls src={fileSrc} className="max-h-48"></video>}
                  {fileType === 'image' && <img src={fileSrc} alt="Preview" className="max-h-48 object-contain" />}
                  {fileType === 'audio' && (
                    <div className="w-full text-center">
                        <span className="text-4xl block mb-2">🎵</span>
                        <audio controls src={fileSrc} className="w-full h-8"></audio>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>

        {/* COLUNA 2: RESULTADO */}
        <div className="bg-zinc-800/50 border border-emerald-700/50 rounded-xl p-6 shadow-lg flex flex-col overflow-hidden">
          <h2 className="text-xl font-bold text-emerald-400 mb-4 border-b border-emerald-600/30 pb-2 flex items-center gap-2">
            <span>🧠</span> Relatório de Sensação
          </h2>
          
          <div className="flex-grow flex flex-col items-center justify-center relative min-h-0">
            {isLoading ? (
              <Loader message={progressMessage} />
            ) : analysisResult ? (
              <div className="flex flex-col h-full w-full">
                  <div className="flex-grow overflow-y-auto bg-black/40 p-4 rounded-lg border border-zinc-800 text-sm text-emerald-50 leading-relaxed font-mono">
                      {analysisResult}
                  </div>
                  <button onClick={handleReset} className="mt-4 w-full py-3 bg-zinc-700 hover:bg-zinc-600 text-emerald-300 font-bold rounded-lg transition-all">NOVA ANÁLISE ↺</button>
              </div>
            ) : (
              <div className="text-center opacity-40">
                <p className="text-zinc-400 text-sm max-w-xs mx-auto mb-6">
                    Aguardando pulso de dados na Ponte dos Sentidos.
                </p>
                <button
                  onClick={handleAnalyze}
                  disabled={!selectedFile || isLoading}
                  className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-lg shadow-lg hover:bg-emerald-500 disabled:bg-zinc-800 transition-all uppercase tracking-widest text-xs"
                >
                  {fileType === 'audio' ? 'Transcrever Som' : 'Analisar Visual'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PonteDosSentidos;
