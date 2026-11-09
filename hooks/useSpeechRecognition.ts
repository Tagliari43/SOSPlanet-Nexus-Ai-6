import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseSpeechRecognitionOptions {
    onFinalResult?: (newFinalText: string) => void;
}

export const useSpeechRecognition = (options?: UseSpeechRecognitionOptions) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [speechError, setSpeechError] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);
    const isActuallyRunningRef = useRef(false);
    const optionsRef = useRef(options);
    optionsRef.current = options;

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Navegador não possui suporte nativo à Web Speech API.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'pt-BR';

        recognition.onstart = () => {
            setIsListening(true);
            isActuallyRunningRef.current = true;
            setSpeechError(null);
        };

        recognition.onend = () => {
            setIsListening(false);
            isActuallyRunningRef.current = false;
        };

        recognition.onresult = (event: any) => {
            let currentInterim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const res = event.results[i];
                const text = res[0].transcript;
                if (res.isFinal) {
                    const trimmed = text.trim();
                    if (trimmed) {
                        setTranscript(prev => (prev ? `${prev} ${trimmed}` : trimmed));
                        if (optionsRef.current?.onFinalResult) {
                            optionsRef.current.onFinalResult(trimmed);
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
                return;
            }
            if (event.error === 'aborted') {
                return;
            }
            console.warn("[NEXUS Speech Error]:", event.error);
            if (event.error === 'not-allowed') {
                setSpeechError("Permissão de microfone bloqueada pelo navegador.");
            } else {
                setSpeechError(`Erro no microfone: ${event.error}`);
            }
            setIsListening(false);
            isActuallyRunningRef.current = false;
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (_) {}
            }
        };
    }, []);

    const startListening = useCallback(() => {
        if (!recognitionRef.current) {
            setSpeechError("Reconhecimento de fala não suportado neste navegador.");
            return;
        }

        if (isActuallyRunningRef.current) {
            return;
        }

        setSpeechError(null);
        setTranscript('');
        setInterimTranscript('');

        try {
            recognitionRef.current.start();
            setIsListening(true);
            isActuallyRunningRef.current = true;
        } catch (e: any) {
            if (e.name === 'InvalidStateError' || e.message?.includes('already started')) {
                setIsListening(true);
                isActuallyRunningRef.current = true;
            } else {
                console.error("Falha ao iniciar microfone:", e);
                setSpeechError(`Falha ao iniciar microfone: ${e.message || e}`);
            }
        }
    }, []);

    const stopListening = useCallback(() => {
        setIsListening(false);
        isActuallyRunningRef.current = false;
        setInterimTranscript('');
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (_) {
                try { recognitionRef.current.abort(); } catch (__) {}
            }
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
        hasSupport: !!recognitionRef.current
    };
};
