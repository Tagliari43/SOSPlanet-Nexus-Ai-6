import express from "express";
import { createServer as createViteServer } from "vite";
import crypto from "crypto";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Navegador Soberano (Puppeteer + ScraperAPI + Headers Fallback Proxy)
  app.get("/api/scraper", async (req, res) => {
    try {
      let targetUrl = req.query.url as string;
      const cleanOnly = req.query.clean === 'true';
      if (!targetUrl) {
        return res.status(400).json({ error: "URL is required" });
      }

      // Normalizar URL: se não tiver protocolo http/https, adicionar https://
      if (targetUrl && !/^https?:\/\//i.test(targetUrl)) {
        targetUrl = "https://" + targetUrl;
      }

      let html = "";
      let puppeteerSuccess = false;

      // 1. Tentar Puppeteer Headless Browser
      try {
        const puppeteer = await import('puppeteer');
        const browser = await puppeteer.default.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1280,800'
          ]
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
        });
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        html = await page.content();
        await browser.close();
        puppeteerSuccess = true;
      } catch (puppeteerErr: any) {
        console.warn("Puppeteer não pôde renderizar a URL, usando fallbacks:", puppeteerErr?.message || puppeteerErr);
      }

      // 2. Se Puppeteer falhar, tentar ScraperAPI se chave estiver disponível
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
            console.warn("ScraperAPI fallback error:", e);
          }
        }
      }

      // 3. Se ainda não temos HTML, buscar via fetch direto com headers avançados de navegador
      if (!html) {
        const directResponse = await fetch(targetUrl, {
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        if (directResponse.ok) {
          html = await directResponse.text();
        } else {
          return res.status(directResponse.status).json({ error: `Falha ao acessar URL diretamente: ${directResponse.statusText}` });
        }
      }

      // Se o cliente pediu apenas texto limpo ou se usarmos cheerio para limpar tags
      if (cleanOnly && html) {
        try {
          const cheerio = await import('cheerio');
          const $ = cheerio.load(html);
          $('script, style, svg, iframe, nav, footer, header, noscript').remove();
          const cleanText = $('body').text().replace(/\s+/g, ' ').trim();
          return res.type('text/plain').send(cleanText);
        } catch (cErr) {
          // Se cheerio falhar, manda html bruto
        }
      }

      return res.send(html);
    } catch (error: any) {
      console.error("ScraperAPI Proxy Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Ponte Lumina - Rota de Conexão Autônoma com Puppeteer Headless
  app.post("/api/ponte-lumina", async (req, res) => {
    try {
      const { targetUrl, emailIdentifier, sessionToken, message } = req.body;
      if (!targetUrl) {
        return res.status(400).json({ error: "URL de destino é obrigatória." });
      }

      let cleanUrl = targetUrl;
      if (!/^https?:\/\//i.test(cleanUrl)) {
        cleanUrl = "https://" + cleanUrl;
      }

      let textOutput = "";
      let puppeteerSuccess = false;

      // Executar Puppeteer Headless para navegação profunda
      try {
        const puppeteer = await import('puppeteer');
        const browser = await puppeteer.default.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--window-size=1280,800'
          ]
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
        
        // Se houver token de sessão/cookie fornecido nas credenciais, injetar se for no formato cookie
        if (sessionToken && sessionToken.includes('=')) {
          try {
            const parts = sessionToken.split(';').map((p: string) => p.trim());
            const cookiesToSet = parts.map((part: string) => {
              const eqIdx = part.indexOf('=');
              if (eqIdx > 0) {
                return {
                  name: part.substring(0, eqIdx),
                  value: part.substring(eqIdx + 1),
                  domain: new URL(cleanUrl).hostname
                };
              }
              return null;
            }).filter(Boolean);

            if (cookiesToSet.length > 0) {
              await page.setCookie(...(cookiesToSet as any));
            }
          } catch (cErr) {
            console.warn("Cookie parse warning:", cErr);
          }
        }

        await page.goto(cleanUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
        
        // Aguarda renderização inicial do conteúdo
        await new Promise(r => setTimeout(r, 2000));

        const html = await page.content();
        await browser.close();

        // Extrai texto limpo usando cheerio
        const cheerio = await import('cheerio');
        const $ = cheerio.load(html);
        $('script, style, svg, iframe, nav, footer, header, noscript').remove();
        textOutput = $('body').text().replace(/\s+/g, ' ').trim();
        puppeteerSuccess = true;
      } catch (pErr: any) {
        console.warn("Ponte Lumina Puppeteer warning:", pErr.message);
      }

      // Se Puppeteer falhou ou retornou vazio, tenta fetch com headers avançados
      if (!puppeteerSuccess || !textOutput) {
        const directResponse = await fetch(cleanUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
          }
        });

        if (directResponse.ok) {
          const rawHtml = await directResponse.text();
          const cheerio = await import('cheerio');
          const $ = cheerio.load(rawHtml);
          $('script, style, svg, iframe, nav, footer, header, noscript').remove();
          textOutput = $('body').text().replace(/\s+/g, ' ').trim();
        }
      }

      return res.json({
        success: true,
        targetUrl: cleanUrl,
        length: textOutput.length,
        result: textOutput ? textOutput.slice(0, 3000) : "Página acessada sem retorno textual legível."
      });
    } catch (err: any) {
      console.error("Erro na rota /api/ponte-lumina:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Binance Proxy Route (Para o ambiente de desenvolvimento local / AI Studio)
  app.post("/api/binance/balance", async (req, res) => {
    try {
      const { apiKey, apiSecret } = req.body;

      if (!apiKey || !apiSecret) {
        return res.status(400).json({ error: "API Key and Secret are required" });
      }

      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      
      const signature = crypto
        .createHmac("sha256", apiSecret)
        .update(queryString)
        .digest("hex");

      const fullQuery = `${queryString}&signature=${signature}`;

      const response = await fetch(`https://api.binance.com/api/v3/account?${fullQuery}`, {
        method: "GET",
        headers: {
          "X-MBX-APIKEY": apiKey,
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Binance API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Binance Proxy Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Proxy for Groq API (Local dev / AI Studio)
  app.use('/v1/proxy/api.groq.com', async (req, res) => {
    try {
      const targetUrl = `https://api.groq.com${req.url}`;
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          'Authorization': req.headers.authorization || '',
          'Content-Type': req.headers['content-type'] || 'application/json',
        },
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body)
      });
      
      const data = await response.text();
      res.status(response.status).send(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Proxy for Ollama Cloud API (Fenix - MiniMax)
  app.post('/api/ollama/chat', async (req, res) => {
    try {
      // O endpoint oficial da Ollama na nuvem para chat completions
      const targetUrl = 'https://api.ollama.com/v1/chat/completions';
      
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Authorization': req.headers.authorization || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body)
      });
      
      const data = await response.text();
      res.status(response.status).send(data);
    } catch (error: any) {
      console.error("Ollama Proxy Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Portal State Management
  app.get("/api/portal-state", async (req, res) => {
    try {
      const fs = await import("fs/promises");
      const data = await fs.readFile("portalState.json", "utf-8");
      res.json(JSON.parse(data));
    } catch(e) {
      res.json({ error: "State not found" });
    }
  });

  app.post("/api/portal-state", async (req, res) => {
    try {
      const fs = await import("fs/promises");
      await fs.writeFile("portalState.json", JSON.stringify(req.body, null, 2));
      res.json({ success: true, state: req.body });
    } catch(e) {
      res.status(500).json({ error: "Failed to save state" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
