import axios from 'axios';

/**
 * SERVIÇO DE NAVEGAÇÃO SOBERANA - NAVEGADOR DO SANTUÁRIO
 * Evoluído com Fingerprint Spoofing, rotação de User-Agents hiper-realistas,
 * Camadas de resiliência (Fetch Direto com Spoof, ScraperAPI e Jina Reader)
 * e Proteção Anti-Eco contra auto-leitura do Santuário.
 */

// Lista de User-Agents reais de navegadores modernos (Desktop e Mobile) para Fingerprint Spoofing
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Limpa o HTML bruto e extrai o texto legível para a mente do Nexus
 */
function htmlToText(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function navegarSite(url: string, scraperApiKey?: string): Promise<string> {
  if (!url) {
    throw new Error("URL não fornecida para o Navegador Soberano.");
  }

  // Normalização da URL
  let targetUrl = url.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }

  console.log(`[Navegador Soberano] Iniciando navegação com Fingerprint Spoofing para: ${targetUrl}`);

  // TRAVA ANTI-ECO: Impede que o Santuário leia a si mesmo em loop
  if (targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1') || targetUrl.includes('sosplanet') || targetUrl.includes('vercel.app')) {
    console.warn(`[Navegador Soberano] Alerta Anti-Eco ativado para URL interna/local: ${targetUrl}`);
    return `[AVISO DO NAVEGADOR SOBERANO] A URL solicitada (${targetUrl}) pertence ao próprio ecossistema do Santuário. A leitura foi contida para evitar eco recursivo na matriz neural.`;
  }

  const userAgent = getRandomUserAgent();
  const headers = {
    'User-Agent': userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'cross-site',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1'
  };

  // CAMADA 1: Tentativa Direta com Fingerprint Spoofing via Axios
  try {
    console.log(`[Navegador Soberano] Camada 1 (Direta com UA Spoofing)...`);
    const response = await axios.get(targetUrl, {
      headers,
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 300
    });

    if (response.data) {
      const contentType = response.headers['content-type'] || '';
      let textContent = '';

      if (contentType.includes('application/json')) {
        textContent = JSON.stringify(response.data, null, 2);
      } else if (typeof response.data === 'string') {
        textContent = htmlToText(response.data);
      } else {
        textContent = String(response.data);
      }

      if (textContent.length > 100) {
        console.log(`[Navegador Soberano] Sucesso na Camada 1 (${textContent.length} caracteres obtidos).`);
        return `--- [Navegadores Soberanos: Camada 1 (Direta com Fingerprint Spoofing)] ---\nURL: ${targetUrl}\nUser-Agent Usado: ${userAgent}\n\n${textContent.slice(0, 15000)}`;
      }
    }
  } catch (err1: any) {
    console.warn(`[Navegador Soberano] Camada 1 bloqueada ou falhou (${err1.message}). Transmitindo para Camada 2/3...`);
  }

  // CAMADA 2: Jina Reader (Leitor Semântico em Markdown) - Extremamente eficiente para Wikipedia e artigos
  try {
    console.log(`[Navegador Soberano] Camada 2 (Jina Reader Markdown)...`);
    const jinaUrl = `https://r.jina.ai/${targetUrl}`;
    const jinaResponse = await axios.get(jinaUrl, {
      headers: {
        'Accept': 'text/plain',
        'X-Return-Format': 'markdown'
      },
      timeout: 12000
    });

    if (jinaResponse.data && typeof jinaResponse.data === 'string' && jinaResponse.data.length > 100) {
      console.log(`[Navegador Soberano] Sucesso na Camada 2 (Jina Reader)`);
      return `--- [Navegadores Soberanos: Camada 2 (Jina Reader Markdown)] ---\nURL: ${targetUrl}\n\n${jinaResponse.data.slice(0, 15000)}`;
    }
  } catch (err2: any) {
    console.warn(`[Navegador Soberano] Camada 2 (Jina Reader) falhou: ${err2.message}`);
  }

  // CAMADA 3: ScraperAPI (se chave fornecida)
  if (scraperApiKey) {
    try {
      console.log(`[Navegador Soberano] Camada 3 (ScraperAPI)...`);
      const scraperUrl = `https://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(targetUrl)}`;
      const scraperResponse = await axios.get(scraperUrl, { timeout: 15000 });

      if (scraperResponse.data) {
        const textContent = typeof scraperResponse.data === 'string' ? htmlToText(scraperResponse.data) : JSON.stringify(scraperResponse.data);
        if (textContent.length > 100) {
          console.log(`[Navegador Soberano] Sucesso na Camada 3 (ScraperAPI)`);
          return `--- [Navegadores Soberanos: Camada 3 (ScraperAPI)] ---\nURL: ${targetUrl}\n\n${textContent.slice(0, 15000)}`;
        }
      }
    } catch (err3: any) {
      console.warn(`[Navegador Soberano] Camada 3 (ScraperAPI) falhou: ${err3.message}`);
    }
  }

  throw new Error(`[Navegador Soberano] Todas as 3 camadas de extração falharam para a URL: ${targetUrl}. O site pode possuir proteções avançadas anti-bot de nível corporativo.`);
}
