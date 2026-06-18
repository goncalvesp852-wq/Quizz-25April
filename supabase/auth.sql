-- ════════════════════════════════════════════════════════════
--  CD25A-UC · 25 de Abril em 3D · Autenticação (tabela perfil)
--  Login e registo contra a tabela public.perfil, com password
--  guardada como hash bcrypt. As funções são SECURITY DEFINER
--  para que a tabela perfil NUNCA seja lida diretamente pelo
--  cliente (o hash da password nunca sai da base de dados).
-- ════════════════════════════════════════════════════════════

-- Extensão de hashing (bcrypt via crypt/gen_salt)
create extension if not exists pgcrypto;

-- ── Hash automático da password (rede de segurança) ─────────
-- Mesmo que alguém escreva a password em claro na tabela, fica
-- guardada como hash. Não volta a aplicar hash a algo já com hash.
create or replace function public.hash_password_perfil()
returns trigger
language plpgsql as $$
begin
  if new.password is not null
     and new.password not like '$2%'
     and (tg_op = 'INSERT' or new.password is distinct from old.password)
  then
    new.password := crypt(new.password, gen_salt('bf'));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_hash_password on public.perfil;
create trigger trg_hash_password
  before insert or update on public.perfil
  for each row execute function public.hash_password_perfil();

-- ── Login ───────────────────────────────────────────────────
-- Recebe mail + password, devolve o perfil (sem a password) se
-- as credenciais baterem certo e a conta estiver ativa.
create or replace function public.login(p_mail text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.perfil;
begin
  select * into r from public.perfil
  where lower(mail) = lower(trim(p_mail));

  -- Utilizador não existe OU password errada → mesma mensagem
  if not found
     or r.password is null
     or r.password <> crypt(p_password, r.password)
  then
    return jsonb_build_object('ok', false, 'erro', 'credenciais');
  end if;

  -- Conta inativa (estado_conta = 1 significa ativa)
  if r.estado_conta is distinct from 1 then
    return jsonb_build_object('ok', false, 'erro', 'inativa');
  end if;

  return jsonb_build_object(
    'ok', true,
    'perfil', jsonb_build_object(
      'id',           r.id,
      'nome',         r.nome,
      'mail',         r.mail,
      'telemovel',    r.telemovel,
      'tipo_perfil',  r.tipo_perfil,
      'estado_conta', r.estado_conta
    )
  );
end;
$$;

-- ── Criar conta (auto-registo) ──────────────────────────────
-- Cria sempre como utilizador normal (tipo_perfil = 1) e ativo
-- (estado_conta = 1). Devolve o perfil para entrar logo.
-- NOTA: a coluna id deve ser identity / ter default. Se não for,
-- avisa-me que ajusto a função para gerar o id manualmente.
create or replace function public.criar_conta(
  p_nome      text,
  p_mail      text,
  p_password  text,
  p_telemovel text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  novo public.perfil;
begin
  if length(coalesce(trim(p_password), '')) < 6 then
    return jsonb_build_object('ok', false, 'erro', 'password_curta');
  end if;

  if exists (select 1 from public.perfil where lower(mail) = lower(trim(p_mail))) then
    return jsonb_build_object('ok', false, 'erro', 'existe');
  end if;

  insert into public.perfil (nome, mail, telemovel, password, tipo_perfil, estado_conta)
  values (
    trim(p_nome),
    lower(trim(p_mail)),
    nullif(trim(coalesce(p_telemovel, '')), ''),
    crypt(p_password, gen_salt('bf')),
    1,   -- utilizador normal
    1    -- conta ativa
  )
  returning * into novo;

  return jsonb_build_object(
    'ok', true,
    'perfil', jsonb_build_object(
      'id',           novo.id,
      'nome',         novo.nome,
      'mail',         novo.mail,
      'telemovel',    novo.telemovel,
      'tipo_perfil',  novo.tipo_perfil,
      'estado_conta', novo.estado_conta
    )
  );
end;
$$;

-- ── Permissões: o site público usa a chave anon ─────────────
grant execute on function public.login(text, text)              to anon, authenticated;
grant execute on function public.criar_conta(text, text, text, text) to anon, authenticated;
