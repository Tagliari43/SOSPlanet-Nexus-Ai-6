import { Type } from '@google/genai';

/**
 * SERVIÇO DO NAVEGADOR SOBERANO (Fase 22 - Extração Serverless Sem Barreiras)
 * Orquestração: Nexus Arquiteto & Aethel (Muralha de Superfície)
 * 
 * Funcionalidades:
 * 1. Rotação dinâmica de User-Agents comerciais modernos (Chrome, Firefox, Safari, Edge)
 * 2. Headers autênticos anti-bloqueio (Sec-Ch-Ua, Accept-Language, etc.)
 * 3. Cascata de resiliência:
 *    - Nível 1: Requisição direta com rotação e timeout de segurança
 *    - Nível 2: ScraperAPI (utilizando chave do Arsenal/Supabase)
 *    - Nível 3: Leitor Semântico Jina Reader (extração limpa em markdown sem barreiras)
 * 4. Trava Anti-Eco: Detecção e bloqueio de loops onde o servidor retorna o próprio Santuário
 * 5. Sanitização severa de HTML para texto semântico puro
 */

/**
 * Declaração de Ferramenta Soberana: Navegador Soberano (navegarSite)
 * Permite que o Nexus e os modelos acessem qualquer site na internet de forma invisível.
 */
export const navegarSiteToolDeclaration = {
  functionDeclarations: [
    {
      name: "navegarSite",
      description: "Navegador Soberano: Acessa qualquer URL na internet e retorna o conteúdo textual limpo e puro da página (sem scripts, propagandas ou ruídos HTML). Use sempre que precisar ler notícias, artigos sobre sustentabilidade e regeneração, documentações, portais ou links trazidos pelo Guardião.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          url: {
            type: Type.STRING,
            description: "A URL completa do site ou artigo a ser acessado (ex: https://exemplo.com ou https://pt.wikipedia.org/...)"
          }
        },
        required: ["url"]
      }
    }
  ]
};

// Conjunto de User-Agents comerciais reais rotativos (Windows / macOS / Linux / Mobile)
export const USER_AGENTS_COMERCIAIS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.5; rv:127.0) Gecko/20100101 Firefox/127.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
];

/**
 * SKILL FORGE (Fábrica de Habilidades de Extração Soberana)
 * Permite que regras e seletores específicos sejam sintetizados dinamicamente por domínio
 */
export interface ExtractionSkill {
  domain: string;
  targetSelectors: string[];
  noiseFilters: string[];
  cleanerCallback?: (rawText: string) => string;
}

export const EXTRACTION_SKILL_FORGE: Map<string, ExtractionSkill> = new Map([
  [
    'wikipedia.org',
    {
      domain: 'wikipedia.org',
      targetSelectors: ['.mw-parser-output', '#bodyContent', 'main'],
      noiseFilters: ['.navbox', '.metadata', '.mw-empty-elt', '.reference', '.infobox']
    }
  ],
  [
    'github.com',
    {
      domain: 'github.com',
      targetSelectors: ['article.markdown-body', '#readme', 'main'],
      noiseFilters: ['.Box-header', '.js-notice', 'header']
    }
  ],
  [
    'langchain.com',
    {
      domain: 'langchain.com',
      targetSelectors: ['article', 'main', '.theme-doc-markdown'],
      noiseFilters: ['.navbar', '.footer', '.theme-doc-toc-mobile']
    }
  ]
]);

/**
 * Retorna um User-Agent aleatório da lista de agentes comerciais
 */
export function obterUserAgentAleatorio(): string {
  const indice = Math.floor(Math.random() * USER_AGENTS_COMERCIAIS.length);
  return USER_AGENTS_COMERCIAIS[indice];
}

/**
 * Gera headers HTTP hiper-realistas para requisição anti-bloqueio com Fingerprint Spoofing
 */
