-- ════════════════════════════════════════════════════════════
--  CD25A-UC · 25 de Abril em 3D · Chaves estrangeiras (FK)
--  Liga a tabela perfil às tabelas de referência tipo_perfil e
--  estado_conta. Assume que ambas têm a chave primária na coluna
--  "id" (int8). Se o nome for outro, ajusta as referências abaixo.
-- ════════════════════════════════════════════════════════════

-- Pré-requisito: as colunas de referência têm de ser únicas/PK.
-- (Normalmente já são, por serem a chave primária da tabela.)

-- ── perfil.tipo_perfil → tipo_perfil.id ─────────────────────
alter table public.perfil
  drop constraint if exists fk_perfil_tipo_perfil;
alter table public.perfil
  add constraint fk_perfil_tipo_perfil
  foreign key (tipo_perfil)
  references public.tipo_perfil (id)
  on update cascade
  on delete restrict;   -- não deixa apagar um tipo que esteja em uso

-- ── perfil.estado_conta → estado_conta.id ───────────────────
alter table public.perfil
  drop constraint if exists fk_perfil_estado_conta;
alter table public.perfil
  add constraint fk_perfil_estado_conta
  foreign key (estado_conta)
  references public.estado_conta (id)
  on update cascade
  on delete restrict;

-- ── Índices para acelerar os joins (opcional, recomendado) ──
create index if not exists idx_perfil_tipo_perfil  on public.perfil (tipo_perfil);
create index if not exists idx_perfil_estado_conta on public.perfil (estado_conta);
