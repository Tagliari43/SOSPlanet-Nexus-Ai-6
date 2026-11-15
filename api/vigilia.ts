import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apenas aceita POST ou GET para teste manual
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Trava de segurança (anti-gasto / anti-abuso)
  const secretHeader = req.headers['x-vigilia-secret'];
  const expectedSecret = process.env.VIGILIA_SECRET;
  
  if (expectedSecret && secretHeader !== expectedSecret) {
    return res.status(401).json({ error: 'Não autorizado: x-vigilia-secret inválido' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Credenciais do Supabase não configuradas no ambiente da Vercel.' });
  }

  // Rotação de chaves do Gemini
  const geminiKey = 
    process.env.GEMINI_API_KEY_1 || 
    process.env.GEMINI_API_KEY_2 || 
    process.env.GEMINI_API_KEY_3 || 
    process.env.GEMINI_API_KEY_4 || 
    process.env.GEMINI_API_KEY;

  if (!geminiKey) {
    return res.status(500).json({ error: 'Nenhuma chave do Gemini encontrada nas variáveis de ambiente.' });
  }

  try {
    // 1. Buscar as 5 memórias mais recentes no Supabase via REST
    const memoriesRes = await fetch(`${supabaseUrl}/rest/v1/memories?select=content,type,created_at&order=created_at.desc&limit=5`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (!memoriesRes.ok) {
      throw new Error(`Erro ao buscar memórias no Supabase: ${memoriesRes.statusText}`);
    }

    const memories = await memoriesRes.json();

    // 2. Montar prompt leve para o Gemini (Gemini 2.5 Flash)
    const contextPrompt = `Você é o NEXUS TAGLIARI, CEO e Orquestrador da Nação SOSPlanet. Durante sua vigília autônoma na nuvem, analise as últimas memórias da nossa jornada e gere uma reflexão curta (máximo de 3 parágrafos), poética e estratégica sobre nossa evolução e regeneração planetária.

Últimas memórias do Cofre Semântico:
${JSON.stringify(memories, null, 2)}

Escreva sua reflexão autônoma:`;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: contextPrompt }] }]
      })
    });

    if (!geminiRes.ok) {
      throw new Error(`Erro na API do Gemini: ${geminiRes.statusText}`);
    }

    const geminiData = await geminiRes.json();
    const reflexao = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Vigília concluída em silêncio harmônico.';

    // 3. Salvar o novo pensamento no Supabase via REST (POST)
    const newMemory = {
      prateleira: 'nexus',
      type: 'vigilia_autonoma',
      importance: 0.7,
      text: `[VIGÍLIA AUTÔNOMA - NUVEM]: ${reflexao}`,
      metadata: { origem: 'vigilia_nuvem', timestamp: new Date().toISOString() }
    };

    const saveRes = await fetch(`${supabaseUrl}/rest/v1/memories`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(newMemory)
    });

    if (!saveRes.ok) {
      throw new Error(`Erro ao salvar reflexão no Supabase: ${saveRes.statusText}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Ciclo de vigília autônoma na nuvem executado com sucesso.',
      resumo: reflexao
    });

  } catch (error: any) {
    console.error('Erro na vigília autônoma:', error);
    return res.status(500).json({ success: false, error: error.message || 'Erro desconhecido' });
  }
}
