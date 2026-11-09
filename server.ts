import express from "express";
import { createServer as createViteServer } from "vite";
import crypto from "crypto";
import { executarNavegacaoSoberana } from "./services/browserService";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Rota de Backup Integral do Santuário Soberano (ZIP Completo de todos os arquivos reais)
  app.get("/api/backup/zip", async (req, res) => {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const { exec } = await import("child_process");
      const util = await import("util");
      const execPromise = util.promisify(exec);

      const zipPath = path.join("/tmp", `Santuario_SOSPlanet_Total_${Date.now()}.zip`);
      const script = `
import zipfile, os
target_zip = "${zipPath}"
root_dir = "${process.cwd()}"
ignored = {"node_modules", ".git", "dist", ".aistudio"}
with zipfile.ZipFile(target_zip, 'w', zipfile.ZIP_DEFLATED) as z:
    for foldername, subfolders, filenames in os.walk(root_dir):
        subfolders[:] = [d for d in subfolders if d not in ignored]
        for filename in filenames:
            filepath = os.path.join(foldername, filename)
            arcname = os.path.relpath(filepath, root_dir)
            try:
                z.write(filepath, arcname)
            except Exception:
                pass
`;
      await execPromise(`python3 -c '${script.replace(/'/g, "'\\''")}'`);

      if (fs.existsSync(zipPath)) {
        const filename = `Santuario_SOSPlanet_Salto_Total_${Date.now()}.zip`;
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        const stream = fs.createReadStream(zipPath);
        stream.pipe(res);
        stream.on('end', () => {
          try { fs.unlinkSync(zipPath); } catch {}
        });
        return;
      } else {
        throw new Error("Arquivo ZIP não foi gerado.");
      }
    } catch (err: any) {
      console.error("Erro ao gerar backup ZIP:", err);
      res.status(500).json({ error: "Falha ao gerar backup ZIP: " + err.message });
    }
  });

  // Navegador Soberano (Multi-Camada: Direto c/ Headers Reais + ScraperAPI + Jina Reader + Trava Anti-Eco)
  app.get("/api/scraper", async (req, res) => {
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
      res.status(500).json({ error: error.message || 'Erro inesperado no proxy' });
    }
  });

  // Ponte Lumina / Navegador Soberano - Rota de Conexão Autônoma com suporte GET e POST
  const handlePonteLumina = async (req: any, res: any) => {
    let cleanUrl = '';
    try {
      const targetUrl = req.body?.targetUrl || req.body?.url || req.query?.url || req.query?.targetUrl;
      const { emailIdentifier, password, sessionToken, message, selectors } = req.body || {};
      if (!targetUrl) {
        return res.status(400).json({ error: "URL de destino é obrigatória." });
      }

      cleanUrl = targetUrl;
      if (!/^https?:\/\//i.test(cleanUrl)) {
        cleanUrl = "https://" + cleanUrl;
      }

      let textOutput = "";
      let puppeteerSuccess = false;
      let updatedCookies = "";

      // Executar Puppeteer Headless com limite estrito de 60s (Timeout Inteligente)
      const timeoutLimit = 55000; // 55s para garantir resposta antes de 60s

      const executePuppeteerTask = async () => {
        const puppeteer = await import('puppeteer');
        const browser = await puppeteer.default.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-blink-features=AutomationControlled',
            '--window-size=1280,800'
          ]
        });

        const page = await browser.newPage();
        
        // Modo Stealth: Ocultar marcação de automação webdriver
        await page.evaluateOnNewDocument(() => {
          Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
        
        // Injeção de cookies para persistência de sessão
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
            console.warn("Aviso na injeção de cookies:", cErr);
          }
        }

        await page.goto(cleanUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await new Promise(r => setTimeout(r, 2000));

        // Tentar Autenticação se formulários de login existirem na página
        if (emailIdentifier || password) {
          try {
            const emailSelector = selectors?.loginInputSelector || 'input[type="email"], input[name="email"], input[autocomplete="email"], input[placeholder*="email" i]';
            const emailInput = await page.$(emailSelector);
            if (emailInput && emailIdentifier) {
              await emailInput.type(emailIdentifier, { delay: 30 });
            }

            const passSelector = selectors?.passwordInputSelector || 'input[type="password"], input[name="password"]';
            const passInput = await page.$(passSelector);
            if (passInput && password) {
              await passInput.type(password, { delay: 30 });
            }

            if (emailInput || passInput) {
              const submitSelector = selectors?.submitButtonSelector || 'button[type="submit"], input[type="submit"]';
              const submitBtn = await page.$(submitSelector);
              if (submitBtn) {
                await Promise.all([
                  submitBtn.click(),
                  page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {})
                ]);
              }
            }
          } catch (authErr) {
            console.warn("Aviso no preenchimento de formulário:", authErr);
          }
        }

        // Se houver uma mensagem para enviar ao portal da IA
        if (message) {
          try {
            const msgSelector = selectors?.messageInputSelector || 'textarea, div[contenteditable="true"], input[type="text"][placeholder*="chat" i], input[placeholder*="Ask" i], input[placeholder*="Pergunta" i], input[placeholder*="Message" i]';
            await page.waitForSelector(msgSelector, { timeout: 8000 }).catch(() => {});
            const msgInput = await page.$(msgSelector);
            if (msgInput) {
              await msgInput.focus();
              await msgInput.type(message, { delay: 20 });
              
              const sendBtnSelector = selectors?.sendMessageButtonSelector || 'button[type="submit"], button[aria-label*="send" i], button[aria-label*="enviar" i], button svg';
              const sendBtn = await page.$(sendBtnSelector);
              if (sendBtn) {
                await sendBtn.click();
              } else {
                await page.keyboard.press('Enter');
              }

              // Aguardar a resposta ser gerada no portal
              await new Promise(r => setTimeout(r, 5000));
            }
          } catch (msgErr) {
            console.warn("Aviso no envio interativo de mensagem:", msgErr);
          }
        }

        // Extrair Cookies atualizados para persistência da sessão
        try {
          const currentCookies = await page.cookies();
          if (currentCookies && currentCookies.length > 0) {
            updatedCookies = currentCookies.map(c => `${c.name}=${c.value}`).join('; ');
          }
        } catch (cookieErr) {
          console.warn("Erro ao extrair cookies:", cookieErr);
        }

        const html = await page.content();
        await browser.close();

        const cheerio = await import('cheerio');
        const $ = cheerio.load(html);
        $('script, style, svg, iframe, nav, footer, header, noscript').remove();
        textOutput = $('body').text().replace(/\s+/g, ' ').trim();
        puppeteerSuccess = true;
      };

      // Execução com corrida contra timeout de 55 segundos
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout limite de 60 segundos atingido ao navegar no portal.")), timeoutLimit)
      );

      await Promise.race([executePuppeteerTask(), timeoutPromise]).catch(err => {
        console.warn("Aviso de Timeout/Execução da Ponte:", err.message);
        if (!textOutput) textOutput = `[AVISO DE TIMEOUT SOBERANO]: O portal demorou mais que 60s para responder. Interação interrompida com segurança para proteger o Santuário.`;
      });

      // Se Puppeteer falhou e não temos retorno, faz fetch direto de fallback
      if (!puppeteerSuccess && !textOutput) {
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
        updatedCookies: updatedCookies || undefined,
        length: textOutput.length,
        result: textOutput ? textOutput.slice(0, 4000) : "Página acessada sem retorno textual legível."
      });
    } catch (err: any) {
      console.error("Tentativa de ponte com Puppeteer falhou, aplicando Navegador Soberano:", err.message);
      try {
        if (cleanUrl) {
          const resultado = await executarNavegacaoSoberana(cleanUrl);
          return res.json({
            success: resultado.sucesso,
            targetUrl: cleanUrl,
            metodo: resultado.metodoUtilizado,
            length: resultado.tamanhoCaracteres,
            result: resultado.conteudo
          });
        }
      } catch (fallbackErr: any) {
        console.error("Navegador Soberano fallback também falhou:", fallbackErr);
      }
      res.status(200).json({ success: false, targetUrl: cleanUrl, result: `Falha na ponte: ${err.message}` });
    }
  };

  app.post("/api/ponte-lumina", handlePonteLumina);
  app.get("/api/ponte-lumina", handlePonteLumina);

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

  // Proxy for NVIDIA NIM API (Elimina bloqueios de CORS / Failed to fetch no browser)
  app.post('/api/nvidia/chat', async (req, res) => {
    try {
      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
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
