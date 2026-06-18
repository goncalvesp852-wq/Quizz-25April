import { supabase } from "./supabase.js";

// ════════════════════════════════════════════════════════════
//  Autenticação contra a tabela `perfil` (RPC + hash bcrypt).
//  A sessão é o perfil devolvido pela RPC, guardado localmente.
//  NÃO usamos o Supabase Auth aqui — só as funções login/criar_conta.
// ════════════════════════════════════════════════════════════

const CHAVE_SESSAO = "cd25a_sessao";

// ── tipos de perfil ──────────────────────────────────────────
// 1 = utilizador normal · 2,3,4 = equipa/gestão (admin Évora,
// visitante Coimbra, admin Coimbra). Por agora só distinguimos
// "utilizador" de "gestão".
export function ehAdmin(perfil) {
  return Boolean(perfil) && Number(perfil.tipo_perfil) !== 1;
}

// ── sessão local ─────────────────────────────────────────────
export function getSessao() {
  try {
    const raw = localStorage.getItem(CHAVE_SESSAO);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function guardarSessao(perfil) {
  localStorage.setItem(CHAVE_SESSAO, JSON.stringify(perfil));
}

export function logout() {
  localStorage.removeItem(CHAVE_SESSAO);
}

// ── mensagens de erro legíveis ───────────────────────────────
const ERROS = {
  credenciais: "E-mail ou palavra-passe incorretos.",
  inativa: "A sua conta ainda não está ativa. Contacte a equipa.",
  existe: "Já existe uma conta com este e-mail.",
  password_curta: "A palavra-passe deve ter pelo menos 6 caracteres.",
};

function mensagemErro(codigo) {
  return ERROS[codigo] || "Ocorreu um erro. Tente novamente.";
}

// ── login ────────────────────────────────────────────────────
export async function login(mail, password) {
  const { data, error } = await supabase.rpc("login", {
    p_mail: mail,
    p_password: password,
  });
  if (error) return { ok: false, erro: "Não foi possível ligar ao servidor." };
  if (!data?.ok) return { ok: false, erro: mensagemErro(data?.erro) };
  guardarSessao(data.perfil);
  return { ok: true, perfil: data.perfil };
}

// ── criar conta ──────────────────────────────────────────────
export async function criarConta({ nome, mail, password, telemovel }) {
  const { data, error } = await supabase.rpc("criar_conta", {
    p_nome: nome,
    p_mail: mail,
    p_password: password,
    p_telemovel: telemovel || null,
  });
  if (error) return { ok: false, erro: "Não foi possível ligar ao servidor." };
  if (!data?.ok) return { ok: false, erro: mensagemErro(data?.erro) };
  guardarSessao(data.perfil);
  return { ok: true, perfil: data.perfil };
}