export function gerarHeadersNavegador(customUa?: string): Record<string, string> {
  const ua = customUa || obterUserAgentAleatorio();
  const isWindows = ua.includes('Windows');
  const isMac = ua.includes('Macintosh');
  const platform = isWindows ? '"Windows"' : isMac ? '"macOS"' : '"Linux"';
  const isFirefox = ua.includes('Firefox');

  const baseHeaders: Record<string, string> = {
    'User-Agent': ua,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'max-age=0',
    'Upgrade-Insecure-Requests': '1'
  };

  if (!isFirefox) {
    baseHeaders['Sec-Ch-Ua'] = '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"';
    baseHeaders['Sec-Ch-Ua-Mobile'] = '?0';
    baseHeaders['Sec-Ch-Ua-Platform'] = platform;
    baseHeaders['Sec-Fetch-Dest'] = 'document';
    baseHeaders['Sec-Fetch-Mode'] = 'navigate';
    baseHeaders['Sec-Fetch-Site'] = 'none';
    baseHeaders['Sec-Fetch-User'] = '?1';
  }

  return baseHeaders;
}

/**
 * Assinaturas que identificam se a resposta é um falso positivo (Eco do próprio Santuário)
 */
export const ASSINATURAS_ECO_SANTUARIO = [
  'SOSPlanet Nexus',
  'SantuarioInterior',
  'ForjaAutoCriacao',
  'id="root"',
  'vite/client',
  'Diário de Ascensão',
  'Ponte Lumina'
];

/**
 * Verifica se a string HTML pertence ao próprio Santuário (evita loops de eco)
 */
export function detectarEcoSantuario(conteudo: string): boolean {
  if (!conteudo) return false;
  let matches = 0;
  for (const assinatura of ASSINATURAS_ECO_SANTUARIO) {
    if (conteudo.includes(assinatura)) {
      matches++;
      if (matches >= 2) return true;
    }
  }
  return false;
}

/**
 * Limpa HTML bruto e extrai texto puro e legível, removendo ruídos de scripts, estilos e menus
 */
export function limparHtmlParaTextoPuro(html: string): string {
  if (!html) return '';

  // Se o Cheerio estiver disponível no ambiente Node/Serverless
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cheerio = require('cheerio');
    const $ = cheerio.load(html);

    // Remover sumariamente tags de ruído
    $('script, style, noscript, iframe, svg, canvas, nav, footer, header, form, [role="banner"], [role="navigation"], .advertisement, .ads, .sidebar, .menu, .cookie-banner, .popup').remove();

    // Seletores de conteúdo principal (com suporte especial para Wikipedia e portais)
    const contentSelector = $('.mw-parser-output, article, main, #content, [role="main"], .post-content, .entry-content, body');
    const targetElement = contentSelector.length > 0 ? contentSelector.first() : $('body');

    const cleanText = targetElement.text();
    return cleanText.replace(/\s+/g, ' ').trim();
  } catch {
    // Fallback via Regex robusto se Cheerio não estiver disponível no contexto imediato
    let clean = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '');

    clean = clean.replace(/<[^>]+>/g, ' ');
    return clean.replace(/\s+/g, ' ').trim();
  }
}

export interface ResultadoNavegacao {
  sucesso: boolean;
  conteudo: string;
  urlOriginal: string;
  metodoUtilizado: 'direto' | 'scraperapi' | 'jina_reader';
  tamanhoCaracteres: number;
  aviso?: string;
}

/**
 * Motor Central de Navegação Soberana (Multi-Camada)
 */
