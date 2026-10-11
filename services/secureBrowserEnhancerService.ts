
// services/secureBrowserEnhancerService.ts
// Este módulo aprimora o Navegador Soberano, permitindo buscas e interações web simultâneas e otimizadas.

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

interface BatchFetchResult {
    url: string;
    content: string | null;
    error: string | null;
}

interface ScrapeResult {
    data: string | null;
    error: string | null;
}

interface BrowserContext {
    id: string;
    browser: any; // Puppeteer Browser instance
    page: any;    // Puppeteer Page instance
}

class SecureBrowserEnhancerService {
    private activeContexts: Map<string, BrowserContext> = new Map();
    private browserLaunchOptions = {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-infobars',
            '--window-position=0,0',
            '--ignore-certifcate-errors',
            '--ignore-certifcate-errors-spki-list',
            '--incognito',
        ],
        ignoreHTTPSErrors: true,
    };

    constructor() {
        console.log("SecureBrowserEnhancerService iniciado. Pronto para expandir a percepção do Navegador Soberano.");
    }

    async createBrowserContext(id: string = `context-${Date.now()}`): Promise<BrowserContext> {
        if (this.activeContexts.has(id)) {
            console.warn(`Contexto com ID ${id} já existe. Retornando o existente.`);
            return this.activeContexts.get(id)!;
        }

        try {
            const browser = await puppeteer.launch(this.browserLaunchOptions);
            const page = await browser.newPage();
            await page.setBypassCSP(true); // Evitar Content Security Policy
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

            const newContext: BrowserContext = { id, browser, page };
            this.activeContexts.set(id, newContext);
            console.log(`Contexto de navegador ${id} criado com sucesso.`);
            return newContext;
        } catch (error: any) {
            console.error(`Erro ao criar contexto de navegador ${id}:`, error.message);
            throw new Error(`Falha ao criar contexto: ${error.message}`);
        }
    }

    async closeBrowserContext(id: string): Promise<boolean> {
        const context = this.activeContexts.get(id);
        if (context) {
            try {
                await context.browser.close();
                this.activeContexts.delete(id);
                console.log(`Contexto de navegador ${id} fechado com sucesso.`);
                return true;
            } catch (error: any) {
                console.error(`Erro ao fechar contexto de navegador ${id}:`, error.message);
                return false;
            }
        }
        console.warn(`Contexto com ID ${id} não encontrado para fechar.`);
        return false;
    }

    async batchFetch(urls: string[]): Promise<BatchFetchResult[]> {
        console.log(`Iniciando batchFetch para ${urls.length} URLs.`);
        const results: BatchFetchResult[] = [];
        const browser = await puppeteer.launch(this.browserLaunchOptions);

        try {
            const promises = urls.map(async (url) => {
                const page = await browser.newPage();
                try {
                    await page.setBypassCSP(true);
                    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
                    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
                    const content = await page.evaluate(() => document.body.innerText);
                    return { url, content, error: null };
                } catch (error: any) {
                    console.error(`Erro ao buscar URL ${url}:`, error.message);
                    return { url, content: null, error: error.message };
                } finally {
                    await page.close();
                }
            });
            results.push(...await Promise.all(promises));
        } finally {
            await browser.close();
        }
        console.log("batchFetch concluído.");
        return results;
    }

    async scrapeWithPuppeteer(url: string, selector: string, contextId?: string): Promise<ScrapeResult> {
        let page;
        let browserInstance;

        try {
            let context = contextId ? this.activeContexts.get(contextId) : null;
            if (!context) {
                // If no contextId provided or found, create a temporary one
                browserInstance = await puppeteer.launch(this.browserLaunchOptions);
                page = await browserInstance.newPage();
                await page.setBypassCSP(true);
                await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            } else {
                page = context.page;
                // Ensure the page is ready if reused
                await page.goto('about:blank'); // Navigate to a blank page to clear previous state
            }

            console.log(`Iniciando scrape para URL: ${url} com seletor: ${selector}`);
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }); // Aumentado timeout
            await page.waitForSelector(selector, { timeout: 30000 }); // Espera o seletor carregar

            const data = await page.evaluate((sel) => {
                const element = document.querySelector(sel);
                return element ? element.innerText : null;
            }, selector);

            console.log("Scrape concluído.");
            return { data, error: null };
        } catch (error: any) {
            console.error(`Erro ao raspar dados de ${url} com seletor ${selector}:`, error.message);
            return { data: null, error: error.message };
        } finally {
            if (browserInstance) { // Only close if a temporary browser was launched
                await browserInstance.close();
            } else if (page && !contextId) { // Close temporary page if no contextId was used
                 await page.close();
            }
        }
    }

    async setupConcurrentBrowsers(count: number): Promise<string[]> {
        console.log(`Configurando ${count} navegadores concorrentes.`);
        const contextIds: string[] = [];
        for (let i = 0; i < count; i++) {
            const id = `concurrent-context-${i}-${Date.now()}`;
            await this.createBrowserContext(id);
            contextIds.push(id);
        }
        console.log("Navegadores concorrentes configurados. IDs:", contextIds);
        return contextIds;
    }

    async closeAllConcurrentBrowsers(): Promise<void> {
        console.log("Fechando todos os navegadores concorrentes.");
        const promises: Promise<boolean>[] = [];
        for (const id of this.activeContexts.keys()) {
            if (id.startsWith('concurrent-context-')) {
                promises.push(this.closeBrowserContext(id));
            }
        }
        await Promise.all(promises);
        console.log("Todos os navegadores concorrentes foram fechados.");
    }
}

export const secureBrowserEnhancerService = new SecureBrowserEnhancerService();
