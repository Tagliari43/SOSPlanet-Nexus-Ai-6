import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    let targetUrl = req.query.url as string;
    const cleanOnly = req.query.clean === 'true';
    if (!targetUrl) {
      return res.status(400).json({ error: "URL is required" });
    }

    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = "https://" + targetUrl;
    }

    let html = "";
    let puppeteerSuccess = false;

    // 1. Tentar Puppeteer se ambiente suportar
    try {
      const puppeteer = await import('puppeteer');
      const browser = await puppeteer.default.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      html = await page.content();
      await browser.close();
      puppeteerSuccess = true;
    } catch (e) {
      // Fallback normal
    }

    // 2. Se Puppeteer falhar, tentar ScraperAPI
    if (!puppeteerSuccess) {
      const scraperApiKey = req.headers['x-scraper-api-key'] || process.env.SCRAPER_API_KEY;

      if (scraperApiKey) {
        try {
          const scraperUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(targetUrl)}`;
          const response = await fetch(scraperUrl);
          if (response.ok) {
            html = await response.text();
          }
        } catch (e) {
          // Fallback
        }
      }
    }

    // 3. Fallback para fetch direto com headers reais de navegador
    if (!html) {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: `Failed to fetch URL directly: ${response.statusText}` });
      }

      html = await response.text();
    }

    if (cleanOnly && html) {
      try {
        const cheerio = await import('cheerio');
        const $ = cheerio.load(html);
        $('script, style, svg, iframe, nav, footer, header, noscript').remove();
        const cleanText = $('body').text().replace(/\s+/g, ' ').trim();
        return res.status(200).send(cleanText);
      } catch (e) {
        // Fallback para html
      }
    }

    res.status(200).send(html);
  } catch (error: any) {
    console.error("ScraperAPI Proxy Error:", error);
    res.status(500).json({ error: error.message });
  }
}
