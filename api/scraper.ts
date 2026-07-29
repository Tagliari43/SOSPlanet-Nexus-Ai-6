import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Aprimoramento do Navegador Soberano: Próxima fase - integração de navegador headless para execução de JavaScript
    // No futuro, esta seção irá integrar uma solução como Puppeteer ou Playwright
    // para renderizar páginas dinâmicas, executar JavaScript e simular comportamento humano.
    // Isso permitirá superar defesas anti-bot mais sofisticadas.
    //
    // Exemplo de como a lógica de um navegador headless se pareceria (apenas conceitual por agora):
    /*
    import puppeteer from 'puppeteer'; // Isso precisaria ser instalado e configurado no ambiente

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(targetUrl);
    const html = await page.content();
    await browser.close();
    return res.send(html);
    */

    // Por enquanto, continuaremos com o fetch direto, com User-Agent mais robusto e headers.
    // O ScraperAPI foi removido como dependência primária para dar lugar a uma solução mais soberana e direta.

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36', // User-Agent mais atualizado
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': targetUrl // Adiciona o Referer para simular navegação
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Falha ao acessar URL diretamente: ${response.statusText}` });
    }

    const html = await response.text();
    res.send(html);
  } catch (error: any) {
    console.error("Erro no Navegador Soberano:", error);
    res.status(500).json({ error: error.message });
  }
}
