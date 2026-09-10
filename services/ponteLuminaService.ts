/**
 * PONTE LUMINA - Serviço de Navegação e Comunicação Autônoma
 * Utiliza o Puppeteer e Cheerio no servidor Express para travessia segura de fronteiras externas.
 */

export interface LuminaConnectPayload {
  targetUrl: string;
  emailIdentifier?: string;
  password?: string;
  sessionToken?: string;
  message?: string;
  selectors?: {
    loginInputSelector?: string;
    passwordInputSelector?: string;
    submitButtonSelector?: string;
    messageInputSelector?: string;
    sendMessageButtonSelector?: string;
  };
  timeoutMs?: number;
  useRemoteDebugging?: boolean;
  browserURL?: string;
  browserWSEndpoint?: string;
  remoteDebuggingPort?: number;
}

export interface LuminaConnectResponse {
  success: boolean;
  targetUrl: string;
  updatedCookies?: string;
  length: number;
  result: string;
  remoteConnected?: boolean;
}

export interface NavigationCredential {
  service: string;
  targetUrl: string;
  emailIdentifier: string;
  key: string;
}

/**
 * Busca credenciais de navegação cadastradas no Arsenal / Supabase
 */
export function getNavigationCredentials(serviceName: string, apiKeys: any[]): NavigationCredential | null {
  if (!apiKeys || !Array.isArray(apiKeys)) return null;
  const match = apiKeys.find(k => 
    k.method === 'navigation-credentials' && 
    (k.service.toLowerCase().includes(serviceName.toLowerCase()) || serviceName.toLowerCase().includes(k.service.toLowerCase()))
  );

  if (!match) return null;

  return {
    service: match.service,
    targetUrl: match.targetUrl || '',
    emailIdentifier: match.emailIdentifier || '',
    key: match.key || ''
  };
}

/**
 * Executa a interação dinâmica autônoma com um Portal de IA externo (Aura/Nexus Blueprint / Porta 9222)
 */
export async function interactWithAIPortal(payload: LuminaConnectPayload): Promise<LuminaConnectResponse> {
  try {
    const enrichedPayload = {
      ...payload,
      useRemoteDebugging: payload.useRemoteDebugging !== false,
      browserURL: payload.browserURL || "http://localhost:9222"
    };

    const response = await fetch('/api/ponte-lumina', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(enrichedPayload)
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || `Erro na ponte (${response.status}: ${response.statusText})`);
    }

    const data = await response.json();
    return {
      success: data.success ?? true,
      targetUrl: data.targetUrl || payload.targetUrl,
      updatedCookies: data.updatedCookies,
      length: data.length || 0,
      result: data.result || "Conexão estabelecida com sucesso.",
      remoteConnected: data.remoteConnected
    };
  } catch (err: any) {
    console.error("Falha ao interagir via Ponte Lumina:", err);
    return {
      success: false,
      targetUrl: payload.targetUrl,
      length: 0,
      result: `[PONTE LUMINA - FALHA DE CONEXÃO]: ${err.message}`
    };
  }
}

/**
 * Executa a conexão autônoma via API backend /api/ponte-lumina
 */
export async function conectarIrmaoLumina(payload: LuminaConnectPayload): Promise<string> {
  const res = await interactWithAIPortal(payload);
  return res.result;
}

export { 
  conectarPonteDepuracaoRemota, 
  testarConexaoChromeRemoto, 
  validarPrivacidadeAbaRemota, 
  gerarSaudacaoFraternaLumina 
} from './browserService';

