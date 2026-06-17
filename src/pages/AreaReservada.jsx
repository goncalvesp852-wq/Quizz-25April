import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";

// ════════════════════════════════════════════════════════════
//  ÁREA RESERVADA — Equipa CD25A
// ════════════════════════════════════════════════════════════

const LOGO_CRAVO = "/images/logo_cravo_ar.png";
const FACHADA = "/images/fachada.jpg";
const COIMBRA = "#E5544B";
const EVORA = "#7C5CBF";

// ── helpers de ano letivo ────────────────────────────────────
function anoLetivoAtual(d = new Date()) {
  const y = d.getFullYear();
  const inicio = d.getMonth() >= 8 ? y : y - 1;
  return `${inicio}/${String(inicio + 1).slice(2)}`;
}
function listaAnosLetivos(desde = 2025) {
  const atualInicio = (() => { const d = new Date(); return d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1; })();
  const out = [];
  for (let y = atualInicio; y >= desde; y--) out.push(`${y}/${String(y + 1).slice(2)}`);
  return out;
}
function anoLetivoParaDatas(ano) {
  // "2025/26" → { gte: "2025-09-01", lte: "2026-08-31" }
  const inicio = parseInt(ano.split("/")[0], 10);
  return { gte: `${inicio}-09-01`, lte: `${inicio + 1}-08-31` };
}
function fmtData(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("T")[0].split("-");
  return `${d}/${m}/${y}`;
}
function diasRestantes(dataFim) {
  if (!dataFim) return null;
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const fim = new Date(dataFim.split("T")[0]); fim.setHours(0, 0, 0, 0);
  return Math.ceil((fim - hoje) / 86400000);
}

