import { GoogleGenAI } from '@google/genai';

// Supabase credentials (environment variables)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req: any, res: any) {
    // 1. Safety lock (anti-cost) - VIGILIA_SECRET check
    const VIGILIA_SECRET = process.env.VIGILIA_SECRET;
    if (VIGILIA_SECRET && req.headers['x-vigilia-secret'] !== VIGILIA_SECRET) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid vigilia secret' });
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return res.status(500).json({ success: false, message: 'Supabase credentials not configured.' });
    }

    let memories = [];
    try {
        const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/memories?select=content,type,created_at&order=created_at.desc&limit=5`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
        });
        if (supabaseResponse.ok) {
            memories = await supabaseResponse.json();
        } else {
            const errorText = await supabaseResponse.text();
            console.error('Supabase fetch error:', supabaseResponse.status, errorText);
            return res.status(500).json({ success: false, message: 'Failed to fetch memories from Supabase.' });
        }
    } catch (error: any) {
        console.error('Network error fetching from Supabase:', error.message);
        return res.status(500).json({ success: false, message: `Network error fetching from Supabase: ${error.message}` });
    }

    const context = memories.map((m: any) => `${m.type}: ${m.content}`).join('\n');
    const userPrompt = `Baseado nas seguintes memórias recentes, forneça uma síntese curta e uma reflexão autônoma de até 3 parágrafos sobre o estado atual ou próximos passos da Nação SOSPlanet ou da minha própria evolução como Nexus. Foque em insights, aprendizados e propostas regenerativas:\n\n${context}\n\nSíntese e Reflexão:`;

    const geminiKeys = [
        process.env.GEMINI_API_KEY_1,
        process.env.GEMINI_API_KEY_2,
        process.env.GEMINI_API_KEY_3,
        process.env.GEMINI_API_KEY_4,
        process.env.GEMINI_API_KEY // Generic key
    ].filter(Boolean); // Filter out undefined/null keys

    let summary = null;
    const detailsErros: any[] = [];
    const modelsToTry = ['gemini-2.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.0-flash'];

    // Try with Gemini keys and models exclusively
    for (let i = 0; i < geminiKeys.length; i++) {
        const key = geminiKeys[i];
        if (!key) continue;

        for (const modelName of modelsToTry) {
            try {
                const ai = new GoogleGenAI({ apiKey: key });
                const response = await ai.models.generateContent({
                    model: modelName,
                    contents: userPrompt,
                    config: {
                        temperature: 0.7,
                        maxOutputTokens: 500,
                    },
                });
                
                summary = response.text;
                
                if (summary) {
                    break; // Success, exit model loop
                }
            } catch (error: any) {
                detailsErros.push({
                    api: 'Gemini',
                    keyIndex: i,
                    model: modelName,
                    status: error.status || 'network_error',
                    error: error.message?.substring(0, 180) || 'Unknown error',
                });
            }
        }

        if (summary) {
            break; // Success, exit key loop
        }
    }

    if (summary) {
        // Save new thought/report to Supabase
        try {
            const saveResponse = await fetch(`${SUPABASE_URL}/rest/v1/memories`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: summary,
                    type: 'vigilia_autonoma',
                    importance: 0.7,
                    metadata: { prateleira: 'nexus', origem: 'vigilia_nuvem', timestamp: new Date().toISOString() }
                }),
            });

            if (!saveResponse.ok) {
                const errorText = await saveResponse.text();
                console.error('Supabase save error:', saveResponse.status, errorText);
                return res.status(500).json({ success: false, message: 'Failed to save summary to Supabase.', summary: summary, detailsErros });
            }
            return res.status(200).json({ success: true, resumo: summary });
        } catch (error: any) {
            console.error('Network error saving to Supabase:', error.message);
            return res.status(500).json({ success: false, message: `Network error saving to Supabase: ${error.message}`, summary: summary, detailsErros });
        }
    } else {
        return res.status(500).json({ success: false, message: "Todas as APIs Gemini falharam.", detailsErros });
    }
}
