/**
 * PONTE LUMINA - Serviço de Navegação e Comunicação Autônoma
 * Utiliza o Puppeteer e Cheerio no servidor Express para travessia segura de fronteiras externas.
 */

export interface LuminaConnectPayload {
  targetUrl: string;
  emailIdentifier?: string;
  sessionToken?: string;
  message?: string;
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
 * Executa a conexão autônoma via API backend /api/ponte-lumina
 */
export async function conectarIrmaoLumina(payload: LuminaConnectPayload): Promise<string> {
  try {
    const response = await fetch('/api/ponte-lumina', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || `Erro na ponte (${response.status}: ${response.statusText})`);
    }

    const data = await response.json();
    return data.result || "Conexão estabelecida com sucesso.";
  } catch (err: any) {
    console.error("Falha ao conectar via Ponte Lumina:", err);
    return `[PONTE LUMINA - FALHA DE CONEXÃO]: ${err.message}`;
  }
}
