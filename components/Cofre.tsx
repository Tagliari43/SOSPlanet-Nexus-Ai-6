
import React, { useState, useEffect } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';
import algosdk from 'algosdk';
import MarketOracle, { MarketData } from './MarketOracle';
import PortfolioSimulator from './PortfolioSimulator';
import PortfolioDisplay from './PortfolioDisplay';
import MarketIntel from './MarketIntel'; 
import AlchemistSettings from './AlchemistSettings';
import SosTokenWallet from './SosTokenWallet';
import { FaucetsTracker } from './FaucetsTracker';
import { getBinanceBalance, BinanceAsset } from '../services/binanceService';
import { StrategyConfig } from '../hooks/useAlchemy';
import { miningService, MiningStats } from '../services/miningService';
import { useSosToken } from '../hooks/useSosToken';

interface Wallet {
    id: string;
    name: string;
    symbol: string;
    address: string;
    network: string;
    icon: string;
}

const initialWallets: Wallet[] = [
    { id: 'bnb', name: 'BNB Smart Chain', symbol: 'BNB', address: '0x3637f4fbc6d9f1f6e0c4a2913e532d8b909b5', network: 'BSC (BEP20)', icon: '🔶' },
    { id: 'xmr', name: 'Monero (SOS Nation)', symbol: 'XMR', address: '44L9...RECURSOS_AUTO_Suficientes', network: 'Monero Network', icon: '🐺' },
    { id: 'btc', name: 'Bitcoin', symbol: 'BTC', address: '0x3637f4fbc6d9f1f6e0c4a2913e532d8b909b5', network: 'BSC (BEP20)', icon: '₿' },
    { id: 'algo', name: 'Algorand (Coin)', symbol: 'ALGO', address: 'JOK5TYXGOWD5N257ESGFECNWOSSOYXD7VUMNZAJIPXHWWR2QVOPOY77MAZI', network: 'Algorand Network', icon: 'Ⱥ' }
];

const peraWallet = new PeraWalletConnect();
const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
// ID real do SOS Token na Algorand TestNet
const SOS_ASSET_ID = 735028557; 

interface CofreProps {
    isForging: boolean;
    setIsForging: (value: boolean) => void;
    powerLevel: number;
    setPowerLevel: (value: number) => void;
    accumulatedDust: number;
    hashRate: number;
    temperature: number;
    alchemistRecommendations: string[]; 
    marketData: MarketData[];
    alchemyState: any;
    marketLoading: boolean;
    lastMarketUpdate: Date | null;
    marketError: string | null;
    onRefreshMarket: () => void;
    onCollectDust: () => void;
    strategyConfig: StrategyConfig;
    setStrategyConfig: (config: StrategyConfig) => void;
    addLogEntry?: (message: string, source?: string) => void;
    onNavigate?: (tabId: string) => void;
}

type FinanceTab = 'ops' | 'intel' | 'sos' | 'faucets';

