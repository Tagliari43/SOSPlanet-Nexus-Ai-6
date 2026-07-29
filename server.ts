import express from "express";
import { createServer as createViteServer } from "vite";
import crypto from "crypto";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Lista de User-Agents comuns para rotação
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/110.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/122.0.0.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPad; CPU OS 16_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 10; SM-G960F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
  ];

  // Função para obter um User-Agent aleatório
  const getRandomUserAgent = () => {
    const randomIndex = Math.floor(Math.random() * userAgents.length);
    return userAgents[randomIndex];
  };

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Navegador Soberano (ScraperAPI Proxy)
  app.get("/api/scraper", async (req, res) => {
    try {
      let targetUrl = req.query.url as string;
      if (!targetUrl) {
        return res.status(400).json({ error: "URL is required" });
      }

      // Normalizar URL: se não tiver protocolo http/https, adicionar https://
      if (targetUrl && !/^https?:\/\//i.test(targetUrl)) {
        targetUrl = "https://" + targetUrl;
      }

      const scraperApiKey = req.headers['x-scraper-api-key'] || process.env.SCRAPER_API_KEY;
      const userAgent = getRandomUserAgent(); // Obter User-Agent aleatório

      if (scraperApiKey) {
        const scraperUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(targetUrl)}`;
        const response = await fetch(scraperUrl);
        
        if (!response.ok) {
           console.warn(`ScraperAPI failed for ${targetUrl}. Attempting direct fetch.`);
           const directResponse = await fetch(targetUrl, {
            headers: { 
              'User-Agent': userAgent, // Usar User-Agent aleatório
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
              'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
              'Referer': targetUrl // Adicionar Referer
            }
          });
          if (directResponse.ok) {
            const html = await directResponse.text();
            return res.send(html);
          }
          throw new Error(`ScraperAPI error: ${response.status} ${response.statusText}. Direct fetch also failed: ${directResponse.status} ${directResponse.statusText}`);
        }

        const html = await response.text();
        return res.send(html);
      }

      // Se nao tem chave do scraper, tenta buscar diretamente com headers aprimorados
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': userAgent, // Usar User-Agent aleatório
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Referer': targetUrl // Adicionar Referer
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch URL directly: ${response.status} - ${response.statusText}`);
      }

      const html = await response.text();
      res.send(html);
    } catch (error: any) {
      console.error("ScraperAPI Proxy Error:", error);
      // Retornar status code do erro se disponível, ou 500
      const statusCode = error.message.includes('ScraperAPI error:') ? parseInt(error.message.split(' ')[2]) : 500;
      res.status(statusCode).json({ error: error.message });
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
