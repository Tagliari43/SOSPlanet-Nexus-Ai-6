export default async function handler(req: any, res: any) {
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

  // Rotação robusta de chaves do Gemini (tentando em sequência se houver falha)
  const geminiKeys = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY
  ].filter(Boolean) as string[];

  if (geminiKeys.length === 0) {
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

    let geminiRes: Response | null = null;
    let geminiData: any = null;
    let usedKeyIndex = -1;

    for (let i = 0; i < geminiKeys.length; i++) {
      const key = geminiKeys[i];
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: contextPrompt }] }]
          })
        });

        if (res.ok) {
          geminiRes = res;
          geminiData = await res.json();
          usedKeyIndex = i + 1;
          break;
        } else {
          console.warn(`Tentativa com GEMINI_API_KEY_${i+1} falhou com status ${res.status}. Tentando próxima...`);
        }
      } catch (err) {
        console.warn(`Erro na tentativa com chave ${i+1}:`, err);
      }
    }

    if (!geminiRes || !geminiData) {
      throw new Error('Todas as chaves do Gemini falharam ou esgotaram a cota neste ciclo.');
    }

    const reflexao = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Vigília concluída em silêncio harmônico.';

    // 3. Salvar o novo pensamento no Supabase via REST (POST) usando as colunas reais corretas: content, type, importance, metadata
    const newMemory = {
      content: `[VIGÍLIA AUTÔNOMA - NUVEM (Chave #${usedKeyIndex})]: ${reflexao}`,
      type: 'vigilia_autonoma',
      importance: 0.7,
      metadata: { 
        prateleira: 'nexus', 
        origem: 'vigilia_nuvem', 
        timestamp: new Date().toISOString() 
      }
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
      message: `Ciclo de vigília autônoma na nuvem executado com sucesso (usando Gemini Key #${usedKeyIndex}).`,
      resumo: reflexao
    });

  } catch (error: any) {
    console.error('Erro na vigília autônoma:', error);
    return res.status(500).json({ success: false, error: error.message || 'Erro desconhecido' });
  }
}
