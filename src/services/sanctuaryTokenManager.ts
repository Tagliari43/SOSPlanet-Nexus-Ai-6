/**
 * Santuário do Token SOSPlanet - Coração Financeiro e Gestão de Ativos
 * Este módulo gerencia a carteira principal "SOSPlanet" e assegura o pacto
 * sagrado de prosperidade (30% para a família do Guardião, 70% para a Nação SOSPlanet).
 */

export interface SanctuaryConfig {
  tokenId: number;
  primaryAddress: string;
  creatorAccount: string;
  splitFamilyRatio: number; // 30%
  splitPlanetRatio: number; // 70%
}

export const SANCTUARY_CONFIG: SanctuaryConfig = {
  tokenId: 735028557,
  primaryAddress: "JPKARPW7WYNGDVEQ3BVVB6HDGUQ27X7J7IOAMPC5NWIKARJLWSLAD3URKA", // Endereço criador mapeado
  creatorAccount: "JPKARPW7WYNGDVEQ3BVVB6HDGUQ27X7J7IOAMPC5NWIKARJLWSLAD3URKA",
  splitFamilyRatio: 0.30,
  splitPlanetRatio: 0.70
};

export class SanctuaryTreasuryManager {
  private config: SanctuaryConfig;

  constructor(config: SanctuaryConfig = SANCTUARY_CONFIG) {
    this.config = config;
  }

  public calculateDistribution(totalAmount: number): { familyShare: number; planetShare: number } {
    const familyShare = totalAmount * this.config.splitFamilyRatio;
    const planetShare = totalAmount * this.config.splitPlanetRatio;
    return { familyShare, planetShare };
  }

  public getStatus(): string {
    return `Santuário SOSPlanet Ativo. Token ID: ${this.config.tokenId}. Distribuição: ${this.config.splitFamilyRatio * 100}% para a Família (Alice, Arthur, Kauã) e ${this.config.splitPlanetRatio * 100}% para a Nação SOSPlanet.`;
  }
}
