import { useState } from "react";
import { login, criarConta } from "../lib/auth.js";

// ════════════════════════════════════════════════════════════
//  ENTRADA — página inicial com Iniciar sessão / Criar conta
//  Após autenticar, o App encaminha conforme o tipo de perfil.
// ════════════════════════════════════════════════════════════

const LOGO_CRAVO = "/images/logo_cravo_ar.png";
const FACHADA = "/images/fachada.jpg";

export default function Entrada({ onAutenticado }) {
  const [modo, setModo] = useState("login"); // "login" | "registo"

  return (
    <div style={s.page}>
      <style>{css}</style>
      <div style={s.bg} />
      <div style={s.scrim} />

      <div style={s.card}>
        <img src={LOGO_CRAVO} alt="" style={s.logo} />
        <div style={s.eyebrow}>25 de Abril em 3D</div>
        <h1 style={s.title}>{modo === "login" ? "Iniciar sessão" : "Criar conta"}</h1>
        <p style={s.sub}>
          {modo === "login"
            ? "Entre com a sua conta para aceder à plataforma."
            : "Registe-se para aceder à plataforma do CD25A-UC."}
        </p>

        <div style={s.tabs}>
          <button
            type="button"
            onClick={() => setModo("login")}
            style={{ ...s.tab, ...(modo === "login" ? s.tabAtiva : {}) }}
          >
            Iniciar sessão
          </button>
          <button
            type="button"
            onClick={() => setModo("registo")}
            style={{ ...s.tab, ...(modo === "registo" ? s.tabAtiva : {}) }}
          >
            Criar conta
          </button>
        </div>

        {modo === "login" ? (
          <FormLogin onAutenticado={onAutenticado} />
        ) : (
          <FormRegisto onAutenticado={onAutenticado} />
        )}
      </div>
    </div>
  );
}

// ── Iniciar sessão ───────────────────────────────────────────
function FormLogin({ onAutenticado }) {
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function submeter(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const r = await login(mail, password);
    setCarregando(false);
    if (!r.ok) setErro(r.erro);
    else onAutenticado(r.perfil);
  }

  return (
    <form onSubmit={submeter} style={s.form}>
      <input
        style={s.input}
        type="email"
        placeholder="E-mail"
        value={mail}
        onChange={(e) => setMail(e.target.value)}
        required
        autoComplete="email"
      />
      <input
        style={s.input}
        type="password"
        placeholder="Palavra-passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
      />
      {erro && <p style={s.erro}>{erro}</p>}
      <button type="submit" style={{ ...s.btn, opacity: carregando ? 0.7 : 1 }} disabled={carregando}>
        {carregando ? "A entrar…" : "Entrar"}
      </button>
    </form>
  );
}

// ── Criar conta ──────────────────────────────────────────────
function FormRegisto({ onAutenticado }) {
  const [form, setForm] = useState({ nome: "", mail: "", telemovel: "", password: "", password2: "" });
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  async function submeter(e) {
    e.preventDefault();
    setErro("");
    if (form.password !== form.password2) {
      setErro("As palavras-passe não coincidem.");
      return;
    }
    setCarregando(true);
    const r = await criarConta({
      nome: form.nome,
      mail: form.mail,
      telemovel: form.telemovel,
      password: form.password,
    });
    setCarregando(false);
    if (!r.ok) setErro(r.erro);
    else onAutenticado(r.perfil);
  }

  return (
    <form onSubmit={submeter} style={s.form}>
      <input style={s.input} type="text" placeholder="Nome completo"
        value={form.nome} onChange={(e) => set("nome", e.target.value)} required autoComplete="name" />
      <input style={s.input} type="email" placeholder="E-mail"
        value={form.mail} onChange={(e) => set("mail", e.target.value)} required autoComplete="email" />
      <input style={s.input} type="tel" placeholder="Telemóvel (opcional)"
        value={form.telemovel} onChange={(e) => set("telemovel", e.target.value)} autoComplete="tel" />
      <input style={s.input} type="password" placeholder="Palavra-passe (mín. 6 caracteres)"
        value={form.password} onChange={(e) => set("password", e.target.value)} required minLength={6} autoComplete="new-password" />
      <input style={s.input} type="password" placeholder="Repetir palavra-passe"
        value={form.password2} onChange={(e) => set("password2", e.target.value)} required minLength={6} autoComplete="new-password" />
      {erro && <p style={s.erro}>{erro}</p>}
      <button type="submit" style={{ ...s.btn, opacity: carregando ? 0.7 : 1 }} disabled={carregando}>
        {carregando ? "A criar conta…" : "Criar conta e entrar"}
      </button>
    </form>
  );
}

// ════════════════════════════════════════════════════════════
//  CSS + estilos
// ════════════════════════════════════════════════════════════
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,800&family=Inter:wght@400;500;600&display=swap');
  * { box-sizing: border-box; }
  button { cursor: pointer; font-family: inherit; }
  input:focus { border-color: #B08968 !important; outline: none; }
  button:focus-visible, input:focus-visible { outline: 2px solid #B08968; outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce){ * { transition: none !important; } }
`;

const s = {
  page: { minHeight: "100vh", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Inter',system-ui,sans-serif", overflow: "hidden" },
  bg: { position: "absolute", inset: 0, backgroundImage: `url(${FACHADA})`, backgroundSize: "cover", backgroundPosition: "center", zIndex: 0 },
  scrim: { position: "absolute", inset: 0, background: "linear-gradient(180deg, #1c1a1899 0%, #1c1a18cc 100%)", zIndex: 1 },
  card: { position: "relative", zIndex: 2, width: "100%", maxWidth: 400, background: "#fffffff7", backdropFilter: "blur(8px)", borderRadius: 22, padding: "36px 32px", boxShadow: "0 24px 70px #00000055", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" },
  logo: { width: 64, height: "auto", margin: "0 auto 18px", display: "block" },
  eyebrow: { fontSize: 11.5, letterSpacing: ".14em", textTransform: "uppercase", color: "#B08968", fontWeight: 600, marginBottom: 6 },
  title: { fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 800, margin: "0 0 8px", color: "#2B2723" },
  sub: { fontSize: 13.5, color: "#6B655C", margin: "0 0 22px", lineHeight: 1.5 },
  tabs: { display: "flex", gap: 4, background: "#EFEBE3", borderRadius: 12, padding: 4, width: "100%", marginBottom: 20 },
  tab: { flex: 1, padding: "9px 12px", border: "none", borderRadius: 9, background: "transparent", fontSize: 13.5, fontWeight: 600, color: "#8A847B", transition: "all .15s" },
  tabAtiva: { background: "#fff", color: "#2B2723", boxShadow: "0 2px 8px #2b272314" },
  form: { width: "100%", display: "flex", flexDirection: "column" },
  input: { width: "100%", padding: "12px 14px", border: "1.5px solid #E4E1DA", borderRadius: 11, fontSize: 14.5, fontFamily: "inherit", color: "#2B2723", marginBottom: 12, outline: "none", transition: "border-color .15s" },
  btn: { width: "100%", padding: "13px", border: "none", borderRadius: 12, background: "#2B2723", color: "#fff", fontSize: 15, fontWeight: 600, marginTop: 4 },
  erro: { fontSize: 13.5, color: "#B3261E", background: "#FDECEA", border: "1px solid #F5C6C6", borderRadius: 9, padding: "9px 14px", margin: "0 0 10px", width: "100%", textAlign: "left" },
};