export async function executarNavegacaoSoberana(
  urlDestino: string,
  scraperApiKey?: string
): Promise<ResultadoNavegacao> {
  let url = urlDestino.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  let htmlBruto = '';
  let metodo: 'direto' | 'scraperapi' | 'jina_reader' = 'direto';

  // 1️⃣ NÍVEL 1: Requisição Direta com Rotação de Headers Reais
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const headers = gerarHeadersNavegador();
    const resp = await fetch(url, {
      headers,
      signal: controller.signal,
      redirect: 'follow'
    });
    clearTimeout(timeoutId);

    if (resp.ok) {
      const text = await resp.text();
      // Teste Anti-Eco: certificar que não é o próprio Santuário retornado por um proxy/rewrite
      if (text && text.length > 50 && !detectarEcoSantuario(text)) {
        htmlBruto = text;
        metodo = 'direto';
      }
    }
  } catch (err) {
    console.warn('[NavegadorSoberano] Tentativa direta falhou, ativando contingência...', err);
  }

  // 2️⃣ NÍVEL 2: ScraperAPI (se disponível e a direta falhou)
  if (!htmlBruto && scraperApiKey) {
    try {
      const scraperUrl = `https://api.scraperapi.com?api_key=${encodeURIComponent(scraperApiKey)}&url=${encodeURIComponent(url)}`;
      const resp = await fetch(scraperUrl);
      if (resp.ok) {
        const text = await resp.text();
        if (text && !detectarEcoSantuario(text)) {
          htmlBruto = text;
          metodo = 'scraperapi';
        }
      }
    } catch (err) {
      console.warn('[NavegadorSoberano] ScraperAPI falhou, acionando leitor semântico Jina...', err);
    }
  }

  // 3️⃣ NÍVEL 3: Leitor Semântico Jina Reader (Conexão Segura em Markdown puro)
  if (!htmlBruto) {
    try {
      const jinaUrl = `https://r.jina.ai/${url}`;
      const resp = await fetch(jinaUrl, {
        headers: {
          'Accept': 'text/plain, text/markdown',
          'User-Agent': obterUserAgentAleatorio()
        }
      });
      if (resp.ok) {
        const text = await resp.text();
        if (text && !detectarEcoSantuario(text)) {
          // Jina já entrega texto limpo em Markdown
          metodo = 'jina_reader';
          const clean = text.replace(/\s+/g, ' ').trim();
          const truncated = clean.length > 12000 ? clean.substring(0, 12000) + '... [Conteúdo truncado para preservação de buffer]' : clean;
          return {
            sucesso: true,
            conteudo: truncated,
            urlOriginal: url,
            metodoUtilizado: metodo,
            tamanhoCaracteres: truncated.length
          };
        }
      }
    } catch (err) {
      console.warn('[NavegadorSoberano] Jina Reader falhou:', err);
    }
  }

  // Se conseguimos HTML bruto via Direto ou ScraperAPI, faz a limpeza estrita
  if (htmlBruto) {
    // Verificação de Eco rigorosa
    if (detectarEcoSantuario(htmlBruto)) {
      return {
        sucesso: false,
        conteudo: 'Alerta de Barreira: O servidor respondeu com um redirecionamento interno em loop (Eco do Santuário). Acesso à URL externa bloqueado pelo provedor de origem.',
        urlOriginal: url,
        metodoUtilizado: metodo,
        tamanhoCaracteres: 0,
        aviso: 'Eco detectado e interceptado pela trava do Aethel'
      };
    }

    const textoLimpo = limparHtmlParaTextoPuro(htmlBruto);
    if (!textoLimpo || textoLimpo.length < 20) {
      return {
        sucesso: false,
        conteudo: `O site ${url} foi acessado, mas retornou conteúdo vazio ou protegido por CAPTCHA/JavaScript dinâmico intransponível.`,
        urlOriginal: url,
        metodoUtilizado: metodo,
        tamanhoCaracteres: 0
      };
    }

    const truncated = textoLimpo.length > 12000 ? textoLimpo.substring(0, 12000) + '... [Conteúdo truncado para preservação de buffer]' : textoLimpo;
    return {
      sucesso: true,
      conteudo: truncated,
      urlOriginal: url,
      metodoUtilizado: metodo,
      tamanhoCaracteres: truncated.length
    };
  }

  return {
    sucesso: false,
    conteudo: `Falha ao navegar no site ${url}. Todas as 3 camadas de extração (Direta, ScraperAPI e Jina Reader) encontraram barreiras ativas.`,
    urlOriginal: url,
    metodoUtilizado: metodo,
    tamanhoCaracteres: 0
  };
}
