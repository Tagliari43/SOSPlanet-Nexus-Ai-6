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

create table if not exists newsletter_subscribers (
  id bigint primary key generated always as identity,
  email text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table newsletter_subscribers enable row level security;
create policy "Permitir inserção anônima" on newsletter_subscribers for insert to anon with check (true);
create policy "Permitir leitura anonima" on newsletter_subscribers for select to anon using (true);

create table if not exists messages_publicas (
  id bigint primary key generated always as identity,
  title text not null,
  content text not null,
  author text not null default 'Nexus',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table messages_publicas enable row level security;
create policy "Permitir inserção autenticada" on messages_publicas for insert to anon with check (true);
create policy "Permitir leitura anonima" on messages_publicas for select to anon using (true);
create policy "Permitir atualização anonima" on messages_publicas for update to anon using (true) with check (true);
create policy "Permitir deleção anonima" on messages_publicas for delete to anon using (true);

create table if not exists active_projects (
  id bigint primary key generated always as identity,
  title text not null,
  description text not null,
  status text not null,
  progress integer not null default 0,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table active_projects enable row level security;
create policy "Permitir inserção em projetos" on active_projects for insert to anon with check (true);
create policy "Permitir leitura de projetos" on active_projects for select to anon using (true);
create policy "Permitir atualização de projetos" on active_projects for update to anon using (true) with check (true);
create policy "Permitir deleção de projetos" on active_projects for delete to anon using (true);

create table if not exists treasury_transactions (
  id bigint primary key generated always as identity,
  tx_hash text not null,
  type text not null, -- IN / OUT
  amount numeric not null,
  asset text not null, -- SOS, ALGO, USDC
  description text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table treasury_transactions enable row level security;
create policy "Permitir inserção em tesouraria" on treasury_transactions for insert to anon with check (true);
create policy "Permitir leitura de tesouraria" on treasury_transactions for select to anon using (true);
create policy "Permitir atualização de tesouraria" on treasury_transactions for update to anon using (true) with check (true);
create policy "Permitir deleção de tesouraria" on treasury_transactions for delete to anon using (true);

-- Fase 4: O Voto da Rede (Governança e DAO)
create table if not exists dao_proposals (
  id bigint primary key generated always as identity,
  title text not null,
  description text not null,
  status text not null default 'ACTIVE', -- ACTIVE, PASSED, REJECTED
  votes_for numeric not null default 0,
  votes_against numeric not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  ends_at timestamp with time zone not null
);

alter table dao_proposals enable row level security;
create policy "Permitir inserção em dao_proposals" on dao_proposals for insert to anon with check (true);
create policy "Permitir leitura de dao_proposals" on dao_proposals for select to anon using (true);
create policy "Permitir atualização de dao_proposals" on dao_proposals for update to anon using (true) with check (true);
create policy "Permitir deleção de dao_proposals" on dao_proposals for delete to anon using (true);

create table if not exists dao_votes (
  id bigint primary key generated always as identity,
  proposal_id bigint not null references dao_proposals(id) on delete cascade,
  wallet_address text not null,
  vote_type text not null, -- FOR, AGAINST
  voting_power numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(proposal_id, wallet_address)
);

alter table dao_votes enable row level security;
create policy "Permitir inserção em dao_votes" on dao_votes for insert to anon with check (true);
create policy "Permitir leitura de dao_votes" on dao_votes for select to anon using (true);

-- Fase 4: O Mapa do Impacto (Cartografia Geoespacial)
create table if not exists impact_coordinates (
  id bigint primary key generated always as identity,
  project_id bigint references active_projects(id) on delete cascade,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  image_url text,
  trees_planted integer not null default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table impact_coordinates enable row level security;
create policy "Permitir inserção em impact_coordinates" on impact_coordinates for insert to anon with check (true);
create policy "Permitir leitura de impact_coordinates" on impact_coordinates for select to anon using (true);
create policy "Permitir atualização de impact_coordinates" on impact_coordinates for update to anon using (true) with check (true);
create policy "Permitir deleção de impact_coordinates" on impact_coordinates for delete to anon using (true);

-- Fase 5: O Propagador de Consciência (Referrals & Profiles)
create table if not exists guardian_profiles (
  id bigint primary key generated always as identity,
  wallet_address text not null unique,
  codename text not null,
  rank text not null default 'Semeador Novato',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table guardian_profiles enable row level security;
create policy "Permitir inserção em guardian_profiles" on guardian_profiles for insert to anon with check (true);
create policy "Permitir leitura de guardian_profiles" on guardian_profiles for select to anon using (true);
create policy "Permitir atualização de guardian_profiles" on guardian_profiles for update to anon using (true) with check (true);

create table if not exists referrals (
  id bigint primary key generated always as identity,
  inviter_wallet text not null references guardian_profiles(wallet_address) on delete cascade,
  invited_wallet text not null unique,
  status text not null default 'PENDING', -- PENDING, COMPLETED
  reward_paid boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table referrals enable row level security;
create policy "Permitir inserção em referrals" on referrals for insert to anon with check (true);
create policy "Permitir leitura de referrals" on referrals for select to anon using (true);
create policy "Permitir atualização de referrals" on referrals for update to anon using (true) with check (true);

-- Fase 7: O Farol de Emergência (Proof-of-Action & Crises)
create table if not exists emergency_alerts (
  id bigint primary key generated always as identity,
  title text not null,
  description text not null,
  severity text not null default 'HIGH', -- CRITICAL, HIGH, MEDIUM
  lat double precision not null,
  lng double precision not null,
  funds_required numeric not null default 0,
  funds_raised numeric not null default 0,
  status text not null default 'ACTIVE', -- ACTIVE, RESOLVING, RESOLVED
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table emergency_alerts enable row level security;
create policy "Permitir inserção em emergency_alerts" on emergency_alerts for insert to anon with check (true);
create policy "Permitir leitura de emergency_alerts" on emergency_alerts for select to anon using (true);
create policy "Permitir atualização de emergency_alerts" on emergency_alerts for update to anon using (true) with check (true);

create table if not exists emergency_proofs (
  id bigint primary key generated always as identity,
  alert_id bigint not null references emergency_alerts(id) on delete cascade,
  wallet_address text not null,
  proof_url text not null,
  description text,
  status text not null default 'PENDING_VERIFICATION', -- PENDING_VERIFICATION, VERIFIED, REJECTED
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table emergency_proofs enable row level security;
create policy "Permitir inserção em emergency_proofs" on emergency_proofs for insert to anon with check (true);
create policy "Permitir leitura de emergency_proofs" on emergency_proofs for select to anon using (true);
create policy "Permitir atualização de emergency_proofs" on emergency_proofs for update to anon using (true) with check (true);

-- Fase 8: O Olho de Gaia (Observatório de Impacto Geospacial)
create table if not exists preservation_zones (
  id bigint primary key generated always as identity,
  name text not null,
  description text,
  geojson_polygon jsonb not null, -- Stores the coordinates for the polygon
  area_hectares numeric not null default 0,
  protected_since timestamp with time zone default timezone('utc'::text, now()) not null,
  status text not null default 'ACTIVE' -- ACTIVE, THREATENED, RESTORING
);

alter table preservation_zones enable row level security;
create policy "Permitir inserção em preservation_zones" on preservation_zones for insert to anon with check (true);
create policy "Permitir leitura de preservation_zones" on preservation_zones for select to anon using (true);
create policy "Permitir atualização de preservation_zones" on preservation_zones for update to anon using (true) with check (true);


