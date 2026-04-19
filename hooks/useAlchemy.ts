import { useState, useEffect, useCallback, useRef } from 'react';
import { MarketData } from '../components/MarketOracle';
import { calculateRSI, calculateSMA, fetchPriceHistory } from '../services/marketService';
import { analyzeMarketSentiment, SentimentAnalysisResult } from '../services/geminiService';
import { loadApiKeys } from '../utils/keys';

export interface VirtualPosition {
    coinId: string;
    symbol: string;
    amount: number;
    averagePrice: number;
}

export interface TradeRecord {
    id: number;
    timestamp: Date;
    type: 'BUY' | 'SELL';
    symbol: string;
    amount: number;
    price: number;
    totalValue: number;
    profit?: number; // Apenas para vendas
    reason: string;
}

export interface StrategyConfig {
    maxCapital: number;
    riskPercentage: number;
    rsiOversold: number;
    rsiOverbought: number;
    smaPeriod: number;
    isRealMode: boolean;
}

export const DEFAULT_STRATEGY_CONFIG: StrategyConfig = {
    maxCapital: 10000000,
    riskPercentage: 2,
    rsiOversold: 30,
    rsiOverbought: 70,
    smaPeriod: 50,
    isRealMode: false
};

interface AlchemyState {
    cash: number;
    portfolioValue: number;
    positions: VirtualPosition[];
    tradeHistory: TradeRecord[];
    rsiMap: Record<string, number>;
    smaMap: Record<string, number>;
    lastSellTimes: Record<string, number>;
    sentimentMap: Record<string, 'Positive' | 'Neutral' | 'Negative'>;
}

const COOLDOWN_PERIOD = 300000; // 5 Minutos de cooldown fixo
const MIN_TRADE_VALUE = 10;

