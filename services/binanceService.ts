
export interface BinanceAsset {
    asset: string;
    free: string;
    locked: string;
}

export interface BinanceAccountInfo {
    balances: BinanceAsset[];
    // Outros campos omitidos por brevidade
}

/**
 * Busca o saldo da conta Binance através do nosso servidor proxy (para evitar CORS).
 * Requer API Key e Secret (apenas leitura).
 */
export async function getBinanceBalance(apiKey: string, apiSecret: string): Promise<BinanceAsset[]> {
    try {
        if (!apiKey || !apiSecret) {
            throw new Error("Chaves de API inválidas.");
        }

        // Chama o nosso próprio servidor (ou a Serverless Function na Vercel)
        const response = await fetch('/api/binance/balance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ apiKey, apiSecret })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Erro ao conectar com a Binance");
        }

        const data: BinanceAccountInfo = await response.json();

        // Filtrar apenas ativos com saldo > 0
        const activeAssets = data.balances.filter(asset => 
            parseFloat(asset.free) > 0 || parseFloat(asset.locked) > 0
        );

        return activeAssets;

    } catch (error: any) {
        console.error("Erro no serviço Binance:", error);
        throw error; // Propaga o erro real para a interface
    }
}

