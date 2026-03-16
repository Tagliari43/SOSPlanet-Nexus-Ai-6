
export interface SatelliteData {
    timestamp: number;
    ndvi: number; // Normalized Difference Vegetation Index (0 to 1)
    canopyCover: number; // %
    temperature: number; // Celsius
    heatSpots: number;
    deforestationAlerts: number;
    carbonSequestration: number; // tons/ha
    status: 'Saudável' | 'Sob Observação' | 'Alerta';
    historicalNdvi?: { date: string; value: number }[];
}

export const fetchSatelliteTelemetry = async (coords: { lat: number, lng: number }): Promise<SatelliteData> => {
    // Simulação de processamento de imagem de satélite
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const ndviBase = 0.82;
    const variation = (Math.random() * 0.05) - 0.02;
    const ndvi = +(ndviBase + variation).toFixed(2);
    const heatSpots = Math.random() > 0.92 ? Math.floor(Math.random() * 2) : 0;
    
    let status: SatelliteData['status'] = 'Saudável';
    if (heatSpots > 0) status = 'Sob Observação';
    if (ndvi < 0.75) status = 'Alerta';

    // Gerar histórico simulado dos últimos 6 meses
    const historicalNdvi = [
        { date: 'Set/24', value: 0.72 },
        { date: 'Out/24', value: 0.75 },
        { date: 'Nov/24', value: 0.78 },
        { date: 'Dez/24', value: 0.79 },
        { date: 'Jan/25', value: 0.81 },
        { date: 'Fev/25', value: ndvi }
    ];

    return {
        timestamp: Date.now(),
        ndvi,
        canopyCover: +(90 + variation * 10).toFixed(1),
        temperature: +(26 + Math.random() * 4).toFixed(1),
        heatSpots,
        deforestationAlerts: Math.random() > 0.97 ? 1 : 0,
        carbonSequestration: +(12.5 + variation).toFixed(2),
        status,
        historicalNdvi
    };
};
