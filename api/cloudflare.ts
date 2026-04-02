export default async function handler(req: any, res: any) {
  // Configuração de Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Account-Id');

  // Lidar com preflight request (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { model, messages } = req.body;
    const authHeader = req.headers.authorization;
    const accountId = req.headers['x-account-id'];

    if (!authHeader || !accountId) {
      return res.status(401).json({ error: 'Credenciais ausentes' });
    }

    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `Erro Cloudflare: ${response.status} - ${errorText}` });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error: any) {
    console.error("Erro no proxy Cloudflare:", error);
    return res.status(500).json({ error: `Erro interno: ${error.message}` });
  }
}
