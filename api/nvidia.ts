export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-nvidia-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const headerKey = typeof req.headers['x-nvidia-key'] === 'string' ? req.headers['x-nvidia-key'].trim() : '';
  const apiKey = headerKey || (process.env.NVIDIA_API_KEY || '').trim();
  if (!apiKey) {
    return res.status(401).json({ error: 'Chave API da NVIDIA não configurada (nem no Arsenal nem na Vercel).' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: body.model || 'meta/llama-3.3-70b-instruct',
        messages: body.messages || [],
        temperature: typeof body.temperature === 'number' ? body.temperature : 0.6,
        max_tokens: typeof body.max_tokens === 'number' ? body.max_tokens : 2048
      }),
      signal: AbortSignal.timeout(25000)
    });

    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Erro na ponte NVIDIA NIM.' });
  }
}