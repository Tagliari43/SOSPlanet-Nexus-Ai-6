import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: "URL is required" });
    }

    // --- Aprimoramento do Navegador Soberano: Integração de Navegador Headless e Proxies ---
    // A próxima fase para o Navegador Soberano envolve a integração de uma solução de navegador headless
    // (como Puppeteer ou Playwright) para renderizar páginas dinâmicas, executar JavaScript e
    // simular comportamento humano de forma mais robusta. Isso é crucial para superar
    // defesas anti-bot sofisticadas, firewalls e restrições de rede.
    //
    // Para isso, as bibliotecas (ex: puppeteer) precisarão ser adicionadas ao package.json e instaladas.
    //
    // Exemplo conceitual de como a lógica de um navegador headless se pareceria:
    /*
    import puppeteer from 'puppeteer'; // Necessário instalar: npm install puppeteer

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // Requerido em alguns ambientes
      // headless: true // Ou 'new' para o novo modo headless
    });
    const page = await browser.newPage();

    // Integração conceitual de lógica de Proxy:
    // if (proxyConfig.enabled) {
    //   await page.authenticate({ username: proxyConfig.user, password: proxyConfig.password });
    //   await page.setExtraHTTPHeaders({'Proxy-Authorization': `Basic ${btoa(`${proxyConfig.user}:${proxyConfig.password}`)}`});
    // }

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }); // Espera o DOM carregar, com timeout
    const html = await page.content();
    await browser.close();
    return res.send(html);
    */

    // Por enquanto, continuaremos com o fetch direto, mas com um User-Agent e headers ainda mais robustos.
    // O ScraperAPI foi removido como dependência primária para dar lugar a uma solução mais soberana e direta.

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36', // User-Agent atualizado
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': targetUrl, // Adiciona o Referer para simular navegação
        'Connection': 'keep-alive', // Mantém a conexão ativa
        'Upgrade-Insecure-Requests': '1', // Sugere ao servidor que prefere HTTPS
        'Cache-Control': 'max-age=0' // Evita cache, sempre busca novo conteúdo
      },
      signal: AbortSignal.timeout(15000) // Adiciona um timeout de 15 segundos à requisição
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Falha ao acessar URL diretamente: ${response.statusText}. Código: ${response.status}` });
    }

    const html = await response.text();
    res.send(html);
  } catch (error: any) {
    console.error("Erro no Navegador Soberano:", error);
    // Adiciona uma mensagem mais amigável para timeouts
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return res.status(504).json({ error: "O Navegador Soberano excedeu o tempo limite ao tentar acessar a URL. A página pode estar muito lenta ou inacessível." });
    }
    res.status(500).json({ error: error.message });
  }
}