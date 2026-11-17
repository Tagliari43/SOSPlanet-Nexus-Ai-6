import { GoogleGenAI } from '@google/genai';

// Supabase credentials (environment variables)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Helper para timeout com Promise.race (12 segundos para o Gemini)
async function fetchWithTimeout(promise: Promise<any>, ms: number = 12000): Promise<any> {
    let timeoutId: any;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`Timeout ${ms}ms excedido`)), ms);
    });
    try {
        const result = await Promise.race([promise, timeoutPromise]);
        clearTimeout(timeoutId);
        return result;
    } catch (err) {
        clearTimeout(timeoutId);
        throw err;
    }
}

export default async function handler(req: any, res: any) {
    const inicioGlobal = Date.now();
    const TIMEOUT_GLOBAL = 45000; // 45 segundos limite global

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
            signal: AbortSignal.timeout(10000) // 10s timeout
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
    ].filter(Boolean);

    let summary = null;
    const detailsErros: any[] = [];
    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash'];

    // Try with Gemini keys and models exclusively
    for (let i = 0; i < geminiKeys.length; i++) {
        // Checagem de limite global de 45 segundos
        if (Date.now() - inicioGlobal > TIMEOUT_GLOBAL) {
            detailsErros.push({ api: 'Global', error: 'Limite global de 45s atingido antes de concluir todas as chaves.' });
            break;
        }

        const key = geminiKeys[i];
        if (!key) continue;

        for (const modelName of modelsToTry) {
            if (Date.now() - inicioGlobal > TIMEOUT_GLOBAL) break;

            try {
                const ai = new GoogleGenAI({ apiKey: key });
                const response = await fetchWithTimeout(
                    ai.models.generateContent({
                        model: modelName,
                        contents: userPrompt,
                        config: {
                            temperature: 0.7,
                            maxOutputTokens: 500,
                        },
                    }),
                    12000 // 12 segundos timeout por chamada
                );
                
                summary = response?.text;
                
                if (summary) {
                    break; // Success, exit model loop
                }
            } catch (error: any) {
                detailsErros.push({
                    api: 'Gemini',
                    keyIndex: i,
                    model: modelName,
                    status: error.status || 'timeout_or_network',
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
        let saveSuccess = false;
        let supabaseErrorText = '';
        let supabaseStatusCode = 0;

        try {
            const saveResponse = await fetch(`${SUPABASE_URL}/rest/v1/memories`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    content: summary,
                    type: 'vigilia_autonoma',
                    importance: 0.7,
                    metadata: { prateleira: 'nexus', origem: 'vigilia_nuvem', timestamp: new Date().toISOString() }
                }),
                signal: AbortSignal.timeout(10000) // 10s timeout
            });

            supabaseStatusCode = saveResponse.status;
            if (saveResponse.ok) {
                saveSuccess = true;
            } else {
                supabaseErrorText = await saveResponse.text();
            }
        } catch (error: any) {
            supabaseErrorText = error.message;
        }

        // Fallback attempt
        if (!saveSuccess && (Date.now() - inicioGlobal <= TIMEOUT_GLOBAL)) {
            try {
                const fallbackSaveResponse = await fetch(`${SUPABASE_URL}/rest/v1/memories`, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        content: summary,
                        metadata: { type: 'vigilia_autonoma', importance: 0.7, prateleira: 'nexus', origem: 'vigilia_nuvem', timestamp: new Date().toISOString() }
                    }),
                    signal: AbortSignal.timeout(10000) // 10s timeout
                });

                supabaseStatusCode = fallbackSaveResponse.status;
                if (fallbackSaveResponse.ok) {
                    saveSuccess = true;
                } else {
                    supabaseErrorText = await fallbackSaveResponse.text();
                }
            } catch (error: any) {
                supabaseErrorText = error.message;
            }
        }

        if (saveSuccess) {
            return res.status(200).json({ success: true, resumo: summary });
        } else {
            return res.status(500).json({
                success: false,
                message: 'Failed to save summary to Supabase after multiple attempts.',
                summary: summary,
                detailsErros,
                supabaseStatus: supabaseStatusCode,
                supabaseError: supabaseErrorText
            });
        }
    } else {
        // Se o tempo estourou ou todas falharam, retorna imediatamente o JSON com os erros sem esperar 504
        return res.status(500).json({ 
            success: false, 
            message: "Todas as APIs Gemini falharam ou limite de tempo excedido.", 
            detailsErros,
            tempoDecorridoMs: Date.now() - inicioGlobal
        });
    }
}
