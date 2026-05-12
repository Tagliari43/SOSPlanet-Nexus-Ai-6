# Primeiros Passos Técnicos (Desenvolvedores)

Seja muito bem-vindo à sala de máquinas do Santuário.

Para colaborar perfeitamente na engenharia das trilhas SOSPlanet:

## O Stack
- Vite & React
- TypeScript Escrito com alma.
- Tailwind CSS (As veias de styling, puramente utility-classes ou arquivos unificados em \`index.css\`).
- Banco de Dados RLS (Supabase Postgres)

## Como Desenvolver
1. \`npm run dev\`
Certifique-se de configurar e subir as rotas em sua máquina local.

2. **Aba de Supabase Local**
A SOSPlanet utiliza políticas de Row-Level-Security rigorosas. Toda manipulação do sistema via Supabase deve prever as Policies (\`anon\`, \`auth\`).

3. **Injetando a IA**
Para integrar com o Orquestrador ou as engrenagens IAs (Groq, Gemini), nós utilizamos as integrações diretas do Node com chaves blindadas. NUNCA faça *commit* das suas chaves (confirme em \`.env.example\`).
Siga nossa filosofia On-Chain.

## A Arquitetura de Pastas
\`\`\`
/src
    /components   -> Componentes baseados em interface de usuário e módulos de abas (Telemetria, Farol, Jornada, Tesouraria).
    /services     -> Conexões diretas da DAO com o back-end (Supabase, IAs).
    /utils        -> As peças base, e dados mockados para IAs, utilitários.
/docs             -> Sabedoria persistente
/tests            -> Áreas de quarentena de stress-tests
\`\`\`