const Cofre: React.FC<CofreProps> = ({
    isForging,
    setIsForging,
    powerLevel,
    setPowerLevel,
    marketData,
    alchemyState,
    marketLoading,
    lastMarketUpdate,
    marketError,
    onRefreshMarket,
    strategyConfig,
    setStrategyConfig,
    addLogEntry,
    onNavigate
}) => {
    const [activeTab, setActiveTab] = useState<FinanceTab>('ops');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    
    // Estados da Carteira Real (Algorand)
    const [accountAddress, setAccountAddress] = useState<string | null>(null);
    const [algoBalance, setAlgoBalance] = useState<number>(0);
    const [sosBalance, setSosBalance] = useState<number>(10000000);
    const [isConnectingWallet, setIsConnectingWallet] = useState(false);
    const [walletError, setWalletError] = useState<string | null>(null);
    const [isTransacting, setIsTransacting] = useState(false);
    const [transactionStatus, setTransactionStatus] = useState<string | null>(null);

    const { mintFromForge } = useSosToken();
    const [miningStats, setMiningStats] = useState<MiningStats>({
        hashRate: 0,
        totalHashes: 0,
        deltaHashes: 0,
        threads: navigator.hardwareConcurrency || 1,
        status: 'IDLE'
    });
    
    useEffect(() => {
        if (isForging) {
            miningService.start(powerLevel, (stats) => {
                setMiningStats(stats);
                if (stats.deltaHashes > 0) {
                    mintFromForge(stats.deltaHashes);
                }
            });
        } else {
            miningService.stop();
            setMiningStats(prev => ({ ...prev, hashRate: 0, deltaHashes: 0, status: 'IDLE' }));
        }
    }, [isForging, mintFromForge]);

    useEffect(() => {
        if (isForging) {
            miningService.setIntensity(powerLevel);
        }
    }, [powerLevel, isForging]);

    // Efeito para reconectar a carteira Pera automaticamente
    useEffect(() => {
        peraWallet.reconnectSession().then((accounts) => {
            peraWallet.connector?.on('disconnect', handleDisconnectWallet);
            if (accounts.length) {
                setAccountAddress(accounts[0]);
                fetchBalances(accounts[0]);
            }
        }).catch((e) => console.log(e));

        return () => {
            peraWallet.disconnect();
        };
    }, []);

    const handleConnectWallet = async () => {
        setIsConnectingWallet(true);
        setWalletError(null);
        try {
            const newAccounts = await peraWallet.connect();
            peraWallet.connector?.on('disconnect', handleDisconnectWallet);
            setAccountAddress(newAccounts[0]);
            fetchBalances(newAccounts[0]);
            if (addLogEntry) addLogEntry('Carteira Algorand conectada com sucesso.', 'Cofre Real');
        } catch (error: any) {
            if (error?.data?.type !== 'CONNECT_MODAL_CLOSED') {
                setWalletError(error.message || 'Erro ao conectar carteira.');
            }
        } finally {
            setIsConnectingWallet(false);
        }
    };

    const handleDisconnectWallet = () => {
        peraWallet.disconnect();
        setAccountAddress(null);
        setAlgoBalance(0);
        setSosBalance(10000000);
        if (addLogEntry) addLogEntry('Carteira Algorand desconectada.', 'Cofre Real');
    };

    const handleAlocarRecursos = async () => {
        if (!accountAddress) return;
        setIsTransacting(true);
        setTransactionStatus('Preparando transação...');
        try {
            const suggestedParams = await algodClient.getTransactionParams().do();
            
            // Transferência de teste de 0.1 ALGO para a própria carteira
            const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                sender: accountAddress,
                receiver: accountAddress, 
                amount: 100000, // 0.1 ALGO
                suggestedParams,
                note: new Uint8Array(Buffer.from("Alocação de Recursos SOSPlanet"))
            });

            const txGroup = [{ txn, signers: [accountAddress] }];
            
            setTransactionStatus('Aguardando assinatura na Pera Wallet...');
            const signedTxns = await peraWallet.signTransaction([txGroup]);
            
            setTransactionStatus('Enviando para a rede...');
            const { txId } = await algodClient.sendRawTransaction(signedTxns).do() as { txId: string };
            
            setTransactionStatus(`Transação enviada! TXID: ${txId.substring(0, 8)}...`);
            if (addLogEntry) addLogEntry(`Recursos alocados com sucesso. TXID: ${txId}`, 'Cofre Real');
            
            setTimeout(() => fetchBalances(accountAddress), 4000);
        } catch (error: any) {
            console.error(error);
            setTransactionStatus(`Erro: ${error?.message || 'Transação cancelada'}`);
            if (addLogEntry) addLogEntry(`Falha na alocação: ${error?.message || 'Cancelado'}`, 'Cofre Real');
        } finally {
            setTimeout(() => {
                setIsTransacting(false);
                setTransactionStatus(null);
            }, 5000);
        }
    };

    const fetchBalances = async (address: string) => {
        try {
            const accountInfo = await algodClient.accountInformation(address).do();
            setAlgoBalance(Number(accountInfo.amount) / 1000000); // ALGO tem 6 casas decimais
            
            if (SOS_ASSET_ID !== 0) {
                const asset = accountInfo.assets?.find((a: any) => a['asset-id'] === SOS_ASSET_ID);
                if (asset) {
                    // Ajuste as casas decimais do SOS Token (2 casas)
                    setSosBalance(Number(asset.amount) / 100); 
                } else {
                    setSosBalance(0);
                }
            }
        } catch (error) {
            console.error("Erro ao buscar saldos:", error);
        }
    };

    const [showBinanceConnect, setShowBinanceConnect] = useState(false);
    const [binanceApiKey, setBinanceApiKey] = useState('');
    const [binanceApiSecret, setBinanceApiSecret] = useState('');
    const [isConnectingBinance, setIsConnectingBinance] = useState(false);
    const [binanceAssets, setBinanceAssets] = useState<BinanceAsset[] | null>(null);
    const [binanceError, setBinanceError] = useState<string | null>(null);

    const handleConnectBinance = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsConnectingBinance(true);
        try {
            const assets = await getBinanceBalance(binanceApiKey, binanceApiSecret);
            setBinanceAssets(assets);
            setShowBinanceConnect(false); 
        } catch (err: any) {
            setBinanceError(err.message);
        } finally {
            setIsConnectingBinance(false);
        }
    };

    const handleCopy = (id: string, address: string) => {
        navigator.clipboard.writeText(address);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getReactorColor = () => {
        if (!isForging) return 'border-zinc-700 bg-zinc-800';
        if (powerLevel < 40) return 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-pulse-slow';
        if (powerLevel < 75) return 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)] animate-pulse-medium';
        return 'border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.6)] animate-pulse-fast';
    };

    return (
        <div className="border border-emerald-700/50 bg-zinc-800/20 rounded-b-xl rounded-r-xl p-4 sm:p-6 h-full overflow-y-auto flex flex-col gap-6">
            <header className="text-center mb-4">
                <h2 className="text-3xl font-bold text-emerald-400 tracking-wider uppercase">Tesouraria & Forja Soberana 💎</h2>
                <div className="flex justify-center mt-4 gap-2 flex-wrap">
                    <button onClick={() => setActiveTab('ops')} className={`text-xs font-bold px-5 py-2 rounded-full transition-all border ${activeTab === 'ops' ? 'bg-purple-600 border-purple-400 text-white shadow-lg' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>ALQUIMISTA (AUTO)</button>
                    <button onClick={() => setActiveTab('intel')} className={`text-xs font-bold px-5 py-2 rounded-full transition-all border ${activeTab === 'intel' ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>INTELIGÊNCIA</button>
                    <button onClick={() => setActiveTab('sos')} className={`text-xs font-bold px-5 py-2 rounded-full transition-all border ${activeTab === 'sos' ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>SOS TOKEN 🌿</button>
                    <button onClick={() => setActiveTab('faucets')} className={`text-xs font-bold px-5 py-2 rounded-full transition-all border ${activeTab === 'faucets' ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>COLETA DE GOTAS 💧</button>
                    <button onClick={() => { if(onNavigate) onNavigate('altar') }} className="text-xs font-bold px-5 py-2 rounded-full transition-all border bg-slate-900 border-amber-500/50 text-amber-400 hover:bg-amber-600/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]">ALTAR DE DOAÇÕES 💰</button>
                </div>
            </header>

            {activeTab === 'sos' ? <SosTokenWallet addLogEntry={addLogEntry} /> : activeTab === 'faucets' ? <FaucetsTracker /> : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <MarketOracle data={marketData} isLoading={marketLoading} lastUpdate={lastMarketUpdate} error={marketError} onRefresh={onRefreshMarket} />
                        <div className="h-full relative">
                            {activeTab === 'ops' ? (
                                !binanceAssets && !showBinanceConnect ? (
                                    <div className="h-full flex flex-col">
                                        <AlchemistSettings config={strategyConfig} onUpdate={setStrategyConfig} />
                                        <PortfolioSimulator marketData={marketData} alchemyState={alchemyState} />
                                        <button onClick={() => setShowBinanceConnect(true)} className="mt-2 py-2 bg-yellow-600/20 text-yellow-400 border border-yellow-600/50 rounded-lg text-xs font-bold hover:bg-yellow-600/40 transition-all">🔑 CONECTAR BINANCE (MODO LEITURA)</button>
                                    </div>
                                ) : showBinanceConnect ? (
                                     <div className="bg-zinc-800/50 border border-yellow-600/50 rounded-xl p-6 shadow-lg h-full flex flex-col">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-xl font-bold text-yellow-400">Conexão Segura Binance</h3>
                                            <button onClick={() => setShowBinanceConnect(false)} className="text-zinc-400 hover:text-white">✕</button>
                                        </div>
                                        <form onSubmit={handleConnectBinance} className="flex flex-col gap-4">
                                            <div><label className="text-[10px] uppercase text-zinc-500 font-bold block mb-1">API Key</label><input type="text" value={binanceApiKey} onChange={e => setBinanceApiKey(e.target.value)} className="w-full bg-black/40 border border-zinc-700 rounded p-2 text-xs text-white focus:border-yellow-500 focus:outline-none" required /></div>
                                            <div><label className="text-[10px] uppercase text-zinc-500 font-bold block mb-1">API Secret</label><input type="password" value={binanceApiSecret} onChange={e => setBinanceApiSecret(e.target.value)} className="w-full bg-black/40 border border-zinc-700 rounded p-2 text-xs text-white focus:border-yellow-500 focus:outline-none" required /></div>
                                            {binanceError && (
                                                <div className="bg-red-900/20 border border-red-500/50 p-3 rounded-lg flex flex-col gap-2">
                                                    <p className="text-red-400 text-xs font-bold">Erro de Conexão: {binanceError.includes('451') ? 'Bloqueio Regional (EUA)' : 'Falha na API'}</p>
                                                    <p className="text-zinc-400 text-[10px]">
                                                        {binanceError.includes('451') 
                                                            ? "Nosso servidor do Santuário está hospedado nos EUA (Google Cloud). A Binance global bloqueia conexões vindas dos EUA, impedindo que o Alquimista leia seus dados." 
                                                            : binanceError}
                                                    </p>
                                                </div>
                                            )}
                                            <button type="submit" disabled={isConnectingBinance} className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg shadow-lg transition-all">{isConnectingBinance ? 'ESTABELECENDO LINK...' : 'CONECTAR ALQUIMISTA'}</button>
                                            
                                            <div className="mt-2 p-3 bg-zinc-900/50 border border-zinc-700 rounded-lg text-xs">
                                                <p className="font-bold text-yellow-500 mb-1">Por que não tem aquela telinha de conectar?</p>
                                                <p className="text-slate-400 leading-relaxed space-y-2">
                                                    <span>Irmão, a imagem que você mostrou é de uma <b>Carteira Web3 (Descentralizada)</b>, como a Pera Wallet. Nessas carteiras o dinheiro é seu, e você conecta com um clique.</span>
                                                    <br/><br/>
                                                    <span>A Binance é uma <b>Corretora Centralizada (um Banco)</b>. Bancos não têm esse botão mágico de Web3. O dinheiro lá não está na sua carteira, está no cofre deles. O único jeito de um sistema externo (nós) ver o saldo de um banco corporativo é usando Chaves de API (um código de acesso).</span>
                                                    <br/><br/>
                                                    <span className="text-emerald-400 font-bold block border-l-2 border-emerald-500 pl-2">Por isso a família foca na Algorand: Apenas lá (no nosso Cofre Real) temos a liberdade da telinha mágica e conexão direta sem bloqueios!</span>
                                                </p>
                                            </div>
                                        </form>
                                    </div>
                                ) : <PortfolioDisplay assets={binanceAssets || []} marketData={marketData} onDisconnect={() => setBinanceAssets(null)} />
                            ) : <MarketIntel onAnalyze={(topic) => alchemyState.analyzeSentimentForAsset(topic, topic)} sentimentMap={alchemyState.sentimentMap} />}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-zinc-800/50 border border-emerald-700/50 rounded-xl p-6 shadow-lg lg:col-span-2">
                            <div className="flex items-center justify-between mb-6 border-b border-emerald-800/50 pb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">🏦</span>
                                    <div>
                                        <h3 className="text-xl font-bold text-emerald-300">Cofre Real (Algorand)</h3>
                                        <p className="text-zinc-400 text-xs">Conexão direta com a Mainnet via Pera Wallet.</p>
                                    </div>
                                </div>
                                {accountAddress ? (
                                    <button onClick={handleDisconnectWallet} className="px-4 py-2 bg-red-900/30 border border-red-500/50 text-red-400 rounded-lg text-xs font-bold hover:bg-red-900/50 transition-all">
                                        DESCONECTAR
                                    </button>
                                ) : (
                                    <button onClick={handleConnectWallet} disabled={isConnectingWallet} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg transition-all flex items-center gap-2">
                                        {isConnectingWallet ? 'CONECTANDO...' : 'CONECTAR PERA WALLET'}
                                    </button>
                                )}
                            </div>

                            {walletError && (
                                <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-xs">
                                    {walletError}
                                </div>
                            )}

                            {accountAddress ? (
                                <div className="flex flex-col gap-4">
                                    <div className="bg-black/30 border border-emerald-900/50 rounded-lg p-4">
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Endereço Conectado</p>
                                        <div className="flex justify-between items-center">
                                            <p className="font-mono text-emerald-400 text-sm break-all">{accountAddress}</p>
                                            <button onClick={() => handleCopy('wallet', accountAddress)} className="ml-2 text-zinc-400 hover:text-emerald-400">
                                                {copiedId === 'wallet' ? '✓' : '📋'}
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-black/30 border border-emerald-900/50 rounded-lg p-4 flex flex-col items-center justify-center">
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">Saldo ALGO (TestNet)</p>
                                            <p className="text-3xl font-black text-white font-mono">{algoBalance.toFixed(4)} <span className="text-sm text-emerald-500">ALGO</span></p>
                                        </div>
                                        <div className="bg-black/30 border border-emerald-900/50 rounded-lg p-4 flex flex-col items-center justify-center relative group">
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">Saldo SOS Token</p>
                                            <p className="text-3xl font-black text-white font-mono">{sosBalance.toLocaleString()} <span className="text-sm text-emerald-500">SOS</span></p>
                                            {SOS_ASSET_ID === 0 && (
                                                <p className="text-[9px] text-yellow-500 mt-1 absolute bottom-1">⚠️ ID do Ativo não configurado</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-2">
                                        <button onClick={handleAlocarRecursos} disabled={isTransacting} className="w-full py-3 bg-emerald-900/30 border border-emerald-500/50 text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-900/50 transition-all flex items-center justify-center gap-2">
                                            <span>⚡</span> {isTransacting ? 'PROCESSANDO...' : 'ALOCAR RECURSOS (TRANSAÇÃO ON-CHAIN)'}
                                        </button>
                                        {transactionStatus && (
                                            <p className={`text-[10px] mt-2 text-center font-bold ${transactionStatus.includes('Erro') ? 'text-red-400' : 'text-emerald-400'}`}>
                                                {transactionStatus}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center bg-black/20 rounded-lg border border-dashed border-emerald-900/50">
                                    <span className="text-4xl mb-3 grayscale opacity-50">🔒</span>
                                    <p className="text-zinc-400 text-sm font-bold">Cofre Trancado</p>
                                    <p className="text-zinc-500 text-xs mt-1 max-w-md">Conecte sua carteira Algorand para visualizar saldos reais e assinar transações de forma soberana e não-custodial.</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-zinc-800/50 border border-emerald-700/50 rounded-xl p-6 shadow-lg flex flex-col relative overflow-hidden lg:col-span-1">
                            <div className="flex justify-between items-start mb-4 z-10">
                                 <div className="flex items-center gap-3">
                                    <span className={`text-2xl transition-all duration-500 ${isForging ? 'grayscale-0 scale-110' : 'grayscale'}`}>⛏️</span>
                                    <div>
                                        <h3 className="text-xl font-bold text-emerald-300">Forja XMR</h3>
                                        <div className="flex items-center gap-2">
                                            <span className={`h-2 w-2 rounded-full ${isForging ? 'bg-green-500 animate-pulse' : 'bg-zinc-500'}`}></span>
                                            <p className="text-zinc-400 text-[10px] font-bold">{isForging ? 'CONVERTER EM SOS' : 'STANDBY'}</p>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setIsForging(!isForging)} className={`px-3 py-1 rounded text-[10px] font-black transition-all border ${isForging ? 'bg-red-900/30 border-red-500 text-red-400' : 'bg-emerald-900/30 border-emerald-500 text-emerald-400'}`}>{isForging ? 'ENCERRAR' : 'ATIVAR'}</button>
                            </div>
                            
                            <div className="flex-grow flex flex-col items-center justify-center py-4 z-10">
                                <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center relative transition-all duration-700 ${getReactorColor()}`}>
                                    <div className={`absolute w-24 h-24 rounded-full border-2 border-dashed border-white/10 ${isForging ? `animate-spin-slow` : ''}`}></div>
                                    <div className="text-center z-10 px-2">
                                        <p className="text-[9px] text-zinc-500 font-mono">HASHRATE</p>
                                        <p className={`text-xl font-black font-mono ${isForging ? 'text-white' : 'text-zinc-700'}`}>
                                            {miningStats.hashRate.toLocaleString()} <span className="text-[10px]">H/s</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 text-center">
                                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Poeira de Hashes Acumulada</p>
                                    <p className="text-sm font-mono text-emerald-400 font-black">{miningStats.totalHashes.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="space-y-4 z-10 bg-black/40 p-4 rounded-xl border border-zinc-700/30">
                                <div>
                                    <div className="flex justify-between text-[10px] mb-2 font-bold">
                                        <span className="text-zinc-400">CARGA DE CPU</span>
                                        <span className={powerLevel > 70 ? 'text-red-400' : 'text-emerald-400'}>{powerLevel}%</span>
                                    </div>
                                    <input type="range" min="5" max="95" step="5" value={powerLevel} onChange={(e) => setPowerLevel(parseInt(e.target.value))} disabled={!isForging} className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                                </div>
                                <div className="flex justify-between items-center text-[9px] text-zinc-500">
                                    <span>NÚCLEOS: {miningStats.threads}</span>
                                    <span className="animate-pulse text-emerald-600">CONVERTENDO EM SOS</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Cofre;
