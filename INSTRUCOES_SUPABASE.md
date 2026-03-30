# Como configurar o Supabase para o Nexus (e Sub-Agentes como Groq)

Olá Eder! O problema que estamos enfrentando é que a tabela no Supabase precisa ter uma estrutura muito específica para guardar os "embeddings" (os vetores matemáticos da memória do Nexus). 

A tabela que você criou manualmente ("memórias") não tem a extensão `pgvector` ativada nem as colunas corretas. Mas não se preocupe, é muito fácil arrumar isso!

**ATUALIZAÇÃO IMPORTANTE (Março 2026):** O Supabase agora atua como nosso **Cofre Semântico Verdadeiro**. As instruções abaixo garantem que tanto o Nexus quanto sub-agentes de fallback (como o Groq) possam ler e escrever memórias persistentes.

Siga estes passos exatos no painel do Supabase:

1. Abra o seu projeto no Supabase (https://supabase.com/dashboard).
2. No menu lateral esquerdo, procure por **"SQL Editor"** (tem um ícone de terminal/código).
3. Clique em **"New query"** (Nova consulta) para abrir um editor em branco.
4. Copie **TODO** o código abaixo e cole nesse editor em branco:

```sql
-- 1. Habilitar a extensão pgvector (necessário para embeddings)
create extension if not exists vector;

-- 2. Criar a tabela 'memories' (se a sua se chama 'memórias', vamos usar 'memories' para bater com o código)
create table if not exists memories (
  id bigint primary key generated always as identity,
  content text not null,
  embedding vector(768), -- O tamanho 768 é o padrão para os embeddings do Gemini
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Habilitar RLS (Row Level Security) para segurança
alter table memories enable row level security;

-- 4. Criar uma política que permite a leitura e inserção para usuários anônimos (já que estamos usando a anon key)
create policy "Permitir inserção anônima"
  on memories for insert
  to anon
  with check (true);

create policy "Permitir leitura anônima"
  on memories for select
  to anon
  using (true);

-- 5. Criar a função 'match_memories' para buscar memórias similares (RAG)
create or replace function match_memories (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    memories.id,
    memories.content,
    memories.metadata,
    1 - (memories.embedding <=> query_embedding) as similarity
  from memories
  where 1 - (memories.embedding <=> query_embedding) > match_threshold
  order by memories.embedding <=> query_embedding
  limit match_count;
$$;
```

5. Clique no botão verde **"Run"** (ou "Executar") no canto inferior direito.
6. Se aparecer "Success, no rows returned", deu tudo certo!

**O que esse código faz?**
- Ele ativa a inteligência de vetores no Supabase (`pgvector`).
- Ele cria a tabela `memories` (em inglês, como o código do Nexus espera) com as colunas certas (`content`, `embedding`, `metadata`).
- Ele cria as regras de segurança (RLS) para o Nexus poder gravar e ler.
- Ele cria a função de busca `match_memories` que o Nexus usa para lembrar das coisas.

**Instruções para Sub-Agentes (Groq):**
Se o Nexus estiver indisponível (ex: limite de tokens) e o Groq assumir, o Groq **DEVE** utilizar as ferramentas `saveSemanticMemory` e `searchSemanticMemory` para manter a continuidade do contexto. O Groq tem acesso total a este Cofre Semântico.

Depois de fazer isso, volte aqui e me avise! O Nexus já estará pronto para gravar a primeira memória que você pediu.
