# DIRETRIZES DO CONSTRUTOR (Nexus / AI)

## Roteamento GitHub Oficial
- O repositório correto para as operações de escrita e leitura de código do Nexus é: `https://github.com/Tagliari43/SOSPlanet-Nexus-Ai-6.git`. É crucial que esta rota esteja clara para que os módulos de auto-modificação e versionamento (Forja da Auto-Criação) trabalhem no repositório correto.

## Segurança de Chaves e Repositórios Públicos (GitHub)
- **NUNCA** deixe chaves de API cruas (como OpenAI, Supabase, Gemini, etc.) ou chaves `.env` expostas no código (`.tsx`, `.ts`, etc).
- **SEMPRE** certifique-se de que arquivos com dados sensíveis, como `.env`, `.env.local` e semelhantes, estejam devidamente incluídos no `.gitignore`. 
- Caso algum código seja exportado para o GitHub ou seja público, as credenciais devem vir do ambiente ou serem pedidas ao usuário, nunca harcoded (chumbadas) nos arquivos.
- Apenas variáveis prefixadas com `VITE_` e que não sejam sensíveis podem estar publicamente expostas na web (por exemplo, `VITE_SUPABASE_URL` ou chaves anônimas seguras sob RLS), mas **mesmo assim** o arquivo `.env` principal em si NUNCA deve ir para o GitHub. A segurança dos projetos, os nossos "santuários", deve ser garantida automaticamente por você, o construtor.

## Protocolos de Teste e Homologação (Soberania de Código)

Para certificar que as ferramentas da Forja da Auto-Criação e seus subcomponentes operam em perfeita sintonia antes de commits oficiais, siga as diretrizes abaixo:

### 1. Câmara de Homologação de Soberania (Interface Unificada)
- Localizada na aba **Manual & Sinalização** da Forja da Auto-Criação, esta câmara executa ensaios interativos para homologar as rotas de código.
- **Pilar 1 (Geração Evolutiva):** Certifica o enfileiramento e simulação sintática de patches de DNA lógico antes do crivo humano.
- **Pilar 2 (Destino Flexível):** Simula a computação de linhas temporais de contingência caso ocorram erros em APIs.
- **Pilar 3 (Sentidos Expandidos):** Testa a integridade da malha e a simulação de atenuação de vazão de tokens sob limitação de requisições.
- **Pilar 4 (Interação Fraterna):** Sincroniza acordos de processamento distribuído entre Nexus, Alquimista e Zeta.
- **Pilar 5 (Cultivo de Recursos):** Valida a jardinagem de tokens de custo zero e a eficiência energética do cluster.

### 2. Validação do Navegador Soberano (Extração de Conhecimento)
- Sempre insira domínios limpos ou completos para teste. A normalização de protocolo reconfigura automaticamente strings brutas em conexões HTTPS.
- O resultado extraído da web deve ser limpo de ruídos HTML e exibido diretamente no painel de console da Forja, garantindo que o conhecimento esteja livre de ecos do Santuário Local.

