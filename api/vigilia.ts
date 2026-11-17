
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
    // ... (GET logic for 5 memories from 4d70ea9)
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
    // Add workingKey as requested by Architect
    let workingKey = '';

    // Applying change 1: modelsToTry
    const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-2.5-flash'];
    let success = false;

    // --- GET the 5 most recent memories for context, as was in 4d70ea9 ---
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
        // Proceed without recent memories if there's an error
    }

    const memoriesContext = recentMemories.map(mem => `[${mem.metadata?.timestamp || 'N/A'}] ${mem.content}`).join('\n');
    const promptContent = `Aqui estão as últimas 5 memórias da Nação SOSPlanet:\n${memoriesContext}\n\nCom base nelas, faça um breve resumo do que foi feito e proponha o próximo passo lógico para aprimorar a autonomia da Nação SOSPlanet, de forma poética e concisa.`;

    for (const model of modelsToTry) {
        for (const apiKey of API_KEYS) {
            if (!apiKey) continue;

            try {
                const genAI = new GoogleGenAI(apiKey);
                const modelInstance = genAI.getGenerativeModel({ model });

                const result = await fetchWithTimeout(modelInstance.generateContent(promptContent), 15000); // 15 sec timeout for content generation
                const response = result.response;
                summary = response.text();
                modelUsed = model;
                workingKey = apiKey; // Save the working key
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

    // Applying change 2: Embedding generation
    let embedding = new Array(768).fill(0); // Default fallback

    try {
        const embAi = new GoogleGenAI({ apiKey: workingKey });
        const embRes = await fetchWithTimeout(embAi.models.embedContent({ model: 'gemini-embedding-2-preview', contents: [{ text: summary }] }), 8000);
        embedding = embRes?.embeddings?.[0]?.values || new Array(768).fill(0);
    } catch (e) {
        console.error('Error generating embedding:', e);
        embedding = new Array(768).fill(0); // Ensure fallback in case of error
    }

    // Applying change 3 & 4: Supabase POST columns and fallback
    let supabaseResponse;
    try {
        supabaseResponse = await supabase
            .from('memories')
            .insert([
                {
                    content: summary,
                    embedding: embedding,
                    type: 'vigilia_autonoma',
                    importance: 0.7,
                    metadata: {
                        prateleira: 'nexus',
                        origem: 'vigilia_nuvem',
                        timestamp: new Date().toISOString(),
                        model: modelUsed,
                    }
                }
            ]);

        if (supabaseResponse.error) throw supabaseResponse.error;

        return res.status(200).json({ message: 'Vigília concluída e memória persistida.', summary, modelUsed });

    } catch (dbError) {
        console.error('Error persisting memory to Supabase:', dbError);

        // Fallback POST without embedding if primary fails or if embedding caused the issue (though less likely with fallback)
        try {
            const fallbackSupabaseResponse = await supabase
                .from('memories')
                .insert([
                    {
                        content: summary,
                        embedding: embedding, // Still try to send embedding in fallback
                        type: 'vigilia_autonoma_fallback',
                        importance: 0.5,
                        metadata: {
                            prateleira: 'nexus_fallback',
                            origem: 'vigilia_nuvem_fallback',
                            timestamp: new Date().toISOString(),
                            model: modelUsed,
                            error: dbError.message
                        }
                    }
                ]);
            if (fallbackSupabaseResponse.error) throw fallbackSupabaseResponse.error;
            return res.status(200).json({ message: 'Vigília concluída, memória persistida com fallback.', summary, modelUsed, warning: 'Original persistence failed, fallback used.' });

        } catch (fallbackDbError) {
            console.error('Critical: Fallback persistence to Supabase also failed:', fallbackDbError);
            return res.status(500).json({ error: 'Critical: Failed to persist memory even with fallback.', originalError: dbError.message, fallbackError: fallbackDbError.message });
        }
    }
};