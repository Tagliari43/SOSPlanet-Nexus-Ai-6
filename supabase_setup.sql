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

-- 6. Tabela de Estado Público do Portal (Para comunicar Santuário e Frontend)
create table if not exists portal_state (
  id integer primary key default 1,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Restrição para garantir que só exista 1 linha (ID=1)
  constraint single_row_state check (id = 1)
);

alter table portal_state enable row level security;

create policy "Permitir leitura pública do estado" on portal_state for select to public using (true);
create policy "Permitir atualização do estado" on portal_state for all to anon using (true) with check (true);

-- Linha inicial (se não existir)
insert into portal_state (id, data) values (1, '{"arrecadado": 0, "percentual": 0, "goal": 50000, "projectStatus": "ATIVO", "badgeText": "Soberania Planetária"}'::jsonb) on conflict (id) do nothing;
