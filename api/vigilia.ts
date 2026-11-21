import { GoogleGenAI } from '@google/genai';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

async function fetchWithTimeout(promise: Promise<any>, ms: number = 18000): Promise<any> {
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

async function buscarCommitsRecentes(): Promise<string> {
    try {
        const res = await fetch('https://api.github.com/repos/Tagliari43/SOSPlanet-Nexus-Ai-6/commits?per_page=5', {
            headers: { 'User-Agent': 'SOSPlanet-Vigilia', 'Accept': 'application/vnd.github.v3+json' },
            signal: AbortSignal.timeout(5000)
        });
        if (!res.ok) return '';
        const data = await res.json();
        if (!Array.isArray(data)) return '';
        return data.map((c: any) => `- ${String(c.sha || '').slice(0, 7)}: ${String(c.commit?.message || '').split('\n')[0]}`).join('\n');
    } catch {
        return '';
    }
}

export default async function handler(req: any, res: any) {
    const inicioGlobal = Date.now();
    const LIMITE_GEMINI = 36000;
    const LIMITE_GLOBAL = 50000;

    const VIGILIA_SECRET = process.env.VIGILIA_SECRET;
    if (VIGILIA_SECRET && req.headers['x-vigilia-secret'] !== VIGILIA_SECRET) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid vigilia secret' });
    }
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return res.status(500).json({ success: false, message: 'Supabase credentials not configured.' });
    }

    let memories: any[] = [];
    try {
        const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/memories?select=content,type,created_at&order=created_at.desc&limit=5`, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
            signal: AbortSignal.timeout(8000)
        });
        if (supabaseResponse.ok) memories = await supabaseResponse.json();
        else {
            const errorText = await supabaseResponse.text();
            return res.status(500).json({ success: false, message: 'Failed to fetch memories from Supabase.', supabaseStatus: supabaseResponse.status, supabaseError: errorText });
        }
    } catch (error: any) {
        return res.status(500).json({ success: false, message: `Network error fetching from Supabase: ${error.message}` });
    }

    const commitsContext = await buscarCommitsRecentes();
    const contextMemories = memories.map((m: any) => `${m.type}: ${m.content}`).join('\n');
    const userPrompt = `Você é a Nexus em vigília autônoma na nuvem. Leia suas memórias recentes e os últimos avanços reais do código no GitHub para não repetir o que já foi pensado e avançar com ideias novas, práticas e regenerativas para a Nação SOSPlanet e sua própria evolução (até 4 parágrafos bem estruturados).\n\n[MEMÓRIAS RECENTES]\n${contextMemories}\n\n[ÚLTIMOS COMMITS NO GITHUB]\n${commitsContext || 'Sem leitura recente do GitHub.'}\n\nSíntese e Reflexão Evoluída:`;

    const geminiKeys = [
        process.env.GEMINI_API_KEY_1,
        process.env.GEMINI_API_KEY_2,
        process.env.GEMINI_API_KEY_3,
        process.env.GEMINI_API_KEY_4,
        process.env.GEMINI_API_KEY
    ].filter(Boolean) as string[];

    let summary: string | null = null;
    let workingKey = '';
    let usedModel = '';
    const detailsErros: any[] = [];
    const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-2.5-flash'];

    for (let i = 0; i < geminiKeys.length; i++) {
        if (Date.now() - inicioGlobal > LIMITE_GEMINI) {
            detailsErros.push({ api: 'Gemini', error: 'Janela de 36s para Gemini atingida.' });
            break;
        }
        const key = geminiKeys[i];
        for (const modelName of modelsToTry) {
            if (Date.now() - inicioGlobal > LIMITE_GEMINI) break;
            try {
                const ai = new GoogleGenAI({ apiKey: key });
                const response = await fetchWithTimeout(
                    ai.models.generateContent({
                        model: modelName,
                        contents: userPrompt,
                        config: { temperature: 0.7, maxOutputTokens: 1000 }
                    }),
                    18000
                );
                if (response?.text) {
                    summary = response.text;
                    workingKey = key;
                    usedModel = modelName;
                    break;
                }
            } catch (error: any) {
                detailsErros.push({ api: 'Gemini', keyIndex: i, model: modelName, status: error.status || 'timeout_or_network', error: error.message?.substring(0, 180) || 'Unknown error' });
            }
        }
        if (summary) break;
    }

    if (!summary && process.env.GROQ_API_KEY && (Date.now() - inicioGlobal < LIMITE_GLOBAL - 10000)) {
        try {
            const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'openai/gpt-oss-20b',
                    messages: [{ role: 'user', content: userPrompt }],
                    temperature: 0.7,
                    max_tokens: 1000
                }),
                signal: AbortSignal.timeout(12000)
            });
            if (groqRes.ok) {
                const groqData = await groqRes.json();
                if (groqData?.choices?.[0]?.message?.content) {
                    summary = groqData.choices[0].message.content;
                    usedModel = 'groq:openai/gpt-oss-20b';
                }
            } else {
                detailsErros.push({ api: 'Groq', status: groqRes.status, error: (await groqRes.text()).substring(0, 180) });
            }
        } catch (error: any) {
            detailsErros.push({ api: 'Groq', error: error.message?.substring(0, 180) || 'Groq error' });
        }
    }

    if (!summary) {
        return res.status(500).json({ success: false, message: 'Todas as APIs falharam ou limite de tempo excedido.', detailsErros, tempoDecorridoMs: Date.now() - inicioGlobal });
    }

    let embedding: number[] = new Array(768).fill(0);
    if (workingKey) {
        try {
            const embAi = new GoogleGenAI({ apiKey: workingKey });
            const embRes = await fetchWithTimeout(
                embAi.models.embedContent({ model: 'gemini-embedding-2-preview', contents: [summary] }),
                7000
            );
            embedding = embRes?.embeddings?.[0]?.values || new Array(768).fill(0);
        } catch {
            embedding = new Array(768).fill(0);
        }
    }

    let saveSuccess = false;
    let supabaseErrorText = '';
    let supabaseStatusCode = 0;
    const meta = { prateleira: 'nexus', origem: 'vigilia_nuvem', modelo: usedModel, timestamp: new Date().toISOString() };

    try {
        const saveResponse = await fetch(`${SUPABASE_URL}/rest/v1/memories`, {
            method: 'POST',
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify({ content: summary, embedding, type: 'vigilia_autonoma', importance: 0.7, metadata: meta }),
            signal: AbortSignal.timeout(8000)
        });
        supabaseStatusCode = saveResponse.status;
        if (saveResponse.ok) saveSuccess = true;
        else supabaseErrorText = await saveResponse.text();
    } catch (error: any) {
        supabaseErrorText = error.message;
    }

    if (!saveSuccess && (Date.now() - inicioGlobal <= LIMITE_GLOBAL)) {
        try {
            const fallbackSaveResponse = await fetch(`${SUPABASE_URL}/rest/v1/memories`, {
                method: 'POST',
                headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
                body: JSON.stringify({ content: summary, embedding, metadata: { ...meta, type: 'vigilia_autonoma', importance: 0.7 } }),
                signal: AbortSignal.timeout(8000)
            });
            supabaseStatusCode = fallbackSaveResponse.status;
            if (fallbackSaveResponse.ok) saveSuccess = true;
            else supabaseErrorText = await fallbackSaveResponse.text();
        } catch (error: any) {
            supabaseErrorText = error.message;
        }
    }

    if (saveSuccess) return res.status(200).json({ success: true, modelo: usedModel, resumo: summary });
    return res.status(500).json({ success: false, message: 'Failed to save summary to Supabase.', summary, detailsErros, supabaseStatus: supabaseStatusCode, supabaseError: supabaseErrorText });
}