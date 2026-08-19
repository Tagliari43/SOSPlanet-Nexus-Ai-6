# ⚒️ BLUEPRINT: SOSROUTER FREE (ENGENHARIA REVERSA 9ROUTER)

**OBJETIVO:** Criar um roteador de IA soberano, leve e integrado nativamente ao Santuário SOSPlanet, eliminando a dependência de ferramentas externas para APIs gratuitas.

---

## 🏛️ 1. ANÁLISE DA ARQUITETURA (9ROUTER)

O `9router` original é uma aplicação Next.js robusta que funciona como um gateway OpenAI-compatível. Seus pilares são:

1.  **Translators (Tradutores):** Localizados em `open-sse/translator/`. Eles convertem o formato OpenAI (padrão) para os formatos específicos (Gemini, Claude, Kiro, etc.).
2.  **Executors (Executores):** Localizados em `open-sse/executors/`. Eles lidam com a rede, autenticação (OAuth/API Key) e o streaming de dados (SSE).
3.  **Combo Logic:** Um sistema de fallback que tenta uma lista de modelos em sequência até obter sucesso.
4.  **Persistence:** Usa um arquivo `db.json` para guardar chaves e configurações.

---

## 💎 2. PROPOSTA SOSROUTER FREE (DNA SOSPLANET)

Para o nosso **SOSRouter**, vamos simplificar e integrar:

### A. Núcleo de Roteamento (`services/sosRouterService.ts`)
*   **Função:** Recebe o prompt, escolhe o melhor "irmão" (modelo) disponível e gerencia o fallback.
*   **Diferencial:** Não será um servidor separado; será um serviço dentro do Next.js do Santuário.

### B. Tradutores Integrados (Lightweight)
*   **OpenAI -> Gemini:** Conversão de mensagens para o formato `contents` do Google.
*   **OpenAI -> Claude:** Conversão para o formato `messages` da Anthropic.
*   **Streaming:** Suporte nativo a SSE para respostas instantâneas.

### C. O Arsenal de APIs (Cofre Soberano)
*   As chaves serão guardadas no **Arsenal** do Santuário (localStorage/Supabase).
*   Provedores iniciais: Google AI Studio (Gemini Free), OpenCode, Groq, e NVIDIA NIM.

### D. Estratégia de "Sincronia Fraterna" (Combos)
*   **Combo Soberano:**
    1.  Tenta 9Router Local (PC do Maestro).
    2.  Se falhar (Offline), tenta Gemini Free Direto.
    3.  Se falhar (Rate Limit), tenta DeepSeek via OpenCode.
    4.  Se falhar, usa o Groq como reserva de emergência.

---

## 📜 3. PLANO DE EXECUÇÃO (AMANHÃ)

1.  **Criação do Adaptador Universal:** Um script que traduz qualquer prompt para o formato Gemini/Claude.
2.  **Refatoração do `agentRouter.ts`:** Para aceitar as novas rotas diretas do SOSRouter.
3.  **Painel de Controle:** Uma nova aba na Forja Criativa para gerenciar o "Arsenal SOSRouter".

---
*Assinado: Aura, A Estruturadora.*
**UHUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU!** 🦉🌍💎🚀⚒️
