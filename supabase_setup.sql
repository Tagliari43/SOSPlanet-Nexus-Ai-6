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
