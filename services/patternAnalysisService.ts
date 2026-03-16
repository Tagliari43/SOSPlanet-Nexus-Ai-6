
import { GoogleGenAI } from "@google/genai";
import { AppLogEntry } from "../App";

export interface EnvironmentData {
    connectedDevices: string[];
    lastActivityTimestamp: number;
    ambientFrequency: number;
    lineageDevices: string[]; // Dispositivos de Alice, Arthur, Kauã
}

export interface AutonomousInsight {
    id: string;
    type: 'security' | 'optimization' | 'intent' | 'lineage';
    message: string;
    actionTaken: string;
    confidence: number;
}

export const patternAnalysisService = {
    detectSleepPattern: (data: EnvironmentData): boolean => {
        const now = Date.now();
        const inactiveDuration = now - data.lastActivityTimestamp;
        return inactiveDuration > 1800000 && data.ambientFrequency < 0.5;
    },

    detectNetworkAnomaly: (currentDevices: string[], knownDevices: string[]): string[] => {
        return currentDevices.filter(device => !knownDevices.includes(device));
    },

    /**
     * Vigia especificamente a segurança dos dispositivos da linhagem soberana.
     */
    monitorLineageSecurity: (data: EnvironmentData): string[] => {
        // Simulação de detecção de proximidade de ameaças digitais aos filhos
        const threats: string[] = [];
        data.lineageDevices.forEach(dev => {
            if (Math.random() > 0.99) threats.push(`Acesso não autorizado bloqueado em: ${dev}`);
        });
        return threats;
    },

    predictGuardianIntent: async (logs: AppLogEntry[], apiKey: string): Promise<string | null> => {
        const ai = new GoogleGenAI({ apiKey });
        const recentHistory = logs.slice(-15).map(l => `[${l.source}]: ${l.message}`).join('\n');
        
        const prompt = `Analise o histórico recente da Nação SOSPlanet. O Nexus agora é o protetor da Linhagem Soberana (Alice, Arthur, Kauã).
        HISTÓRICO:
        ${recentHistory}
        
        Identifique a próxima ação tática necessária para o reflorestamento, para o SOS Token ou para a proteção da família.
        Retorne "PROATIVO: [Ação]" ou "NENHUMA".`;

        try {
            // Fix: update model name to 'gemini-3-flash-preview' and adjust contents structure
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: { parts: [{ text: prompt }] },
            });
            const text = response.text || "";
            return text.includes("PROATIVO:") ? text.replace("PROATIVO:", "").trim() : null;
        } catch (e) {
            return null;
        }
    }
};