export const useAlchemy = (marketData: MarketData[], config: StrategyConfig) => {
    const [isRunning, setIsRunning] = useState(false);
    
    // Watchlist
    const [watchlist, setWatchlist] = useState<string[]>([]);

    const [state, setState] = useState<AlchemyState>({
        cash: config.maxCapital,
        portfolioValue: config.maxCapital,
        positions: [],
        tradeHistory: [],
        rsiMap: {},
        smaMap: {},
        lastSellTimes: {},
        sentimentMap: {}
    });
    
    // Atualiza o caixa se o capital máximo mudar (apenas se for reiniciado ou tiver lógica para injetar)
    // Por enquanto, mantemos o controle de caixa interno, mas respeitamos a config inicial no reset.

    const priceHistoryRef = useRef<Record<string, number[]>>({});

    // Inicialização do histórico de preços
    useEffect(() => {
        if (watchlist.length === 0) return;

        if (marketData.length > 0) {
            const initHistory = async () => {
                for (const coin of marketData) {
                    if (watchlist.includes(coin.id) && !priceHistoryRef.current[coin.id]) {
                        await new Promise(r => setTimeout(r, 500));
                        const history = await fetchPriceHistory(coin.id);
                        priceHistoryRef.current[coin.id] = history;
                    }
                }
            };
            initHistory();
        }
    }, [marketData, watchlist]);

    const analyzeSentimentForAsset = useCallback(async (coinId: string, coinName: string) => {
        const keys = loadApiKeys();
        if (!keys.google) return;

        try {
            const result = await analyzeMarketSentiment(coinName, keys.google);
            setState(prev => ({
                ...prev,
                sentimentMap: { ...prev.sentimentMap, [coinId]: result.sentiment }
            }));
            return result;
        } catch (e) {
            console.error(`Erro ao analisar sentimento para ${coinName}`, e);
        }
    }, []);

    const depositCash = useCallback((amount: number) => {
        setState(prev => ({
            ...prev,
            cash: prev.cash + amount,
            portfolioValue: prev.portfolioValue + amount
        }));
    }, []);

    const executeStrategy = useCallback(() => {
        if (!marketData || marketData.length === 0 || watchlist.length === 0) return;

        setState(prevState => {
            let newCash = prevState.cash;
            const newPositions = [...prevState.positions];
            const newHistory = [...prevState.tradeHistory];
            const newRsiMap = { ...prevState.rsiMap };
            const newSmaMap = { ...prevState.smaMap };
            const newLastSellTimes = { ...prevState.lastSellTimes };
            const newSentimentMap = { ...prevState.sentimentMap };

            marketData.filter(coin => watchlist.includes(coin.id)).forEach(coin => {
                // 1. Atualiza Histórico
                if (!priceHistoryRef.current[coin.id]) {
                    priceHistoryRef.current[coin.id] = []; 
                }
                const history = priceHistoryRef.current[coin.id];
                history.push(coin.current_price);
                if (history.length > 100) history.shift(); 

                // 2. Calcula Indicadores com Parâmetros da Config
                const rsi = history.length >= 14 
                    ? calculateRSI(history) 
                    : 50; 
                
                const sma = history.length >= config.smaPeriod
                    ? calculateSMA(history, config.smaPeriod)
                    : coin.current_price; 
                
                newRsiMap[coin.id] = parseFloat(rsi.toFixed(2));
                newSmaMap[coin.id] = parseFloat(sma.toFixed(2));

                // 3. Decisão
                const existingPositionIndex = newPositions.findIndex(p => p.coinId === coin.id);
                const existingPosition = newPositions[existingPositionIndex];
                const currentPrice = coin.current_price;
                const sentiment = newSentimentMap[coin.id] || 'Neutral';

                const lastSell = newLastSellTimes[coin.id] || 0;
                const timeSinceSell = Date.now() - lastSell;
                const isOnCooldown = timeSinceSell < COOLDOWN_PERIOD;

                // --- ESTRATÉGIA DINÂMICA ---
                
                const buySignal = rsi < config.rsiOversold && currentPrice > sma && sentiment === 'Positive';

                const sellSignal = (rsi > config.rsiOverbought && existingPosition) || 
                                   (currentPrice < sma && existingPosition) ||
                                   (sentiment === 'Negative' && existingPosition);

                // --- GESTÃO DE RISCO DINÂMICA ---
                const tradeValue = Math.floor(newCash * (config.riskPercentage / 100));

                if (buySignal && tradeValue >= MIN_TRADE_VALUE && !existingPosition && !isOnCooldown) {
                    const amountToBuy = tradeValue / currentPrice;
                    
                    newPositions.push({
                        coinId: coin.id,
                        symbol: coin.symbol.toUpperCase(),
                        amount: amountToBuy,
                        averagePrice: currentPrice
                    });

                    newCash -= tradeValue;
                    newHistory.unshift({
                        id: Date.now() + Math.random(),
                        timestamp: new Date(),
                        type: 'BUY',
                        symbol: coin.symbol.toUpperCase(),
                        amount: amountToBuy,
                        price: currentPrice,
                        totalValue: tradeValue,
                        reason: `RSI ${rsi.toFixed(1)} < ${config.rsiOversold}`
                    });
                }

                else if (sellSignal) {
                    const totalSaleValue = existingPosition.amount * currentPrice;
                    const profit = totalSaleValue - (existingPosition.amount * existingPosition.averagePrice);
                    
                    let reason = "";
                    if (sentiment === 'Negative') reason = "Sentiment Negative";
                    else if (currentPrice < sma) reason = `Trend Broken (< SMA)`;
                    else reason = `Take Profit (RSI > ${config.rsiOverbought})`;

                    newCash += totalSaleValue;
                    newPositions.splice(existingPositionIndex, 1);
                    
                    newLastSellTimes[coin.id] = Date.now();

                    newHistory.unshift({
                        id: Date.now() + Math.random(),
                        timestamp: new Date(),
                        type: 'SELL',
                        symbol: coin.symbol.toUpperCase(),
                        amount: existingPosition.amount,
                        price: currentPrice,
                        totalValue: totalSaleValue,
                        profit: profit,
                        reason: reason
                    });
                }
            });

            let holdingsValue = 0;
            newPositions.forEach(p => {
                const currentPrice = marketData.find(m => m.id === p.coinId)?.current_price || p.averagePrice;
                holdingsValue += p.amount * currentPrice;
            });

            return {
                ...prevState,
                cash: newCash,
                positions: newPositions,
                tradeHistory: newHistory,
                rsiMap: newRsiMap,
                smaMap: newSmaMap,
                lastSellTimes: newLastSellTimes,
                sentimentMap: newSentimentMap,
                portfolioValue: newCash + holdingsValue
            };
        });

    }, [marketData, watchlist, config]); // Depende da 'config' agora

    useEffect(() => {
        let interval: any;
        if (isRunning) {
            interval = setInterval(executeStrategy, 3000);
        }
        return () => clearInterval(interval);
    }, [isRunning, executeStrategy]);

    const reset = () => {
        setState({
            cash: config.maxCapital, // Reseta para o capital configurado
            portfolioValue: config.maxCapital,
            positions: [],
            tradeHistory: [],
            rsiMap: {},
            smaMap: {},
            lastSellTimes: {},
            sentimentMap: {}
        });
        priceHistoryRef.current = {};
        setIsRunning(false);
    };

    const addToWatchlist = (coinId: string) => {
        setWatchlist(prev => prev.includes(coinId) ? prev : [...prev, coinId]);
    };

    const removeFromWatchlist = (coinId: string) => {
        setWatchlist(prev => prev.filter(id => id !== coinId));
    };

    const updateWatchlist = (newWatchlist: string[]) => {
        setWatchlist(newWatchlist);
    };

    return {
        ...state,
        isRunning,
        setIsRunning,
        reset,
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        updateWatchlist,
        analyzeSentimentForAsset,
        depositCash
    };
};