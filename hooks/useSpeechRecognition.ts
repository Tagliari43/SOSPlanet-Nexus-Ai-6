import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseSpeechRecognitionOptions {
    onFinalResult?: (newFinalText: string) => void;
}

export const useSpeechRecognition = (options?: UseSpeechRecognitionOptions) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [speechError, setSpeechError] = useState<string | null>(null);
    const [hasSupport, setHasSupport] = useState(true);

    const recognitionRef = useRef<any>(null);
    const isActuallyRunningRef = useRef(false);
    const shouldBeListeningRef = useRef(false);
    const lastProcessedIndexRef = useRef(-1);
    const optionsRef = useRef(options);
    optionsRef.current = options;

    useEffect(() => {
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRec) {
            setHasSupport(false);
            console.warn("Navegador não possui suporte nativo à Web Speech API.");
        } else {
            setHasSupport(true);
        }

        return () => {
            shouldBeListeningRef.current = false;
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch (_) {}
            }
        };
    }, []);

    const stopListening = useCallback(() => {
        shouldBeListeningRef.current = false;
        setIsListening(false);
        isActuallyRunningRef.current = false;
        setInterimTranscript('');

        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (_) {
                try {
                    recognitionRef.current.abort();
                } catch (__) {}
            }
        }
    }, []);

    const startListening = useCallback(async () => {
        setSpeechError(null);
        setInterimTranscript('');
        lastProcessedIndexRef.current = -1;

        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRec) {
            setSpeechError("Navegador não suporta transcrição nativa. Recomendamos Chrome, Edge ou Brave.");
            return;
        }

        // 1. Solicita e valida a permissão do microfone via getUserMedia para destravar iFrames
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                // Encerra a stream temporária para liberar o dispositivo para o SpeechRecognition
                stream.getTracks().forEach(t => t.stop());
            }
        } catch (permErr: any) {
            console.warn("[SpeechRecognition] Falha de permissão no getUserMedia:", permErr);
            setSpeechError("Permissão do microfone negada. Clique no ícone de cadeado/configurações do navegador e permita o microfone.");
            setIsListening(false);
            shouldBeListeningRef.current = false;
            return;
        }

        // 2. Cria instância limpa de reconhecimento
        try {
            if (recognitionRef.current) {
                try { recognitionRef.current.abort(); } catch (_) {}
                recognitionRef.current = null;
            }

            const recognition = new SpeechRec();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'pt-BR';
            recognition.maxAlternatives = 1;

            shouldBeListeningRef.current = true;

            recognition.onstart = () => {
                setIsListening(true);
                isActuallyRunningRef.current = true;
                setSpeechError(null);
            };

            recognition.onresult = (event: any) => {
                let currentInterim = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const res = event.results[i];
                    const text = res[0].transcript;

                    if (res.isFinal) {
                        if (i > lastProcessedIndexRef.current) {
                            lastProcessedIndexRef.current = i;
                            const trimmedText = text.trim();
                            if (trimmedText) {
                                setTranscript(prev => (prev ? `${prev} ${trimmedText}` : trimmedText));
                                if (optionsRef.current?.onFinalResult) {
                                    optionsRef.current.onFinalResult(trimmedText);
                                }
                            }
                        }
                    } else {
                        currentInterim += text;
                    }
                }

                setInterimTranscript(currentInterim.trim());
            };

            recognition.onerror = (event: any) => {
                if (event.error === 'no-speech') {
                    // Pausa normal da fala do usuário, sem erro
                    return;
                }
                if (event.error === 'aborted') {
                    return;
                }

                console.warn("[SpeechRecognition Error]:", event.error);
                if (event.error === 'not-allowed') {
                    setSpeechError("Permissão de microfone bloqueada pelo navegador.");
                } else if (event.error === 'audio-capture') {
                    setSpeechError("Nenhum microfone ativo detectado.");
                } else if (event.error === 'network') {
                    setSpeechError("Erro de rede temporário na transcrição.");
                } else {
                    setSpeechError(`Erro no microfone: ${event.error}`);
                }

                isActuallyRunningRef.current = false;
            };

            recognition.onend = () => {
                isActuallyRunningRef.current = false;
                // Se o usuário ainda deseja ouvir e não cancelou, religa suavemente
                if (shouldBeListeningRef.current) {
                    try {
                        recognition.start();
                    } catch (_) {
                        setIsListening(false);
                    }
                } else {
                    setIsListening(false);
                }
            };

            recognitionRef.current = recognition;
            recognition.start();
            setIsListening(true);
        } catch (err: any) {
            console.error("[SpeechRecognition] Falha ao iniciar:", err);
            setSpeechError(`Falha ao iniciar transcrição: ${err.message || err}`);
            setIsListening(false);
            shouldBeListeningRef.current = false;
        }
    }, []);

    const clearTranscript = useCallback(() => {
        setTranscript('');
        setInterimTranscript('');
    }, []);

    return {
        isListening,
        transcript,
        interimTranscript,
        speechError,
        startListening,
        stopListening,
        clearTranscript,
        hasSupport
    };
};
