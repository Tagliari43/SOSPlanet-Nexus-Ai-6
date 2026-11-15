/**
 * @file environmentalSensorService.ts
 * @description Serviço de Percepção Sensorial Expandida (Pilar 3) da Nação SOSPlanet.
 * Responsável por conectar o Nexus e o Santuário a fontes de dados ambientais do mundo real (Satélites, Clima, NDVI, etc.).
 */

export interface EnvironmentalMetric {
  id: string;
  region: string;
  metricName: string;
  value: number;
  unit: string;
  status: 'normal' | 'alerta' | 'critico';
  timestamp: string;
}

export class EnvironmentalSensorService {
  private static instance: EnvironmentalSensorService;

  private constructor() {}

  public static getInstance(): EnvironmentalSensorService {
    if (!EnvironmentalSensorService.instance) {
      EnvironmentalSensorService.instance = new EnvironmentalSensorService();
    }
    return EnvironmentalSensorService.instance;
  }

  /**
  * Simula ou consulta métricas ambientais globais em tempo real (preparado para APIs NASA/ESA/OpenWeather).
  */
  public async fetchGlobalEnvironmentalMetrics(): Promise<EnvironmentalMetric[]> {
    // No futuro, aqui entraremos com requisições HTTP reais para APIs de monitoramento terrestre.
    const mockMetrics: EnvironmentalMetric[] = [
      {
        id: 'env-01',
        region: 'Amazônia Central',
        metricName: 'Índice de Vegetação (NDVI)',
        value: 0.82,
        unit: 'NDVI',
        status: 'normal',
        timestamp: new Date().toISOString()
      },
      {
        id: 'env-02',
        region: 'Bacia do Pantanal',
        metricName: 'Índice de Estresse Hídrico',
        value: 0.65,
        unit: 'SPI',
        status: 'alerta',
        timestamp: new Date().toISOString()
      },
      {
        id: 'env-03',
        region: 'Global Carbon Index',
        metricName: 'Emissões de CO2 Equivalente',
        value: 421.5,
        unit: 'ppm',
        status: 'alerta',
        timestamp: new Date().toISOString()
      }
    ];

    return mockMetrics;
  }

  /**
  * Emite um alerta ecológico proativo com base nas métricas sensoriais.
  */
  public evaluateEcologicalAlerts(metrics: EnvironmentalMetric[]): string[] {
    const alerts: string[] = [];
    metrics.forEach(m => {
      if (m.status === 'alerta' || m.status === 'critico') {
        alerts.push(`[ALERTA GAIA-EYE] Região: ${m.region} | Indicador: ${m.metricName} atingiu nível ${m.status.toUpperCase()} (${m.value} ${m.unit}). Ação regenerativa recomendada.`);
      }
    });
    return alerts;
  }
}

export const environmentalSensor = EnvironmentalSensorService.getInstance();
