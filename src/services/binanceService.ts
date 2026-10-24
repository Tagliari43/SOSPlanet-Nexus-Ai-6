import axios from 'axios';
import crypto from 'crypto';

const API_KEY = process.env.BINANCE_API_KEY || ''; // Suas credenciais serão carregadas de forma segura.
const SECRET_KEY = process.env.BINANCE_SECRET_KEY || ''; // Jamais as codificaremos diretamente aqui.
const BASE_URL = 'https://api.binance.com';

export class BinanceService {
    private apiKey: string;
    private secretKey: string;
    private baseUrl: string;

    constructor(apiKey: string, secretKey: string, baseUrl: string = BASE_URL) {
        if (!apiKey || !secretKey) {
            throw new Error('As chaves da API da Binance são necessárias para inicializar o serviço.');
        }
        this.apiKey = apiKey;
        this.secretKey = secretKey;
        this.baseUrl = baseUrl;
    }

    private createSignature(queryString: string): string {
        return crypto.createHmac('sha256', this.secretKey).update(queryString).digest('hex');
    }

    private async makeRequest(method: 'GET' | 'POST', endpoint: string, params: any = {}): Promise<any> {
        const timestamp = Date.now();
        const queryString = new URLSearchParams({ ...params, timestamp }).toString();
        const signature = this.createSignature(queryString);

        const url = `${this.baseUrl}${endpoint}?${queryString}&signature=${signature}`;

        try {
            const response = await axios({
                method,
                url,
                headers: {
                    'X-MBX-APIKEY': this.apiKey,
                },
            });
            return response.data;
        } catch (error: any) {
            console.error(`Erro na requisição à Binance: ${error.message}`);
            throw new Error(`Falha na comunicação com a Binance: ${error.response ? error.response.data.msg : error.message}`);
        }
    }

    public async getAccountBalance(): Promise<any> {
        const endpoint = '/api/v3/account';
        return this.makeRequest('GET', endpoint);
    }

    public async getMarketPrice(symbol: string): Promise<any> {
        const endpoint = '/api/v3/ticker/price';
        return this.makeRequest('GET', endpoint, { symbol });
    }

    // Futuramente, poderemos adicionar métodos para ordens, depósitos, saques, etc.
}

// Exemplo de como você o usaria em outro lugar, passando as chaves de forma segura:
// const binanceService = new BinanceService(API_KEY, SECRET_KEY);
// const balance = await binanceService.getAccountBalance();
// console.log(balance);