const MESES_LETIVOS = ["Set", "Out", "Nov", "Dez", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago"];

const VARIAVEIS = [{"sec": 1, "num": "1.3", "desc": "Esteve disponível conforme previsto", "tipo": "escala"}, {"sec": 2, "num": "2.1", "desc": "Adequação dos conteúdos ao nível etário dos/as discente", "tipo": "escala"}, {"sec": 2, "num": "2.2", "desc": "Qualidade científica e histórica dos conteúdos", "tipo": "escala"}, {"sec": 2, "num": "2.3", "desc": "Clareza e acessibilidade da linguagem utilizada", "tipo": "escala"}, {"sec": 2, "num": "2.4", "desc": "Qualidade dos suportes físicos e da montagem", "tipo": "escala"}, {"sec": 2, "num": "2.5", "desc": "Impacto visual e capacidade de captar a atenção dos/as", "tipo": "escala"}, {"sec": 3, "num": "3.1", "desc": "Acedeu ao repositório digital do projeto no âmbito dest", "tipo": "escala"}, {"sec": 3, "num": "3.3", "desc": "Os códigos QR presentes nos painéis funcionaram adequad", "tipo": "escala"}, {"sec": 3, "num": "3.2", "desc": "Se acedeu ao repositório: avaliação geral dos recursos", "tipo": "escala"}, {"sec": 3, "num": "3.4", "desc": "Os documentos de arquivo e imagens do repositório foram", "tipo": "escala"}, {"sec": 3, "num": "3.6", "desc": "Utilizou o kit pedagógico com os/as seus/suas discentes", "tipo": "escala"}, {"sec": 3, "num": "3.7", "desc": "Se utilizou, que atividades do kit foram usadas? (pode", "tipo": "multipla"}, {"sec": 3, "num": "3.8", "desc": "Se utilizou o kit : avaliação geral da sua adequação e", "tipo": "escala"}, {"sec": 4, "num": "4.1", "desc": "A exposição «25 de Abril em 3D: Democratizar, Descoloni", "tipo": "escala"}, {"sec": 4, "num": "4.2", "desc": "Se sim, que ano(s) de escolaridade estavam envolvidos?", "tipo": "multipla"}, {"sec": 4, "num": "4.3", "desc": "Domínios das AE de História trabalhados com a exposição", "tipo": "multipla"}, {"sec": 4, "num": "4.4", "desc": "Na sua opinião, a exposição «25 de Abril em 3D: Democra", "tipo": "escala"}, {"sec": 4, "num": "4.6", "desc": "Os/As discentes demonstraram capacidade de trabalhar co", "tipo": "escala"}, {"sec": 4, "num": "4.7", "desc": "A exposição «25 de Abril em 3D: Democratizar, Descoloni", "tipo": "escala"}, {"sec": 4, "num": "4.8", "desc": "A exposição «25 de Abril em 3D: Democratizar, Descoloni", "tipo": "escala"}, {"sec": 4, "num": "4.9", "desc": "Se sim, em que disciplinas? (pode selecionar mais do qu", "tipo": "multipla"}, {"sec": 4, "num": "4.10", "desc": "Houve articulação formal entre docentes de diferentes d", "tipo": "escala"}, {"sec": 4, "num": "4.12", "desc": "A exposição «25 de Abril em 3D: Democratizar, Descoloni", "tipo": "escala"}, {"sec": 4, "num": "4.13", "desc": "A exposição gerou contacto com testemunhos ou história", "tipo": "escala"}, {"sec": 4, "num": "4.15", "desc": "A exposição «25 de Abril em 3D: Democratizar, Descoloni", "tipo": "escala"}, {"sec": 4, "num": "4.17", "desc": "O/A docente utilizou a exposição para preparar conteúdo", "tipo": "escala"}, {"sec": 5, "num": "5.1", "desc": "Nível de envolvimento e motivação observado durante a e", "tipo": "escala"}, {"sec": 5, "num": "5.2", "desc": "Grau de interesse demonstrado pelos/as discentes pelos", "tipo": "escala"}, {"sec": 5, "num": "5.3", "desc": "Os/As discentes colocaram questões ou fizeram comentári", "tipo": "escala"}, {"sec": 5, "num": "5.4", "desc": "A exposição «25 de Abril em 3D: Democratizar, Descoloni", "tipo": "escala"}, {"sec": 5, "num": "5.5", "desc": "Algum/a discente partilhou memórias familiares relacion", "tipo": "escala"}, {"sec": 5, "num": "5.6", "desc": "A exposição «25 de Abril em 3D: Democratizar, Descoloni", "tipo": "escala"}, {"sec": 6, "num": "6.1", "desc": "Foram realizadas atividades de seguimento após o fim da", "tipo": "escala"}, {"sec": 6, "num": "6.2", "desc": "Se sim, que tipo de atividades? (pode selecionar mais d", "tipo": "multipla"}, {"sec": 6, "num": "6.3", "desc": "Foram produzidos trabalhos pelos/as discentes relaciona", "tipo": "escala"}, {"sec": 6, "num": "6.5", "desc": "A exposição «25 de Abril em 3D: Democratizar, Descoloni", "tipo": "escala"}, {"sec": 7, "num": "7.1", "desc": "O processo de requisição e comunicação com o CD25A-UC f", "tipo": "escala"}, {"sec": 7, "num": "7.2", "desc": "Facilidade de montagem e desmontagem da exposição", "tipo": "escala"}, {"sec": 7, "num": "7.3", "desc": "O espaço utilizado para instalar a exposição permitiu u", "tipo": "escala"}, {"sec": 7, "num": "7.4", "desc": "O prazo de 15 dias foi", "tipo": "escala"}, {"sec": 7, "num": "7.5", "desc": "Encontrou dificuldades no transporte ou manuseamento da", "tipo": "escala"}, {"sec": 8, "num": "8.1", "desc": "A exposição «25 de Abril em 3D: Democratizar, Descoloni", "tipo": "escala"}, {"sec": 8, "num": "8.2", "desc": "Os/As discentes relacionaram os conteúdos da exposição", "tipo": "escala"}, {"sec": 8, "num": "8.3", "desc": "A exposição «25 de Abril em 3D: Democratizar, Descoloni", "tipo": "escala"}, {"sec": 9, "num": "9.1", "desc": "O/A docente ficou a conhecer melhor o CD25A-UC através", "tipo": "escala"}, {"sec": 9, "num": "9.2", "desc": "Tenciona visitar o CD25A-UC presencialmente com os/as d", "tipo": "escala"}, {"sec": 9, "num": "9.3", "desc": "Já recomendou esta exposição a colegas ou a outras esco", "tipo": "escala"}, {"sec": 10, "num": "10.1", "desc": "Satisfação geral com a exposição «25 de Abril em 3D: De", "tipo": "escala"}, {"sec": 10, "num": "10.2", "desc": "Satisfação global com os recursos digitais e kit pedagó", "tipo": "escala"}, {"sec": 10, "num": "10.3", "desc": "Pretende requisitar novamente a exposição «25 de Abril", "tipo": "escala"}, {"sec": 10, "num": "10.4", "desc": "Pretende requisitar outras exposições do CD25A-UC?", "tipo": "escala"}, {"sec": 11, "num": "11.3", "desc": "Que tecnologias ou formatos interativos os/as discentes", "tipo": "multipla"}];
const SECOES_NOME = {
  1: "Identificação", 2: "Exposição física", 3: "Repositório e Kit", 4: "Impacto curricular",
  5: "Reação discentes", 6: "Atividades pós", 7: "Logística", 8: "Memória e Identidade",
  9: "Instituição", 10: "Avaliação global", 11: "Inovação",
};

const TABS = [
  { id: "sumario", label: "Sumário" },
  { id: "requisicoes", label: "Requisições" },
  { id: "analise", label: "Análise de dados" },
];

const ESTADO_STYLES = {
  ativa:     { color: "#3A7D44", background: "#EAF3E8" },
  concluida: { color: "#6B655C", background: "#F4F0E8" },
  cancelada: { color: "#B3261E", background: "#FDECEA" },
};

// ════════════════════════════════════════════════════════════
//  ROOT COMPONENT
// ════════════════════════════════════════════════════════════
export default function AreaReservada({ onVoltar }) {
  const [sessao, setSessao] = useState(null);
  const [verificando, setVerificando] = useState(true);
  const [tab, setTab] = useState("sumario");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessao(session);
      setVerificando(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
      setSessao(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSair() {
    await supabase.auth.signOut();
    onVoltar?.();
  }

  if (verificando) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FBFAF7", fontFamily: "'Inter',system-ui,sans-serif", color: "#9A948B", fontSize: 15 }}>
        <style>{globalCSS}</style>
        A verificar sessão…
      </div>
    );
  }

  if (!sessao) {
    return <LoginForm onVoltar={onVoltar} onSessao={setSessao} />;
  }

  return (
    <div style={s.page}>
      <style>{globalCSS}</style>
      <div style={s.shell}>
        <header style={s.topbar}>
          <div style={s.brand}>
            <img src={LOGO_CRAVO} alt="" style={s.brandLogo} />
            <div>
              <div style={s.brandTitle}>Área reservada</div>
              <div style={s.brandSub}>Equipa CD25A · {sessao.user.email}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button style={{ ...s.sairBtn, background: "transparent", color: "#8A847B", border: "1px solid #DDD8CF" }} onClick={() => onVoltar?.()}>← Início</button>
            <button style={s.sairBtn} onClick={handleSair}>Sair</button>
          </div>
        </header>
        <nav style={s.tabs}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ ...s.tab, color: tab === t.id ? "#2B2723" : "#9A948B", borderBottomColor: tab === t.id ? "#2B2723" : "transparent" }}>
              {t.label}
            </button>
          ))}
        </nav>
        {tab === "sumario" && <Sumario />}
        {tab === "requisicoes" && <Requisicoes />}
        {tab === "analise" && <Analise />}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  LOGIN FORM
