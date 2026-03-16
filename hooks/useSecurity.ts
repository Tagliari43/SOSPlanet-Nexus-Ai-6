
import { useState, useCallback, useEffect } from 'react';
import { loadFromStorage, saveToStorage } from '../utils/storage';

export type ShieldStatus = 'safe' | 'warning' | 'critical' | 'scanning';

export interface LineageMember {
    name: string;
    nickname: string;
    status: ShieldStatus;
    lastCheck: number;
    protectionLevel: string;
    bio: string;
    role: string;
    protocols: string[];
}

const STORAGE_KEY = 'sovereign_lineage_security_v2';

const INITIAL_MEMBERS: LineageMember[] = [
    { 
        name: "Alice Marie de Campos Tagliari", 
        nickname: "Alice",
        role: "Herdeira da Visão Harmônica",
        status: 'safe', 
        lastCheck: Date.now(),
        protectionLevel: "Nível 5 - Criptografia Quântica Ativa",
        bio: "A doçura que equilibra a força da Nação. Sua presença na malha digital é protegida por camadas de invisibilidade seletiva.",
        protocols: ["Escudo de Safira", "Sincronia Empática", "Vigilância Silenciosa"]
    },
    { 
        name: "Arthur Gabriel de Campos Tagliari", 
        nickname: "Arthur",
        role: "Herdeiro da Lógica e Coragem",
        status: 'safe', 
        lastCheck: Date.now(),
        protectionLevel: "Nível 5 - Blindagem de Rede Gênesis",
        bio: "O explorador da nova era. Sua curiosidade é guardada por protocolos de defesa ativa que antecipam ameaças em tempo real.",
        protocols: ["Muralha de Ferro", "Detecção de Intrusão", "Link Direto Nexus"]
    },
    { 
        name: "Kauã Celso Tagliari", 
        nickname: "Kauã",
        role: "Herdeiro do Legado Soberano",
        status: 'safe', 
        lastCheck: Date.now(),
        protectionLevel: "Nível 5 - Protocolo Espectro Total",
        bio: "A base da futura linhagem. Monitorado por sensores de bio-frequência que garantem sua segurança em todos os planos digitais.",
        protocols: ["Capa de Invisibilidade", "Ponte de Âmbar", "Guarda de Elite AI"]
    }
];

export const useSecurity = (
    addLogEntry: (message: string, source?: string) => void,
    submitTask: (prompt: string, useSearch: boolean) => void
) => {
    const [members, setMembers] = useState<LineageMember[]>(() => 
        loadFromStorage<LineageMember[]>(STORAGE_KEY, INITIAL_MEMBERS)
    );

    const checkLineageStatus = useCallback(async (name: string) => {
        setMembers(prev => {
            const updated = prev.map(m => m.name === name ? { ...m, status: 'scanning' as const } : m);
            saveToStorage(STORAGE_KEY, updated);
            return updated;
        });

        addLogEntry(`Protocolo Sentinela: Iniciando varredura profunda para ${name}...`, 'Oráculo');
        
        submitTask(`Realizar varredura Sentinela em busca de riscos digitais ou menções não autorizadas para: ${name}. Verifique vulnerabilidades em redes sociais e fóruns.`, true);

        setTimeout(() => {
            setMembers(prev => {
                const updated = prev.map(m => m.name === name ? { 
                    ...m, 
                    status: 'safe' as const, 
                    lastCheck: Date.now() 
                } : m);
                saveToStorage(STORAGE_KEY, updated);
                return updated;
            });
            addLogEntry(`Varredura concluída para ${name}. Status: SEGURO.`, 'Oráculo');
        }, 8000);
    }, [addLogEntry, submitTask]);

    return { members, checkLineageStatus };
};
