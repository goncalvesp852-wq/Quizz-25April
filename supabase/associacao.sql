-- ════════════════════════════════════════════════════════════
--  CD25A-UC · 25 de Abril em 3D · Tabela de associação
--  Liga, por id (FK), uma REQUISIÇÃO a uma AVALIAÇÃO e a um
--  PERFIL (utilizador). A chave primária é composta e fica
--  associada ao perfil, como combinámos.
--
--  Mantém-se a coluna `codigo` nas tabelas requisicoes/avaliacoes
--  para o acesso público das escolas; esta tabela é a ligação
--  interna por id para a equipa/gestão.
-- ════════════════════════════════════════════════════════════

create table if not exists public.associacao (
  perfil_id     bigint not null,
  requisicao_id bigint not null,
  avaliacao_id  bigint,                 -- pode ser null até existir avaliação
  criado_em     timestamptz not null default now(),

  -- PK composta, associada ao perfil
  constraint pk_associacao primary key (perfil_id, requisicao_id),

  -- Cada avaliação só pode estar associada uma vez
  constraint uq_associacao_avaliacao unique (avaliacao_id),

  -- ── Chaves estrangeiras ──
  constraint fk_associacao_perfil
    foreign key (perfil_id)     references public.perfil (id)
    on update cascade on delete restrict,
  constraint fk_associacao_requisicao
    foreign key (requisicao_id) references public.requisicoes (id)
    on update cascade on delete cascade,
  constraint fk_associacao_avaliacao
    foreign key (avaliacao_id)  references public.avaliacoes (id)
    on update cascade on delete set null
);

-- Índices para acelerar os joins pelas FKs
create index if not exists idx_associacao_requisicao on public.associacao (requisicao_id);
create index if not exists idx_associacao_avaliacao  on public.associacao (avaliacao_id);

-- NOTA RLS: se quiseres restringir o acesso a esta tabela, ativa
-- depois com:  alter table public.associacao enable row level security;
-- e cria as policies adequadas ao papel (tipo_perfil) do utilizador.
