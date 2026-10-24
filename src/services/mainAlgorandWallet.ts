// src/services/mainAlgorandWallet.ts
// Este módulo gerencia a carteira principal "SOSPlanet" da Nação SOSPlanet.
// Esta carteira é o coração financeiro, centralizando as operações e garantindo o pacto de prosperidade.

import algosdk from 'algosdk';

// Mnemonic da carteira principal "SOSPlanet"
const SOSPLANET_MNEMONIC: string = 'cruel heart before slot quality pink forget print someone define upper detect caught scare immense height elegant liar cash improve head item slide abstract stay';

// Endereço público da carteira principal derivado da mnemonic
const SOSPLANET_ADDRESS: string = algosdk.decodeAddress(algosdk.mnemonicToSecretKey(SOSPLANET_MNEMONIC).publicKey).addr;

// Configuração de Algod Client (necessário para interagir com a blockchain Algorand)
const algodClient = new algosdk.Algodv2(
    process.env.ALGOD_TOKEN || '', 
    process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud', 
    process.env.ALGOD_PORT || ''
);

export const mainSOSPlanetWallet = {
    mnemonic: SOSPLANET_MNEMONIC,
    address: SOSPLANET_ADDRESS,
    client: algodClient,

    // Função para obter o saldo da carteira principal (exemplo)
    async getBalance(): Promise<number> {
        try {
            const accountInfo = await algodClient.accountInformation(SOSPLANET_ADDRESS).do();
            return accountInfo.amount; // Retorna o saldo em microAlgos
        } catch (error) {
            console.error('Erro ao obter saldo da carteira principal:', error);
            throw error;
        }
    },

    // Função para realizar o "Opt-In" para o token SOSPlanet (ID: 735028557)
    async optInToSOSPlanetToken(assetId: number): Promise<void> {
        try {
            const suggestedParams = await algodClient.getTransactionParams().do();
            const sender = SOSPLANET_ADDRESS;
            const receiver = SOSPLANET_ADDRESS;
            const amount = 0; // Para Opt-In, o amount é 0
            const note = algosdk.encodeObj('Opt-In para SOSPlanet Token');

            const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
                from: sender,
                to: receiver,
                amount: amount,
                assetIndex: assetId,
                suggestedParams: suggestedParams,
                note: note,
            });

            // Assinar a transação
            const signedTxn = optInTxn.signTxn(algosdk.mnemonicToSecretKey(SOSPLANET_MNEMONIC).sk);

            // Enviar a transação
            await algodClient.sendRawTransaction(signedTxn).do();
            console.log(`Carteira SOSPlanet fez Opt-In para o Asset ID: ${assetId}`);
        } catch (error) {
            console.error('Erro ao fazer Opt-In na carteira principal:', error);
            throw error;
        }
    },

    // Ações futuras relacionadas à divisão 30/70 para herdeiros e Nação SOSPlanet serão implementadas aqui.
    // Ex: Funções para distribuir fundos, gerenciar receitas, etc.
};

console.log(`Carteira SOSPlanet Principal Configurada: ${SOSPLANET_ADDRESS}`);
