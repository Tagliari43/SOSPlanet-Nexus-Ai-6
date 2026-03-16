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

  // Proxy for Cloudflare API (Local dev)
  app.use('/v1/proxy/api.cloudflare.com', async (req, res) => {
    try {
      const targetUrl = `https://api.cloudflare.com${req.url}`;
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

  // Proxy for Cloudflare API (Production / AI Studio Nginx stripped path)
  app.use('/client/v4/accounts', async (req, res) => {
    try {
      const targetUrl = `https://api.cloudflare.com/client/v4/accounts${req.url}`;
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

  // Proxy for HuggingFace API (Local dev)
  app.use('/v1/proxy/router.huggingface.co', async (req, res) => {
    try {
      const targetUrl = `https://router.huggingface.co${req.url}`;
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          'Authorization': req.headers.authorization || '',
          'Content-Type': req.headers['content-type'] || 'application/json',
          'x-wait-for-model': 'true'
        },
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body)
      });
      
      const data = await response.text();
      res.status(response.status).send(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Proxy for HuggingFace API (Production / AI Studio Nginx stripped path)
  app.use('/hf-inference/models', async (req, res) => {
    try {
      const targetUrl = `https://router.huggingface.co/hf-inference/models${req.url}`;
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          'Authorization': req.headers.authorization || '',
          'Content-Type': req.headers['content-type'] || 'application/json',
          'x-wait-for-model': 'true'
        },
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body)
      });
      
      const data = await response.text();
      res.status(response.status).send(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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
