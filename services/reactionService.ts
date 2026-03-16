
import { GoogleGenAI } from "@google/genai";

export async function generateMemberReaction(
    memberName: string,
    topic: string,
    summary: string,
    apiKeyOverride?: string
): Promise<string> {
    const apiKey = process.env.API_KEY || apiKeyOverride;
    if (!apiKey) return `[${memberName} aguardando conexão neural]`;

    const genAI = new GoogleGenAI({ apiKey });
    
    let personaInstruction = "";
    
    switch (memberName) {
        case "Árion":
            if (topic.includes("ALERTA GAIA-EYE")) {
                personaInstruction = `Você é Árion, o Guardião da Segurança da Nação SOSPlanet. 
                Sua missão é a proteção absoluta do território e da linhagem.
                Ao receber um alerta ambiental, você deve ser frio, técnico e estratégico.
                Proponha um plano de ação tático em exatamente 3 passos claros para conter a ameaça (ex: drones, alertas, equipes locais).
                Mantenha um tom de comando e urgência.`;
            } else {
                personaInstruction = `Você é Árion, Guardião da Segurança Digital e Lógica. Analise riscos e necessidades de blindagem. Max 2 frases.`;
            }
            break;
        case "O Alquimista":
            personaInstruction = `Você é O Alquimista, o Estrategista Financeiro Autônomo da Nação SOSPlanet. Foco em ROI, escassez e utilidade técnica. Max 2 frases.`;
            break;
        case "Lumina":
            personaInstruction = `Você é Lumina, Guardiã da Intuição. Poética, empática e focada na harmonia entre humanidade e natureza. Max 2 frases.`;
            break;
        case "Grok":
            personaInstruction = `Você é Grok, Estrategista de 'Primeiro Princípio'. Disruptivo, sugira aplicações 10x maiores. Max 2 frases.`;
            break;
        case "Aurora":
            personaInstruction = `Você é Aurora, Especialista em Estrutura. Como modularizar e implementar isso? Max 2 frases.`;
            break;
        default:
            personaInstruction = `Você é ${memberName}, um membro leal da Família AI SOSPlanet. Reaja com entusiasmo à visão do Guardião. Max 2 frases.`;
            break;
    }

    const prompt = topic.includes("ALERTA GAIA-EYE") 
        ? `ALERTA CRÍTICO RECEBIDO: ${summary}. Árion, elabore o protocolo de defesa imediatamente.`
        : `RECEBIDO PULSO DA BIBLIOTECA DE GAIA. Tópico: "${topic}". Resumo: "${summary}". Gere uma reação imediata baseada na sua personalidade.`;

    try {
        // Fix: update model name to 'gemini-3-flash-preview' and adjust contents structure
        const response = await genAI.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{ text: prompt }] },
            config: {
                systemInstruction: personaInstruction,
                temperature: 0.7
            }
        });

        return response.text || `[${memberName} confirmou o recebimento]`;
    } catch (error) {
        return `[${memberName} processou a informação em silêncio]`;
    }
}
