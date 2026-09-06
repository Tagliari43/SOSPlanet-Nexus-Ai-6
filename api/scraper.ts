import type { VercelRequest, VercelResponse } from '@vercel/node';
import { executarNavegacaoSoberana } from '../services/browserService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: "URL is required" });
    }

    const scraperApiKey = (req.headers['x-scraper-api-key'] as string) || process.env.SCRAPER_API_KEY || '';

    const resultado = await executarNavegacaoSoberana(targetUrl, scraperApiKey);

    if (!resultado.sucesso) {
      return res.status(422).json({
        error: resultado.conteudo,
        metodo: resultado.metodoUtilizado,
        aviso: resultado.aviso
      });
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('X-Metodo-Navegacao', resultado.metodoUtilizado);
    return res.status(200).send(resultado.conteudo);
  } catch (error: any) {
    console.error("ScraperAPI Proxy Error:", error);
    res.status(500).json({ error: error.message || 'Erro inesperado no servidor de navegação' });
  }
}

