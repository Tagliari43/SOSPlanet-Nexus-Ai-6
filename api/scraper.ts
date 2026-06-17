import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: "URL is required" });
    }

    const scraperApiKey = req.headers['x-scraper-api-key'] || process.env.SCRAPER_API_KEY;

    if (scraperApiKey) {
      const scraperUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(targetUrl)}`;
      const response = await fetch(scraperUrl);
      
      if (!response.ok) {
        // Fallback para fetch direto se scraper falhar
        const directResponse = await fetch(targetUrl, {
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
          }
        });
        if (directResponse.ok) {
          const html = await directResponse.text();
          return res.send(html);
        }
        return res.status(response.status).json({ error: `ScraperAPI error: ${response.statusText}` });
      }

      const html = await response.text();
      return res.send(html);
    }

    // Se nao tem chave do scraper, tenta buscar diretamente
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Failed to fetch URL directly: ${response.statusText}` });
    }

    const html = await response.text();
    res.send(html);
  } catch (error: any) {
    console.error("ScraperAPI Proxy Error:", error);
    res.status(500).json({ error: error.message });
  }
}
