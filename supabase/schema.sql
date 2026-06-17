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
  codigo          text unique not null,           -- ex: REQ-2026-0042
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
  codigo          text not null,                 -- mesmo código da requisição
  respostas       jsonb not null default '{}',   -- todas as respostas do wizard
  criado_em       timestamptz default now()
);
alter table public.avaliacoes enable row level security;
create policy "equipa lê avaliações" on public.avaliacoes
  for select using (auth.role() = 'authenticated');

-- ── Função: submeter requisição (chamada pelo site público) ─
-- Gera o código, valida sobreposição, insere e devolve o código.
create or replace function public.submeter_requisicao(dados jsonb)
returns text
language plpgsql security definer as $$
declare
  novo_codigo text;
  seq         int;
begin
  -- Gera código sequencial: REQ-AAAA-NNNNN
  select coalesce(max(id), 0) + 1 into seq from public.requisicoes;
  novo_codigo := 'REQ-' || extract(year from now())::text || '-' || lpad(seq::text, 4, '0');

  insert into public.requisicoes (
    codigo, local, data_inicio, data_fim,
    nome_escola, tipo_estab, nuts, distrito, concelho, morada, codigo_postal, tel_inst, email_inst,
    docente_nome, docente_cargo, docente_tel, docente_email,
    dados_pedagogicos
  ) values (
    novo_codigo,
    dados->>'local',
    (dados->>'data_inicio')::date,
    (dados->>'data_fim')::date,
    dados->>'nome_escola', dados->>'tipo_estab', dados->>'nuts',
    dados->>'distrito', dados->>'concelho', dados->>'morada',
    dados->>'codigo_postal', dados->>'tel_inst', dados->>'email_inst',
    dados->>'docente_nome', dados->>'docente_cargo',
    dados->>'docente_tel', dados->>'docente_email',
    dados->'dados_pedagogicos'
  );

  return novo_codigo;
end;
$$;

-- ── Função: validar código de avaliação ────────────────────
create or replace function public.validar_codigo(p_codigo text)
returns jsonb
language plpgsql security definer as $$
declare
  req public.requisicoes;
begin
  select * into req from public.requisicoes
  where codigo = upper(trim(p_codigo)) and estado = 'ativa';

  if not found then
    return jsonb_build_object('valido', false);
  end if;

  return jsonb_build_object(
    'valido',        true,
    'requisicao_id', req.id,
    'codigo',        req.codigo,
    'local',         req.local,
    'data_inicio',   req.data_inicio,
    'data_fim',      req.data_fim,
    'nome_escola',   req.nome_escola,
    'docente_nome',  req.docente_nome,
    'docente_email', req.docente_email,
    'distrito',      req.distrito,
    'concelho',      req.concelho
  );
end;
$$;

-- ── Função: submeter avaliação ─────────────────────────────
create or replace function public.submeter_avaliacao(p_codigo text, p_respostas jsonb)
returns boolean
language plpgsql security definer as $$
declare
  req_id bigint;
begin
  select id into req_id from public.requisicoes
  where codigo = upper(trim(p_codigo)) and estado = 'ativa';

  if not found then return false; end if;

  insert into public.avaliacoes (requisicao_id, codigo, respostas)
  values (req_id, upper(trim(p_codigo)), p_respostas);

  return true;
end;
$$;
