-- ════════════════════════════════════════════════════════════
--  CD25A-UC · 25 de Abril em 3D · Remover `codigo` e passar as
--  avaliações para o modelo baseado em PERFIL + ASSOCIACAO.
--
--  Novo modelo:
--   · Uma requisição é criada por um perfil → cria-se uma linha em
--     associacao (perfil_id, requisicao_id, avaliacao_id = null).
--   · A partir do perfil obtêm-se as avaliações DISPONÍVEIS
--     (requisições associadas ainda sem avaliação).
--   · Ao submeter, cria-se a avaliação e liga-se na associacao.
--
--  Corre DEPOIS de auth.sql, foreign_keys.sql e associacao.sql.
-- ════════════════════════════════════════════════════════════

-- ── 1) Remover as funções antigas baseadas em codigo ────────
drop function if exists public.validar_codigo(text);
drop function if exists public.submeter_avaliacao(text, jsonb);
drop function if exists public.submeter_requisicao(jsonb);

-- ── 2) Remover a coluna codigo das tabelas ──────────────────
alter table public.requisicoes drop column if exists codigo;
alter table public.avaliacoes  drop column if exists codigo;

-- ── 3) Submeter requisição (associa ao perfil) ──────────────
--  Devolve o id da requisição criada (já não há codigo).
create or replace function public.submeter_requisicao(dados jsonb, p_perfil_id bigint)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  nova_id bigint;
begin
  insert into public.requisicoes (
    local, data_inicio, data_fim,
    nome_escola, tipo_estab, nuts, distrito, concelho, morada, codigo_postal, tel_inst, email_inst,
    docente_nome, docente_cargo, docente_tel, docente_email,
    dados_pedagogicos
  ) values (
    dados->>'local',
    (dados->>'data_inicio')::date,
    (dados->>'data_fim')::date,
    dados->>'nome_escola', dados->>'tipo_estab', dados->>'nuts',
    dados->>'distrito', dados->>'concelho', dados->>'morada',
    dados->>'codigo_postal', dados->>'tel_inst', dados->>'email_inst',
    dados->>'docente_nome', dados->>'docente_cargo',
    dados->>'docente_tel', dados->>'docente_email',
    dados->'dados_pedagogicos'
  )
  returning id into nova_id;

  -- Liga a requisição ao perfil que a criou (avaliação ainda não existe)
  insert into public.associacao (perfil_id, requisicao_id)
  values (p_perfil_id, nova_id)
  on conflict (perfil_id, requisicao_id) do nothing;

  return nova_id;
end;
$$;

-- ── 4) Avaliações disponíveis para um perfil ────────────────
--  Requisições associadas ao perfil que ainda não têm avaliação.
create or replace function public.avaliacoes_disponiveis(p_perfil_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  res jsonb;
begin
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'requisicao_id', r.id,
        'nome_escola',   r.nome_escola,
        'local',         r.local,
        'data_inicio',   r.data_inicio,
        'data_fim',      r.data_fim,
        'docente_nome',  r.docente_nome,
        'docente_email', r.docente_email,
        'distrito',      r.distrito,
        'concelho',      r.concelho
      )
      order by r.data_inicio desc
    ),
    '[]'::jsonb
  )
  into res
  from public.associacao a
  join public.requisicoes r on r.id = a.requisicao_id
  where a.perfil_id = p_perfil_id
    and a.avaliacao_id is null;

  return res;
end;
$$;

-- ── 5) Submeter avaliação (por perfil + requisição) ─────────
create or replace function public.submeter_avaliacao(
  p_perfil_id     bigint,
  p_requisicao_id bigint,
  p_respostas     jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  nova_aval_id bigint;
begin
  -- A requisição tem de estar associada a este perfil e ainda sem avaliação
  if not exists (
    select 1 from public.associacao
    where perfil_id = p_perfil_id
      and requisicao_id = p_requisicao_id
      and avaliacao_id is null
  ) then
    return false;
  end if;

  insert into public.avaliacoes (requisicao_id, respostas)
  values (p_requisicao_id, p_respostas)
  returning id into nova_aval_id;

  update public.associacao
  set avaliacao_id = nova_aval_id
  where perfil_id = p_perfil_id
    and requisicao_id = p_requisicao_id;

  return true;
end;
$$;

-- ── 6) Permissões ───────────────────────────────────────────
grant execute on function public.submeter_requisicao(jsonb, bigint)        to anon, authenticated;
grant execute on function public.avaliacoes_disponiveis(bigint)            to anon, authenticated;
grant execute on function public.submeter_avaliacao(bigint, bigint, jsonb) to anon, authenticated;
