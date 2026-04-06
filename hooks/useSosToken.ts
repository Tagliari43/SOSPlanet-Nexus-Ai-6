
import { useState, useEffect, useCallback } from 'react';
import { loadFromStorage, saveToStorage } from '../utils/storage';

export interface SosTransaction {
    id: string;
    timestamp: number;
    type: 'RECOMPENSA' | 'TRANSFERÊNCIA' | 'MINT' | 'FORJA' | 'PROJETO';
    amount: number;
    target: string;
    status: 'CONCLUÍDO' | 'PENDENTE';
}

const SOS_TOKEN_STORAGE_KEY = 'sovereign_sos_token_state_v2';
const PROJECT_CONTRIBUTIONS_KEY = 'sovereign_project_contributions';
const HASH_TO_TOKEN_RATIO = 1000000; // 1 Milhão de Hashes = 1 SOS

export const useSosToken = () => {
    const [balance, setBalance] = useState<number>(0);
    const [transactions, setTransactions] = useState<SosTransaction[]>([]);
    const [projectContributions, setProjectContributions] = useState<Record<string, number>>(() => 
        loadFromStorage<Record<string, number>>(PROJECT_CONTRIBUTIONS_KEY, {})
    );

    // Carregar estado inicial
    useEffect(() => {
        const saved = loadFromStorage<{balance: number, transactions: SosTransaction[]}>(SOS_TOKEN_STORAGE_KEY, {
            balance: 0,
            transactions: []
        });
        setBalance(saved.balance);
        setTransactions(saved.transactions);
    }, []);

    // Persistir mudanças
    useEffect(() => {
        saveToStorage(SOS_TOKEN_STORAGE_KEY, { balance, transactions });
    }, [balance, transactions]);

    useEffect(() => {
        saveToStorage(PROJECT_CONTRIBUTIONS_KEY, projectContributions);
    }, [projectContributions]);

    const claimRewards = useCallback(() => {
        const rewardAmount = 10;
        const newTx: SosTransaction = {
            id: `tx-${Date.now()}`,
            timestamp: Date.now(),
            type: 'RECOMPENSA',
            amount: rewardAmount,
            target: 'Carteira do Guardião',
            status: 'CONCLUÍDO'
        };
        
        setBalance(prev => prev + rewardAmount);
        setTransactions(prev => [newTx, ...prev]);
        return rewardAmount;
    }, []);

    const mintFromForge = useCallback((hashCount: number) => {
        if (hashCount <= 0) return;
        
        const mintedAmount = hashCount / HASH_TO_TOKEN_RATIO;
        setBalance(prev => prev + mintedAmount);
        
        if (mintedAmount > 0.001) {
            const newTx: SosTransaction = {
                id: `forge-${Date.now()}`,
                timestamp: Date.now(),
                type: 'FORJA',
                amount: mintedAmount,
                target: 'Mineração Local',
                status: 'CONCLUÍDO'
            };
            setTransactions(prev => [newTx, ...prev.slice(0, 49)]);
        }
    }, []);

    const transferToProject = useCallback((projectName: string, amount: number) => {
        if (amount <= 0) throw new Error("Quantidade inválida.");
        if (amount > balance) throw new Error("Saldo de SOS insuficiente na Forja Soberana.");

        const newTx: SosTransaction = {
            id: `proj-${Date.now()}`,
            timestamp: Date.now(),
            type: 'PROJETO',
            amount: -amount,
            target: projectName,
            status: 'CONCLUÍDO'
        };

        setBalance(prev => prev - amount);
        setTransactions(prev => [newTx, ...prev]);
        setProjectContributions(prev => ({
            ...prev,
            [projectName]: (prev[projectName] || 0) + amount
        }));

        return true;
    }, [balance]);

    const sendTokens = useCallback((to: string, amount: number) => {
        if (amount > balance) throw new Error("Saldo insuficiente de SOS Tokens.");
        if (amount <= 0) throw new Error("Quantidade inválida.");

        const newTx: SosTransaction = {
            id: `tx-${Date.now()}`,
            timestamp: Date.now(),
            type: 'TRANSFERÊNCIA',
            amount: -amount,
            target: to,
            status: 'CONCLUÍDO'
        };

        setBalance(prev => prev - amount);
        setTransactions(prev => [newTx, ...prev]);
    }, [balance]);

    return { 
        balance, 
        transactions, 
        projectContributions,
        claimRewards, 
        sendTokens, 
        mintFromForge, 
        transferToProject 
    };
};
