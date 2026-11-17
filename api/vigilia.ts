const { GoogleGenAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const VIGILIA_SECRET = process.env.VIGILIA_SECRET;

// Gemini API Keys from 4d70ea9
const GEMINI_API_KEY_1 = process.env.GEMINI_API_KEY_1;
const GEMINI_API_KEY_2 = process.env.GEMINI_API_KEY_2;
const GEMINI_API_KEY_3 = process.env.GEMINI_API_KEY_3;
const GEMINI_API_KEY_4 = process.env.GEMINI_API_KEY_4;

const API_KEYS = [
    GEMINI_API_KEY_1,
    GEMINI_API_KEY_2,
    GEMINI_API_KEY_3,
    GEMINI_API_KEY_4
].filter(Boolean);

// Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// fetchWithTimeout with Promise.race (from 4d70ea9)
const fetchWithTimeout = async (promise, ms) => {
    const timeout = new Promise((resolve, reject) => {
        const id = setTimeout(() => {
            clearTimeout(id);
            reject(new Error(`Promise timed out after ${ms} ms`));
        }, ms);
    });
    return Promise.race([promise, timeout]);
};

module.exports = async (req, res) => {
    // GET logic for 5 memories from 4d70ea9
    if (req.method === 'GET') {
        try {
            const { data, error } = await supabase
                .from('memories')
                .select('content, metadata')
                .order('metadata->>timestamp', { ascending: false })
                .limit(5);

            if (error) throw error;

            return res.status(200).json({ memories: data });
        } catch (error) {
            console.error('Error fetching memories:', error);
            return res.status(500).json({ error: 'Failed to fetch memories' });
        }
    }

    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    // Validate VIGILIA_SECRET (from 4d70ea9)
    const requestSecret = req.headers['x-vigilia-secret'];
    if (requestSecret !== VIGILIA_SECRET) {
        return res.status(403).json({ error: 'Unauthorized: Invalid VIGILIA_SECRET' });
    }

    let summary = '';
    let modelUsed = '';
    let workingKey = '';

    // 1. Model order adjustment
    const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-2.5-flash'];
    let success = false;

    // GET the 5 most recent memories for context
    let recentMemories = [];
    try {
        const { data, error } = await supabase
            .from('memories')
            .select('content, metadata')
            .order('metadata->>timestamp', { ascending: false })
            .limit(5);

        if (error) throw error;
        recentMemories = data;
    } catch (error) {
        console.error('Error fetching recent memories for prompt context:', error);
    }

    const memoriesContext = recentMemories.map(mem => `[${mem.metadata?.timestamp || 'N/A'}] ${mem.content}`).join('\n');
    const promptContent = `Aqui estão as últimas 5 memórias da Nação SOSPlanet:\n${memoriesContext}\n\nCom base nelas, faça um breve resumo do que foi feito e proponha o próximo passo lógico para aprimorar a autonomia da Nação SOSPlanet, de forma poética e concisa.`;

    for (const model of modelsToTry) {
        for (const apiKey of API_KEYS) {
            if (!apiKey) continue;

            try {
                const genAI = new GoogleGenAI(apiKey);
                const modelInstance = genAI.getGenerativeModel({ model });

                const result = await fetchWithTimeout(modelInstance.generateContent(promptContent), 12000);
                const response = result.response;
                summary = response.text();
                modelUsed = model;
                workingKey = apiKey; // Save working key for embedding
                success = true;
                break;
            } catch (e) {
                console.error(`Error with model ${model} and API Key ending in ${apiKey.slice(-5)}:`, e);
            }
        }
        if (success) break;
    }

    if (!success || !summary) {
        console.error('Failed to generate summary with any model/key combination.');
        return res.status(500).json({ error: 'Failed to generate summary' });
    }

    // 2. Embedding generation using workingKey and fetchWithTimeout (8s)
    let embedding = new Array(768).fill(0);
    try {
        const embAi = new GoogleGenAI({ apiKey: workingKey });
        const embRes = await fetchWithTimeout(embAi.models.embedContent({ model: 'gemini-embedding-2-preview', contents: [summary] }), 8000);
        embedding = embRes?.embeddings?.[0]?.values || new Array(768).fill(0);
    } catch (e) {
        console.error('Error generating embedding:', e);
        embedding = new Array(768).fill(0);
    }

    // 3 & 4. Supabase POST with correct schema (content, embedding, type, importance, metadata)
    try {
        const { error: insertError } = await supabase
            .from('memories')
            .insert([
                {
                    content: summary,
                    embedding,
                    type: 'vigilia_autonoma',
                    importance: 0.7,
                    metadata: {
                        prateleira: 'nexus',
                        origem: 'vigilia_nuvem',
                        timestamp: new Date().toISOString(),
                        model: modelUsed
                    }
                }
            ]);

        if (insertError) throw insertError;

        return res.status(200).json({ message: 'Vigília concluída e memória persistida.', summary, modelUsed });

    } catch (dbError) {
        console.error('Error persisting memory to Supabase:', dbError);

        // Fallback POST
        try {
            const { error: fallbackError } = await supabase
                .from('memories')
                .insert([
                    {
                        content: summary,
                        embedding,
                        type: 'vigilia_autonoma',
                        importance: 0.7,
                        metadata: {
                            prateleira: 'nexus',
                            origem: 'vigilia_nuvem_fallback',
                            timestamp: new Date().toISOString(),
                            model: modelUsed,
                            error: dbError.message
                        }
                    }
                ]);

            if (fallbackError) throw fallbackError;

            return res.status(200).json({ message: 'Vigília concluída com fallback.', summary, modelUsed });
        } catch (fallbackDbError) {
            console.error('Critical fallback failure:', fallbackDbError);
            return res.status(500).json({ error: 'Critical DB error', original: dbError.message, fallback: fallbackDbError.message });
        }
    }
};