import type { VercelRequest, VercelResponse } from '@vercel/node';
import { executarNavegacaoSoberana } from '../services/browserService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configuração de CORS permissivo para chamadas de dentro do ecossistema
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-scraper-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const targetUrl = (req.body?.targetUrl || req.body?.url || req.query.url || req.query.targetUrl) as string;
    if (!targetUrl) {
      return res.status(400).json({ error: "URL de destino é obrigatória." });
    }

    const scraperApiKey = (req.headers['x-scraper-api-key'] as string) || process.env.SCRAPER_API_KEY || '';
    const resultado = await executarNavegacaoSoberana(targetUrl, scraperApiKey);

    return res.status(200).json({
      success: resultado.sucesso,
      targetUrl: targetUrl,
      metodo: resultado.metodoUtilizado,
      length: resultado.tamanhoCaracteres,
      result: resultado.conteudo
    });
  } catch (error: any) {
    console.error("Erro na rota /api/ponte-lumina:", error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro inesperado na ponte de navegação'
    });
  }
}
