
import { useState, useEffect, useCallback, useRef } from 'react';

export const useSpeechRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<any>(null);
    const isActuallyRunningRef = useRef(false);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Navegador não suporta Speech Recognition nativo.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'pt-BR';

        // Sincronia de estado real com a engine do navegador
        recognition.onstart = () => {
            setIsListening(true);
            isActuallyRunningRef.current = true;
        };

        recognition.onend = () => {
            setIsListening(false);
            isActuallyRunningRef.current = false;
        };

        recognition.onresult = (event: any) => {
            let currentTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    setTranscript(prev => prev + event.results[i][0].transcript + ' ');
                } else {
                    currentTranscript += event.results[i][0].transcript;
                }
            }
        };

        recognition.onerror = (event: any) => {
            // O erro 'no-speech' ocorre quando o microfone abre mas ninguém fala.
            // Tratamos de forma silenciosa para não poluir o console do Guardião.
            if (event.error === 'no-speech') {
                console.debug("[NEXUS] Silêncio detectado na malha auditiva.");
                return;
            }
            
            console.error("Erro no reconhecimento de fala:", event.error);
            setIsListening(false);
            isActuallyRunningRef.current = false;
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {
                    // Silencioso no descarte do componente
                }
            }
        };
    }, []);

    const startListening = useCallback(() => {
        if (!recognitionRef.current) return;
        
        // Proteção contra reinicialização de engine já ativa
        if (isActuallyRunningRef.current) {
            console.warn("[NEXUS] Sensores auditivos já estão em modo de escuta.");
            return;
        }

        try {
            setTranscript('');
            recognitionRef.current.start();
        } catch (e: any) {
            if (e.name === 'InvalidStateError' || e.message?.includes('already started')) {
                // Recuperação suave de estado
                setIsListening(true);
                isActuallyRunningRef.current = true;
            } else {
                console.error("Falha ao iniciar reconhecimento:", e);
            }
        }
    }, []);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isActuallyRunningRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                console.error("Erro ao cessar reconhecimento:", e);
            }
        }
    }, []);

    return { 
        isListening, 
        transcript, 
        startListening, 
        stopListening, 
        hasSupport: !!recognitionRef.current 
    };
};
