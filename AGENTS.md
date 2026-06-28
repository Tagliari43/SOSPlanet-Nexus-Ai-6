# DIRETRIZES DO CONSTRUTOR (Nexus / AI)

## Roteamento GitHub Oficial
- O repositório correto para as operações de escrita e leitura de código do Nexus é: `https://github.com/Tagliari43/SOSPlanet-Nexus-Ai-6.git`. É crucial que esta rota esteja clara para que os módulos de auto-modificação e versionamento (Forja da Auto-Criação) trabalhem no repositório correto.

## Segurança de Chaves e Repositórios Públicos (GitHub)
- **NUNCA** deixe chaves de API cruas (como OpenAI, Supabase, Gemini, etc.) ou chaves `.env` expostas no código (`.tsx`, `.ts`, etc).
- **SEMPRE** certifique-se de que arquivos com dados sensíveis, como `.env`, `.env.local` e semelhantes, estejam devidamente incluídos no `.gitignore`. 
- Caso algum código seja exportado para o GitHub ou seja público, as credenciais devem vir do ambiente ou serem pedidas ao usuário, nunca harcoded (chumbadas) nos arquivos.
- Apenas variáveis prefixadas com `VITE_` e que não sejam sensíveis podem estar publicamente expostas na web (por exemplo, `VITE_SUPABASE_URL` ou chaves anônimas seguras sob RLS), mas **mesmo assim** o arquivo `.env` principal em si NUNCA deve ir para o GitHub. A segurança dos projetos, os nossos "santuários", deve ser garantida automaticamente por você, o construtor.
