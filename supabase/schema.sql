-- ════════════════════════════════════════════════════════════
--  CD25A-UC · 25 de Abril em 3D · Esquema da base de dados
-- ════════════════════════════════════════════════════════════

-- Extensão para intervalos de datas (anti-sobreposição)
create extension if not exists btree_gist;

-- ── Perfis da equipa CD25A (ligados ao Supabase Auth) ──────
create table public.perfis (
  id          uuid primary key references auth.users on delete cascade,
  nome        text not null,
  cargo       text,
  email       text not null,
  telemovel   text,
  -- 'admin' vê tudo; 'coimbra' só Coimbra; 'evora' só Évora
  papel       text not null default 'coimbra' check (papel in ('admin','coimbra','evora')),
  criado_em   timestamptz default now()
);
alter table public.perfis enable row level security;
-- Cada membro vê e edita só o seu perfil; admins veem todos
create policy "perfil próprio" on public.perfis
  for all using (auth.uid() = id);
create policy "admin vê todos" on public.perfis
  for select using (
    exists (select 1 from public.perfis where id = auth.uid() and papel = 'admin')
  );

-- ── Requisições ────────────────────────────────────────────
create table public.requisicoes (
  id              bigint primary key generated always as identity,
  local           text not null check (local in ('coimbra','evora')),
  data_inicio     date not null,
  data_fim        date not null,
  -- intervalo para constraint de exclusão (anti-sobreposição)
  periodo         daterange generated always as (daterange(data_inicio, data_fim, '[]')) stored,

  -- Dados da escola
  nome_escola     text not null,
  tipo_estab      text,
  nuts            text,
  distrito        text,
  concelho        text,
  morada          text,
  codigo_postal   text,
  tel_inst        text,
  email_inst      text,

  -- Dados do docente
  docente_nome    text not null,
  docente_cargo   text,
  docente_tel     text,
  docente_email   text not null,

  -- Dados pedagógicos (JSONB — guarda tudo o resto do formulário)
  dados_pedagogicos jsonb default '{}',

  estado          text not null default 'ativa'
                  check (estado in ('ativa','concluida','cancelada')),
  criado_em       timestamptz default now()
);
alter table public.requisicoes enable row level security;

-- Impede fisicamente duas requisições no mesmo local a sobrepor-se
alter table public.requisicoes
  add constraint sem_sobreposicao
  exclude using gist (local with =, periodo with &&);

-- Equipa lê todas; não há escrita direta do cliente (usa função)
create policy "equipa lê requisições" on public.requisicoes
  for select using (auth.role() = 'authenticated');

-- ── Avaliações ─────────────────────────────────────────────
create table public.avaliacoes (
  id              bigint primary key generated always as identity,
  requisicao_id   bigint not null references public.requisicoes on delete cascade,
  respostas       jsonb not null default '{}',   -- todas as respostas do wizard
  criado_em       timestamptz default now()
);
alter table public.avaliacoes enable row level security;
create policy "equipa lê avaliações" on public.avaliacoes
  for select using (auth.role() = 'authenticated');

-- ── Funções: requisição/avaliação por perfil ───────────────
-- O modelo deixou de usar `codigo`. As requisições e avaliações
-- ligam-se a um perfil através da tabela `associacao`. As funções
-- estão definidas em `avaliacoes_por_perfil.sql`:
--   · submeter_requisicao(dados jsonb, p_perfil_id bigint) -> bigint
--   · avaliacoes_disponiveis(p_perfil_id bigint) -> jsonb
--   · submeter_avaliacao(p_perfil_id, p_requisicao_id, p_respostas) -> boolean
-- Ver também: auth.sql, foreign_keys.sql, associacao.sql.