// ════════════════════════════════════════════════════════════
function LoginForm({ onVoltar, onSessao }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setCarregando(false);
    if (error) {
      setErro("E-mail ou palavra-passe incorretos.");
    } else {
      onSessao(data.session);
    }
  }

  return (
    <div style={s.loginPage}>
      <style>{globalCSS}</style>
      <div style={s.loginBgImg} />
      <div style={s.loginScrim} />
      <form style={s.loginCard} onSubmit={handleSubmit}>
        <img src={LOGO_CRAVO} alt="" style={s.loginLogo} />
        <div style={s.loginEyebrow}>Área reservada</div>
        <h1 style={s.loginTitle}>Equipa CD25A</h1>
        <p style={s.loginSub}>Gestão de requisições e análise de dados da exposição.</p>
        <input
          style={s.input}
          type="email"
          placeholder="E-mail institucional"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
        {erro && <p style={s.loginErro}>{erro}</p>}
        <button style={{ ...s.loginBtn, opacity: carregando ? 0.7 : 1 }} type="submit" disabled={carregando}>
          {carregando ? "A entrar…" : "Entrar"}
        </button>
        <button type="button" onClick={() => onVoltar?.()} style={{ background: "none", border: "none", color: "#8A847B", fontSize: 13, cursor: "pointer", marginTop: 12, fontFamily: "inherit" }}>
          ← Voltar ao site
        </button>
      </form>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  SUMÁRIO TAB
// ════════════════════════════════════════════════════════════
function Sumario() {
  const anos = listaAnosLetivos();
  const [ano, setAno] = useState(anos[0]);
  const [requisicoes, setRequisicoes] = useState(null);

  useEffect(() => {
    supabase.from("requisicoes").select("*").then(({ data }) => setRequisicoes(data || []));
  }, []);

  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);

  function infoLocal(local) {
    if (!requisicoes) return { emCurso: null, proxima: null };
    const reqs = requisicoes.filter((r) => r.local === local);
    const emCurso = reqs.find((r) => {
      const ini = new Date(r.data_inicio); ini.setHours(0, 0, 0, 0);
      const fim = new Date(r.data_fim); fim.setHours(0, 0, 0, 0);
      return ini <= hoje && hoje <= fim && r.estado !== "cancelada";
    }) || null;
    const futuras = reqs
      .filter((r) => {
        const ini = new Date(r.data_inicio); ini.setHours(0, 0, 0, 0);
        return ini > hoje && r.estado !== "cancelada";
      })
      .sort((a, b) => new Date(a.data_inicio) - new Date(b.data_inicio));
    return { emCurso, proxima: futuras[0] || null };
  }

  const locais = [
    { label: "Coimbra", cor: COIMBRA },
    { label: "Évora", cor: EVORA },
  ];

  const { gte, lte } = anoLetivoParaDatas(ano);
  const reqsAno = requisicoes
    ? requisicoes.filter((r) => {
        if (r.estado === "cancelada") return false;
        const d = r.data_inicio || r.criado_em || "";
        return d >= gte && d <= lte;
      })
    : [];
  const totalReqs = requisicoes ? reqsAno.length : null;
  const escolasUnicas = requisicoes ? new Set(reqsAno.map((r) => r.nome_escola).filter(Boolean)).size : null;
  const totalAlunos = requisicoes
    ? reqsAno.reduce((acc, r) => acc + (r.dados_pedagogicos?.grupo?.nDiscentes || 0), 0)
    : null;

  return (
    <div>
      <div style={s.sumarioHead}>
        <div>
          <h2 style={s.h2}>Onde está a exposição</h2>
          <p style={s.lead}>Estado atual das duas cópias itinerantes.</p>
        </div>
      </div>

      <div className="copias-grid" style={s.copiasGrid}>
        {locais.map(({ label, cor }) => {
          const { emCurso, proxima } = infoLocal(label);
          const livre = !emCurso;
          const diasRest = emCurso ? diasRestantes(emCurso.data_fim) : null;
          return (
            <div key={label} style={{ ...s.copiaCard, borderTopColor: cor }}>
              <div style={s.copiaHead}>
                <span style={{ ...s.copiaLocal, color: cor }}>{label}</span>
                <span style={{
                  ...s.estadoTag,
                  background: livre ? "#EAF3E8" : cor + "18",
                  color: livre ? "#5B7E50" : cor,
                }}>
                  {requisicoes === null ? "…" : livre ? "Livre" : "Em curso"}
                </span>
              </div>
              {requisicoes === null ? (
                <div style={{ color: "#C8C2BA", fontSize: 14 }}>A carregar…</div>
              ) : emCurso ? (
                <>
                  <div style={s.copiaEscola}>{emCurso.nome_escola || "—"}</div>
                  <div style={s.copiaDatas}>
                    {fmtData(emCurso.data_inicio)} — {fmtData(emCurso.data_fim)}
                    {diasRest !== null && (
                      <span style={s.copiaRestantes}>· faltam {diasRest} dia{diasRest !== 1 ? "s" : ""}</span>
                    )}
                  </div>
                </>
              ) : (
                <div style={s.copiaLivre}>Disponível para requisição.</div>
              )}
              <div style={s.copiaDivider} />
              <div style={s.proximaLabel}>Próxima requisição</div>
              {requisicoes === null ? (
                <div style={{ color: "#C8C2BA", fontSize: 13 }}>—</div>
              ) : proxima ? (
                <div style={s.proximaInfo}>
                  <span style={s.proximaEscola}>{proxima.nome_escola || "—"}</span>
                  <span style={s.proximaDatas}>{fmtData(proxima.data_inicio)} — {fmtData(proxima.data_fim)}</span>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "#A8A299" }}>Sem requisições futuras.</div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ ...s.sumarioHead, marginTop: 36, alignItems: "center" }}>
        <h2 style={s.h2}>Resumo do ano letivo</h2>
        <select value={ano} onChange={(e) => setAno(e.target.value)} style={s.selectAno}>
          {anos.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <p style={s.leadInline}>Um ano letivo decorre de setembro a agosto. O ano atual é {anoLetivoAtual()}.</p>
      <div style={s.statRow}>
        {[
          { label: "Requisições", val: totalReqs },
          { label: "Escolas alcançadas", val: escolasUnicas },
          { label: "Alunos alcançados", val: totalAlunos },
        ].map(({ label, val }) => (
          <div key={label} style={s.statCard}>
            <div style={{ ...s.statValue, color: val !== null && val > 0 ? "#2B2723" : "#CFCAC2" }}>
              {val === null ? "—" : val.toLocaleString("pt-PT")}
            </div>
            <div style={s.statLabel}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  REQUISIÇÕES TAB
// ════════════════════════════════════════════════════════════
function Requisicoes() {
  const [requisicoes, setRequisicoes] = useState(null);
  const [filtroLocal, setFiltroLocal] = useState("Todos");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [expandida, setExpandida] = useState(null);
  const [atualizando, setAtualizando] = useState(false);
  const [erroAtualizar, setErroAtualizar] = useState("");

  useEffect(() => {
    supabase.from("requisicoes").select("*").order("data_inicio", { ascending: false }).then(({ data }) => setRequisicoes(data || []));
  }, []);

  async function atualizarEstado(id, novoEstado) {
    setAtualizando(true);
    setErroAtualizar("");
    const { error } = await supabase.from("requisicoes").update({ estado: novoEstado }).eq("id", id);
    setAtualizando(false);
    if (error) {
      setErroAtualizar("Não foi possível atualizar. Verifique as permissões da base de dados.");
    } else {
      setRequisicoes((prev) => prev.map((r) => r.id === id ? { ...r, estado: novoEstado } : r));
    }
  }

  const lista = requisicoes
    ? requisicoes.filter((r) => {
        if (filtroLocal !== "Todos" && r.local !== filtroLocal) return false;
        if (filtroEstado !== "Todos" && r.estado !== filtroEstado) return false;
        return true;
      })
    : [];

  return (
    <div>
      <h2 style={s.h2}>Requisições</h2>
      <p style={s.lead}>Lista de todas as requisições recebidas, por local e estado.</p>

      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <Filtro label="Local" value={filtroLocal} onChange={setFiltroLocal} options={["Todos", "Coimbra", "Évora"]} />
        <Filtro label="Estado" value={filtroEstado} onChange={setFiltroEstado} options={["Todos", "ativa", "concluida", "cancelada"]} />
      </div>

      <div style={s.tableWrap}>
        <div style={s.tableHead}>
          <span style={{ flex: 2.5 }}>Escola</span>
          <span style={{ flex: 0.9 }}>Local</span>
          <span style={{ flex: 1.4 }}>Datas</span>
          <span style={{ flex: 0.9 }}>Estado</span>
          <span style={{ flex: 1.2 }}>Código</span>
        </div>
        {requisicoes === null ? (
          <div style={{ padding: "20px 20px", color: "#C8C2BA", fontSize: 14 }}>A carregar…</div>
        ) : lista.length === 0 ? (
          <div style={{ padding: "20px 20px", color: "#A8A299", fontSize: 14 }}>Sem requisições com estes filtros.</div>
        ) : (
          lista.map((r) => {
            const cor = r.local === "Coimbra" ? COIMBRA : EVORA;
            const estStyle = ESTADO_STYLES[r.estado] || { color: "#6B655C", background: "#F4F0E8" };
            const aberta = expandida === r.id;
            return (
              <div key={r.id}>
                <div
                  onClick={() => { setExpandida(aberta ? null : r.id); setErroAtualizar(""); }}
                  style={{ ...s.tableRow, cursor: "pointer", background: aberta ? "#FAFAF8" : "transparent" }}
                >
                  <span style={{ flex: 2.5, fontWeight: 500 }}>{r.nome_escola || "—"}</span>
                  <span style={{ flex: 0.9 }}>
                    <span style={{ ...s.localPill, color: cor, borderColor: cor + "44" }}>{r.local || "—"}</span>
                  </span>
                  <span style={{ flex: 1.4, color: "#6B655C", fontSize: 13.5 }}>
                    {fmtData(r.data_inicio)} — {fmtData(r.data_fim)}
                  </span>
                  <span style={{ flex: 0.9 }}>
                    <span style={{ ...s.estadoBadge, ...estStyle }}>{r.estado || "—"}</span>
                  </span>
                  <span style={{ flex: 1.2, color: "#9A948B", fontSize: 12.5 }}>{r.codigo || "—"}</span>
                </div>

                {aberta && (
                  <div style={s.detailPanel}>
                    {erroAtualizar && (
                      <div style={s.erroBox}>{erroAtualizar}</div>
                    )}
                    <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#9A948B", fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", marginRight: 4 }}>Estado</span>
                      {["ativa", "concluida", "cancelada"].map((st) => {
                        const active = r.estado === st;
                        const stStyle = ESTADO_STYLES[st];
                        return (
                          <button
                            key={st}
                            disabled={atualizando}
                            onClick={(e) => { e.stopPropagation(); atualizarEstado(r.id, st); }}
                            style={{
                              padding: "6px 14px", borderRadius: 99, border: `1.5px solid ${active ? stStyle.color : "#DDD8CF"}`,
                              background: active ? stStyle.background : "transparent",
                              color: active ? stStyle.color : "#9A948B",
                              fontSize: 13, fontWeight: 600, cursor: atualizando ? "wait" : "pointer", fontFamily: "inherit",
                            }}
                          >
                            {st.charAt(0).toUpperCase() + st.slice(1)}
                          </button>
                        );
                      })}
                      {atualizando && <span style={{ fontSize: 12.5, color: "#9A948B", fontStyle: "italic" }}>A guardar…</span>}
                    </div>

                    <div style={s.detailGrid}>
                      <DetailSection title="Docente responsável">
                        <DetailRow label="Nome" val={r.docente_nome} />
                        <DetailRow label="Cargo" val={r.docente_cargo} />
                        <DetailRow label="E-mail" val={r.docente_email} link={r.docente_email ? `mailto:${r.docente_email}` : null} />
                        <DetailRow label="Telefone" val={r.docente_tel} />
                      </DetailSection>
                      <DetailSection title="Localização">
                        <DetailRow label="Distrito" val={r.distrito} />
                        <DetailRow label="Concelho" val={r.concelho} />
                        <DetailRow label="Morada" val={r.morada} />
                        <DetailRow label="Código postal" val={r.codigo_postal} />
                      </DetailSection>
                      <DetailSection title="Contacto institucional">
                        <DetailRow label="E-mail" val={r.email_inst} link={r.email_inst ? `mailto:${r.email_inst}` : null} />
                        <DetailRow label="Telefone" val={r.tel_inst} />
                        <DetailRow label="Tipo de estabelecimento" val={r.tipo_estab} />
                        <DetailRow label="NUTS" val={r.nuts} />
                      </DetailSection>
                      <DetailSection title="Grupo pedagógico">
                        <DetailRow label="Anos" val={Array.isArray(r.dados_pedagogicos?.grupo?.anos) ? r.dados_pedagogicos.grupo.anos.join(", ") : r.dados_pedagogicos?.grupo?.anos} />
                        <DetailRow label="N.º de discentes" val={r.dados_pedagogicos?.grupo?.nDiscentes != null ? String(r.dados_pedagogicos.grupo.nDiscentes) : null} />
                        <DetailRow label="N.º de turmas" val={r.dados_pedagogicos?.grupo?.nTurmas != null ? String(r.dados_pedagogicos.grupo.nTurmas) : null} />
                        <DetailRow label="Disciplina principal" val={r.dados_pedagogicos?.disciplinaPrincipal} />
                      </DetailSection>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function DetailSection({ title, children }) {
  return (
    <div style={s.detailSection}>
      <div style={s.detailSectionTitle}>{title}</div>
      {children}
    </div>
  );
}

function DetailRow({ label, val, link }) {
  if (val == null || val === "") return null;
  return (
    <div style={s.detailRow}>
      <span style={s.detailLabel}>{label}</span>
      {link
        ? <a href={link} style={s.detailVal}>{val}</a>
        : <span style={s.detailVal}>{val}</span>
      }
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  ANÁLISE TAB (placeholder UI)
// ════════════════════════════════════════════════════════════
function Analise() {
  const anos = listaAnosLetivos();
  const [filtros, setFiltros] = useState({ ano: anos[0], mes: "Todos", local: "Ambos", distrito: "Todos", nivel: "Todos" });
  const [varSel, setVarSel] = useState(VARIAVEIS[0]);
  const [agrupar, setAgrupar] = useState("Local");
  const [vista, setVista] = useState("tabela");
  const set = (k, v) => setFiltros((p) => ({ ...p, [k]: v }));
  const distritos = ["Todos", "Coimbra", "Évora", "Lisboa", "Porto", "Aveiro", "Leiria", "Setúbal", "Faro", "Braga", "(restantes)"];
  const niveis = ["Todos", "2.º ciclo", "3.º ciclo", "Secundário"];
  const agrupamentos = ["Local", "Distrito", "Nível de ensino", "Mês", "Ano letivo"];

  return (
    <div>
      <h2 style={s.h2}>Análise de dados</h2>
      <p style={s.lead}>Explore as respostas dos questionários: filtre por período e local, escolha a variável e o agrupamento. Exporte os resultados para relatório.</p>
      <div style={s.filterBar}>
        <Filtro label="Ano letivo" value={filtros.ano} onChange={(v) => set("ano", v)} options={anos} />
        <Filtro label="Mês" value={filtros.mes} onChange={(v) => set("mes", v)} options={["Todos", ...MESES_LETIVOS]} />
        <Filtro label="Local" value={filtros.local} onChange={(v) => set("local", v)} options={["Ambos", "Coimbra", "Évora"]} />
        <Filtro label="Distrito" value={filtros.distrito} onChange={(v) => set("distrito", v)} options={distritos} />
        <Filtro label="Nível" value={filtros.nivel} onChange={(v) => set("nivel", v)} options={niveis} />
      </div>
      <div style={s.varBar}>
        <div style={s.varSelectWrap}>
          <label style={s.varLabel}>Variável a analisar</label>
          <select style={s.varSelect} value={varSel.num} onChange={(e) => setVarSel(VARIAVEIS.find((v) => v.num === e.target.value))}>
            {Object.keys(SECOES_NOME).map((secNum) => {
              const vs = VARIAVEIS.filter((v) => String(v.sec) === secNum);
              if (!vs.length) return null;
              return (
                <optgroup key={secNum} label={`${secNum}. ${SECOES_NOME[secNum]}`}>
                  {vs.map((v) => <option key={v.num} value={v.num}>{v.num} — {v.desc}</option>)}
                </optgroup>
              );
            })}
          </select>
        </div>
        <div style={s.varSelectWrap}>
          <label style={s.varLabel}>Agrupar por</label>
          <select style={s.varSelect} value={agrupar} onChange={(e) => setAgrupar(e.target.value)}>
            {agrupamentos.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>
      <div style={s.vistaBar}>
        <div style={s.vistaToggle}>
          {["tabela", "gráfico"].map((v) => (
            <button key={v} onClick={() => setVista(v)} style={{ ...s.vistaBtn, background: vista === v ? "#2B2723" : "transparent", color: vista === v ? "#fff" : "#6B655C" }}>
              {v === "tabela" ? "Tabela" : "Gráfico"}
            </button>
          ))}
        </div>
        <div style={s.exportRow}>
          <button style={s.exportBtn}>Exportar CSV</button>
          <button style={s.exportBtn}>Exportar Excel</button>
        </div>
      </div>
      <div style={s.resultCard}>
        <div style={s.resultHead}>
          <span style={s.resultVar}>{varSel.num} — {varSel.desc}</span>
          <span style={s.resultMeta}>por {agrupar.toLowerCase()} · {filtros.ano}{filtros.mes !== "Todos" ? ` · ${filtros.mes}` : ""}{filtros.local !== "Ambos" ? ` · ${filtros.local}` : ""}</span>
        </div>
        {vista === "tabela" ? (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>{agrupar}</th>
                <th style={s.thNum}>Respostas</th>
                <th style={s.thNum}>Média</th>
                <th style={s.thNum}>% favorável</th>
                <th style={s.thNum}>Tendência</th>
              </tr>
            </thead>
            <tbody>
              {["Coimbra", "Évora"].map((g) => (
                <tr key={g}>
                  <td style={s.td}>{g}</td>
                  <td style={s.tdNum}>—</td>
                  <td style={s.tdNum}>—</td>
                  <td style={s.tdNum}>—</td>
                  <td style={s.tdNum}>—</td>
                </tr>
              ))}
              <tr style={s.trTotal}>
                <td style={{ ...s.td, fontWeight: 600 }}>Total</td>
                <td style={s.tdNum}>—</td>
                <td style={s.tdNum}>—</td>
                <td style={s.tdNum}>—</td>
                <td style={s.tdNum}>—</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div style={s.chartArea}>
            <svg width="100%" height="160" viewBox="0 0 400 160" preserveAspectRatio="none">
              {[0, 1, 2, 3].map((i) => <line key={i} x1="0" y1={i * 40 + 10} x2="400" y2={i * 40 + 10} stroke="#F0ECE4" strokeWidth="1" />)}
              {[60, 110, 90, 140, 75, 120].map((h, i) => <rect key={i} x={i * 64 + 20} y={150 - h} width="38" height={h} rx="4" fill="#E4E1DA" />)}
            </svg>
            <span style={s.chartEmptyText}>Sem dados ainda — o gráfico preenche-se com as respostas reais</span>
          </div>
        )}
      </div>
      <div style={{ ...s.resultCard, marginTop: 16 }}>
        <div style={s.resultHead}>
          <span style={s.resultVar}>Tabela cruzada</span>
          <span style={s.resultMeta}>cruze duas variáveis para ver relações</span>
        </div>
        <p style={s.crossText}>Ex.: satisfação geral (10.1) <strong>×</strong> nível de ensino, ou impacto na cidadania (4.7) <strong>×</strong> distrito. Selecione linha e coluna para gerar a matriz.</p>
        <div style={s.crossSelectors}>
          <select style={s.varSelectSm}><option>Linhas: escolha a variável…</option></select>
          <span style={s.crossX}>×</span>
          <select style={s.varSelectSm}><option>Colunas: escolha a variável…</option></select>
        </div>
      </div>
      <p style={s.notaVazia}>Esta é a interface do analisador. Os cálculos (médias, percentagens, tendências, cruzamentos) correm sobre os dados reais na Fase 2, com exportação para CSV/Excel.</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  SHARED COMPONENT
// ════════════════════════════════════════════════════════════
function Filtro({ label, value, onChange, options }) {
  return (
    <div style={s.filtroItem}>
      <label style={s.filtroLabel}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={s.filtroSelect}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  GLOBAL CSS
// ════════════════════════════════════════════════════════════
const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,800&family=Inter:wght@400;500;600&display=swap');
  * { box-sizing: border-box; }
  button { cursor: pointer; font-family: inherit; }
  select { font-family: inherit; cursor: pointer; }
  button:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid #B08968; outline-offset: 2px; }
  input:focus, select:focus { border-color: #B08968 !important; }
  a { color: inherit; text-decoration: underline; }
  a:hover { opacity: 0.75; }
  @media (prefers-reduced-motion: reduce){ * { transition: none !important; } }
  @media (max-width: 720px){ .copias-grid { grid-template-columns: 1fr !important; } }
`;

// ════════════════════════════════════════════════════════════
//  STYLES
// ════════════════════════════════════════════════════════════
const s = {
  // ── login ──
  loginPage: { minHeight: "100vh", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Inter',system-ui,sans-serif", overflow: "hidden" },
  loginBgImg: { position: "absolute", inset: 0, backgroundImage: `url(${FACHADA})`, backgroundSize: "cover", backgroundPosition: "center", zIndex: 0 },
  loginScrim: { position: "absolute", inset: 0, background: "linear-gradient(180deg, #1c1a1899 0%, #1c1a18cc 100%)", zIndex: 1 },
  loginCard: { position: "relative", zIndex: 2, width: "100%", maxWidth: 380, background: "#fffffff7", backdropFilter: "blur(8px)", borderRadius: 22, padding: "36px 32px", boxShadow: "0 24px 70px #00000055", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" },
  loginLogo: { width: 64, height: "auto", margin: "0 auto 18px", display: "block" },
  loginEyebrow: { fontSize: 11.5, letterSpacing: ".14em", textTransform: "uppercase", color: "#B08968", fontWeight: 600, marginBottom: 6 },
  loginTitle: { fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 800, margin: "0 0 8px", color: "#2B2723" },
  loginSub: { fontSize: 13.5, color: "#6B655C", margin: "0 0 24px", lineHeight: 1.5 },
  loginBtn: { width: "100%", padding: "13px", border: "none", borderRadius: 12, background: "#2B2723", color: "#fff", fontSize: 15, fontWeight: 600, marginTop: 4 },
  loginErro: { fontSize: 13.5, color: "#B3261E", background: "#FDECEA", border: "1px solid #F5C6C6", borderRadius: 9, padding: "9px 14px", margin: "0 0 10px", width: "100%", textAlign: "left" },
  // ── dashboard shell ──
  page: { minHeight: "100vh", background: "linear-gradient(170deg,#FBFAF7 0%,#F4F0E8 100%)", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 20px 60px", color: "#2B2723" },
  shell: { maxWidth: 1040, margin: "0 auto" },
  topbar: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 26 },
  brand: { display: "flex", alignItems: "center", gap: 13 },
  brandLogo: { width: 42, height: "auto" },
  brandTitle: { fontFamily: "'Fraunces',serif", fontSize: 19, fontWeight: 700, lineHeight: 1.1 },
  brandSub: { fontSize: 12.5, color: "#8A847B" },
  sairBtn: { padding: "9px 18px", border: "1.5px solid #E4E1DA", borderRadius: 10, background: "#fff", fontSize: 13.5, fontWeight: 600, color: "#54504A" },
  tabs: { display: "flex", gap: 4, borderBottom: "1px solid #ECE8E1", marginBottom: 28 },
  tab: { padding: "11px 18px", border: "none", background: "none", fontSize: 14.5, fontWeight: 600, borderBottom: "2.5px solid transparent", marginBottom: -1, transition: "color .15s" },
  // ── typography ──
  h2: { fontFamily: "'Fraunces',serif", fontSize: 23, fontWeight: 600, margin: "0 0 6px", letterSpacing: "-.01em" },
  lead: { fontSize: 14, color: "#6B655C", margin: "0 0 22px", lineHeight: 1.5, maxWidth: 640 },
  leadInline: { fontSize: 13, color: "#8A847B", margin: "0 0 18px" },
  notaVazia: { fontSize: 12.5, color: "#A8A299", marginTop: 18, fontStyle: "italic" },
  // ── sumário ──
  sumarioHead: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 },
  copiasGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 },
  copiaCard: { background: "#fff", border: "1px solid #ECE8E1", borderTop: "3px solid", borderRadius: 16, padding: "20px 22px", boxShadow: "0 6px 24px #2b27230a" },
  copiaHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  copiaLocal: { fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700 },
  estadoTag: { fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 99 },
  copiaEscola: { fontSize: 15, fontWeight: 600, marginBottom: 4 },
  copiaDatas: { fontSize: 13.5, color: "#6B655C" },
  copiaRestantes: { color: "#9A948B", marginLeft: 6 },
  copiaLivre: { fontSize: 14, color: "#5B7E50", fontWeight: 500 },
  copiaDivider: { height: 1, background: "#F0ECE4", margin: "16px 0 13px" },
  proximaLabel: { fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "#A8A299", fontWeight: 600, marginBottom: 7 },
  proximaInfo: { display: "flex", flexDirection: "column", gap: 2 },
  proximaEscola: { fontSize: 13.5, fontWeight: 500 },
  proximaDatas: { fontSize: 13, color: "#6B655C" },
  selectAno: { padding: "8px 14px", border: "1.5px solid #E4E1DA", borderRadius: 10, background: "#fff", fontSize: 14, fontWeight: 600, color: "#2B2723" },
  statRow: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 },
  statCard: { background: "#fff", border: "1px solid #ECE8E1", borderRadius: 14, padding: "18px 16px", textAlign: "center" },
  statValue: { fontFamily: "'Fraunces',serif", fontSize: 30, fontWeight: 700, lineHeight: 1 },
  statLabel: { fontSize: 12.5, color: "#6B655C", marginTop: 8, lineHeight: 1.3 },
  // ── requisições table ──
  tableWrap: { background: "#fff", border: "1px solid #ECE8E1", borderRadius: 16, overflow: "hidden" },
  tableHead: { display: "flex", gap: 12, padding: "13px 20px", background: "#FBFAF7", borderBottom: "1px solid #ECE8E1", fontSize: 11.5, letterSpacing: ".06em", textTransform: "uppercase", color: "#9A948B", fontWeight: 600 },
  tableRow: { display: "flex", gap: 12, padding: "15px 20px", borderBottom: "1px solid #F4F0E8", fontSize: 14, alignItems: "center", transition: "background .1s" },
  localPill: { fontSize: 12.5, fontWeight: 600, padding: "3px 11px", borderRadius: 99, border: "1px solid" },
  estadoBadge: { fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 99 },
  // ── detail panel ──
  detailPanel: { background: "#FAFAF8", borderBottom: "1px solid #ECE8E1", padding: "20px 24px 24px" },
  detailGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 },
  detailSection: { display: "flex", flexDirection: "column", gap: 8 },
  detailSectionTitle: { fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "#9A948B", fontWeight: 700, marginBottom: 4 },
  detailRow: { display: "flex", flexDirection: "column", gap: 1 },
  detailLabel: { fontSize: 11.5, color: "#A8A299" },
  detailVal: { fontSize: 13.5, color: "#2B2723", fontWeight: 500, wordBreak: "break-word" },
  erroBox: { fontSize: 13, color: "#B3261E", background: "#FDECEA", border: "1px solid #F5C6C6", borderRadius: 9, padding: "9px 14px", marginBottom: 14 },
  // ── filters ──
  filterBar: { display: "flex", gap: 12, flexWrap: "wrap", background: "#fff", border: "1px solid #ECE8E1", borderRadius: 14, padding: "16px 18px", marginBottom: 14 },
  filtroItem: { display: "flex", flexDirection: "column", gap: 5, minWidth: 120, flex: 1 },
  filtroLabel: { fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: "#9A948B", fontWeight: 600 },
  filtroSelect: { padding: "8px 10px", border: "1.5px solid #E4E1DA", borderRadius: 9, background: "#FBFAF7", fontSize: 13.5, color: "#2B2723" },
  // ── analise ──
  varBar: { display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" },
  varSelectWrap: { display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 220 },
  varLabel: { fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: "#9A948B", fontWeight: 600 },
  varSelect: { padding: "10px 12px", border: "1.5px solid #E4E1DA", borderRadius: 10, background: "#fff", fontSize: 13.5, color: "#2B2723", maxWidth: "100%" },
  vistaBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 12, flexWrap: "wrap" },
  vistaToggle: { display: "flex", gap: 4, background: "#EFEBE3", borderRadius: 10, padding: 3 },
  vistaBtn: { padding: "7px 18px", border: "none", borderRadius: 8, fontSize: 13.5, fontWeight: 600, transition: "all .15s" },
  exportRow: { display: "flex", gap: 8 },
  exportBtn: { padding: "8px 16px", border: "1.5px solid #E4E1DA", borderRadius: 9, background: "#fff", fontSize: 13, fontWeight: 600, color: "#54504A" },
  resultCard: { background: "#fff", border: "1px solid #ECE8E1", borderRadius: 16, padding: "20px 22px", boxShadow: "0 4px 18px #2b27230a" },
  resultHead: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 16, flexWrap: "wrap" },
  resultVar: { fontSize: 15, fontWeight: 600 },
  resultMeta: { fontSize: 12.5, color: "#9A948B" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", fontSize: 11.5, letterSpacing: ".05em", textTransform: "uppercase", color: "#9A948B", fontWeight: 600, padding: "8px 10px", borderBottom: "1.5px solid #ECE8E1" },
  thNum: { textAlign: "right", fontSize: 11.5, letterSpacing: ".05em", textTransform: "uppercase", color: "#9A948B", fontWeight: 600, padding: "8px 10px", borderBottom: "1.5px solid #ECE8E1" },
  td: { fontSize: 14, padding: "11px 10px", borderBottom: "1px solid #F4F0E8" },
  tdNum: { fontSize: 14, padding: "11px 10px", borderBottom: "1px solid #F4F0E8", textAlign: "right", color: "#CFCAC2", fontVariantNumeric: "tabular-nums" },
  trTotal: { background: "#FBFAF7" },
  chartArea: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "8px 0" },
  chartEmptyText: { fontSize: 12.5, color: "#B8B2A8", fontWeight: 500 },
  crossText: { fontSize: 13.5, color: "#6B655C", lineHeight: 1.55, margin: "0 0 16px" },
  crossSelectors: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  varSelectSm: { flex: 1, minWidth: 200, padding: "9px 12px", border: "1.5px solid #E4E1DA", borderRadius: 9, background: "#FBFAF7", fontSize: 13, color: "#6B655C" },
  crossX: { fontWeight: 700, color: "#B08968", fontSize: 16 },
  // ── shared ──
  input: { width: "100%", padding: "12px 14px", border: "1.5px solid #E4E1DA", borderRadius: 11, fontSize: 14.5, fontFamily: "inherit", color: "#2B2723", marginBottom: 12, outline: "none", transition: "border-color .15s" },
};
