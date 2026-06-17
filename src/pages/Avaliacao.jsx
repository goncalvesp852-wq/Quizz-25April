import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";
import TopBar from "../components/TopBar.jsx";

// ════════════════════════════════════════════════════════════
//  QUESTIONÁRIO DE AVALIAÇÃO PÓS-EXPOSIÇÃO
//  «25 de Abril em 3D» · estrutura extraída do LimeSurvey (real)
//  Fluxo: ecrã do código → wizard (secções 1–11) → confirmação
// ════════════════════════════════════════════════════════════

// Escalas reutilizadas
const ESC_QUALIDADE = ["Muito bom", "Bom", "Suficiente", "Fraco", "Insuficiente"];
const SIM_NAO = ["Sim", "Não"];

// Opções de escolha múltipla (reais)
const OPC = {
  atividadesKit: ["Fichas de trabalho para discentes", "Fontes primárias comentadas", "Sugestões de debate e perguntas de discussão", "Todas"],
  anos: ["2.º ciclo (5.º / 6.º ano)", "7.º ano", "8.º ano", "9.º ano", "10.º ano", "11.º ano", "12.º ano"],
  dominiosAE: ["Conhecimento cronológico e contextualização histórica", "Análise e interpretação de fontes históricas", "Construção de perspetivas e interpretações históricas", "Comunicação em História (oral, escrita, visual)"],
  disciplinas: ["Português", "Cidadania e Desenvolvimento", "Geografia", "Filosofia", "Economia", "Sociologia", "Artes Visuais / Educação Visual", "Educação Física"],
  atividadesPos: ["Debate ou discussão orientada em sala de aula", "Trabalho de pesquisa individual ou em grupo", "Produção escrita (ensaio, relatório, texto criativo)", "Produção visual ou multimédia (vídeo, apresentação, exposição)", "Projeto interdisciplinar", "Visita de estudo a local de memória"],
  tecnologias: ["Realidade aumentada (AR)", "Realidade virtual (VR)", "Conteúdos interativos em tablet ou ecrã tátil", "Podcasts ou audioguias", "Jogos ou dinâmicas gamificadas", "Testemunhos em vídeo de protagonistas"],
};

// Escalas específicas
const E = {
  esteveDisp: ["Sim, o período decorreu conforme previsto", "Não, houve alterações ao período previsto"],
  repoAcesso: ["Sim", "Não"],
  qrFunc: ["Sim, sem dificuldades", "Sim, com algumas dificuldades técnicas", "Não foram utilizados"],
  kitUtil: ["Sim", "Não", "Ainda não, mas tenciona utilizar"],
  contribAE: ["Sim", "Não", "Não aplicável — a exposição foi usada noutro contexto disciplinar"],
  cobreConteudos: ["Sim, cobre os conteúdos de forma abrangente", "Sim, mas de forma parcial — alguns conteúdos relevantes não estão representados", "Não — a exposição não se adequa aos conteúdos programáticos do(s) ano(s) envolvido(s)", "Não aplicável — foi utilizada fora do contexto curricular de História"],
  fontes: ["Sim, de forma clara e autónoma", "Sim, com apoio e mediação do/a docente", "Parcialmente — em alguns casos", "Não foi possível observar / avaliar"],
  interdisc: ["Sim", "Não", "Não aplicável — a exposição foi usada noutro contexto disciplinar"],
  artic: ["Sim", "Não", "Está previsto, mas ainda não realizado"],
  oral: ["Sim, com frequência", "Sim, ocasionalmente", "Raramente", "Não"],
  visitas: ["Sim", "Não", "Está previsto, mas ainda não realizado"],
  debate: ["Sim, de forma espontânea", "Sim, promovida pelo/a docente", "Não"],
  memorias: ["Sim, visivelmente", "Em alguns/algumas discentes", "Não foi observado"],
  prova: ["Sim — em teste / prova", "Sim — em trabalho avaliado", "Não"],
  transporte: ["Sim, sem dificuldades", "Sim, com algumas dificuldades", "Não"],
  espaco: ["Sim, plenamente satisfatória", "Sim, com algumas limitações", "Não"],
  prazo: ["Suficiente", "Curto — seria preferível mais tempo", "Excessivo — bastaria menos tempo"],
  atualidade: ["Sim, com frequência", "Sim, ocasionalmente", "Não"],
  identidade: ["Sim, de forma significativa", "Sim, de forma parcial", "Não foi possível avaliar"],
  conheceu: ["Sim", "Já conhecia bem o CD25A-UC", "Não"],
  visitar: ["Sim, está previsto", "Sim, seria do meu interesse", "Não"],
  recomendou: ["Sim", "Não, mas tenciono fazê-lo", "Não"],
  requisitarNovo: ["Sim", "Não", "Talvez"],
  outras: ["Sim", "Não", "Ainda não conheço outras exposições disponíveis"],
};

const SECTIONS = [
  { id: "identificacao", n: 1, titulo: "Identificação" },
  { id: "fisica", n: 2, titulo: "Avaliação da exposição física" },
  { id: "repositorio", n: 3, titulo: "Repositório e Kit Pedagógico" },
  { id: "curricular", n: 4, titulo: "Impacto curricular e pedagógico" },
  { id: "reacao", n: 5, titulo: "Reação dos/as discentes" },
  { id: "pos", n: 6, titulo: "Atividades após a exposição" },
  { id: "logistica", n: 7, titulo: "Logística e acolhimento" },
  { id: "memoria", n: 8, titulo: "Memória e Identidade" },
  { id: "instituicao", n: 9, titulo: "O CD25A-UC como instituição" },
  { id: "global", n: 10, titulo: "Avaliação global e sugestões" },
  { id: "inovacao", n: 11, titulo: "Inovação e perspetiva dos/as discentes" },
];

const ACCENT = "#C77B54"; // tom neutro do questionário (sem local específico)

// ── Componentes de campo ──
function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <label style={s.label}>{label}</label>
      {hint && <div style={s.hint}>{hint}</div>}
      {children}
    </div>
  );
}
function Radio({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {options.map((o) => {
        const active = value === o;
        return (
          <button key={o} type="button" onClick={() => onChange(o)}
            style={{ ...s.option, borderColor: active ? ACCENT : "#E4E1DA", background: active ? ACCENT + "10" : "#fff" }}>
            <span style={{ ...s.radioDot, borderColor: active ? ACCENT : "#CFCAC2" }}>
              {active && <span style={{ ...s.radioInner, background: ACCENT }} />}
            </span>
            <span style={{ color: active ? "#2B2723" : "#54504A" }}>{o}</span>
          </button>
        );
      })}
    </div>
  );
}
function Checks({ options, values, onChange }) {
  const toggle = (o) => values.includes(o) ? onChange(values.filter(v => v !== o)) : onChange([...values, o]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {options.map((o) => {
        const active = values.includes(o);
        return (
          <button key={o} type="button" onClick={() => toggle(o)}
            style={{ ...s.option, borderColor: active ? ACCENT : "#E4E1DA", background: active ? ACCENT + "10" : "#fff" }}>
            <span style={{ ...s.checkBox, borderColor: active ? ACCENT : "#CFCAC2", background: active ? ACCENT : "#fff" }}>
              {active && <span style={s.checkMark}>✓</span>}
            </span>
            <span style={{ color: active ? "#2B2723" : "#54504A" }}>{o}</span>
          </button>
        );
      })}
    </div>
  );
}
function TextArea({ value, onChange, placeholder }) {
  return <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ ...s.input, minHeight: 84, resize: "vertical", fontFamily: "inherit" }} />;
}
function TextInput({ value, onChange, placeholder }) {
  return <input type="text" value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={s.input} />;
}

export default function App({ onVoltar }) {
  const [phase, setPhase] = useState("codigo"); // codigo → intro → form → done
  const [codigo, setCodigo] = useState("");
  const [codigoErro, setCodigoErro] = useState(false);
  const [dadosReq, setDadosReq] = useState(null);
  const [step, setStep] = useState(0);
  const [f, setF] = useState({
    ident: {}, atividadesKit: [], anos: [], dominiosAE: [], disciplinas: [], atividadesPos: [], tecnologias: [],
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setN = (grp, k, v) => setF((p) => ({ ...p, [grp]: { ...p[grp], [k]: v } }));

  const sec = SECTIONS[step];
  const progress = ((step + 1) / SECTIONS.length) * 100;
  const isDone = step >= SECTIONS.length;

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // Validate code against Supabase
  async function validarCodigo() {
    const trimmed = codigo.trim();
    if (!trimmed) { setCodigoErro(true); return; }
    try {
      const { data, error } = await supabase.rpc("validar_codigo", { p_codigo: trimmed });
      if (error) { setCodigoErro(true); return; }
      if (data?.valido === true) {
        setCodigoErro(false);
        setDadosReq(data);
        // Pre-fill identification fields
        setF((prev) => ({
          ...prev,
          ident: {
            ...prev.ident,
            escola: data.nome_escola || prev.ident?.escola || "",
            docente: data.docente_nome || prev.ident?.docente || "",
            email: data.docente_email || prev.ident?.email || "",
          },
        }));
        setPhase("intro");
      } else {
        setCodigoErro(true);
      }
    } catch {
      setCodigoErro(true);
    }
  }

  // Submit evaluation when wizard is done
  useEffect(() => {
    if (phase !== "form" || !isDone || submitted || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    supabase.rpc("submeter_avaliacao", { p_codigo: codigo.trim(), p_respostas: f })
      .then(({ error }) => {
        if (error) { setSubmitError(error.message); }
        else { setSubmitted(true); }
      })
      .finally(() => setSubmitting(false));
  }, [isDone, phase]);

  return (
    <div style={s.page}>
      <TopBar onVoltar={onVoltar} />
      <div style={s.content}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,800&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        button:focus-visible, input:focus-visible, textarea:focus-visible { outline: 2px solid ${ACCENT}; outline-offset: 2px; }
        input:focus, textarea:focus { border-color: ${ACCENT} !important; }
        @media (prefers-reduced-motion: reduce){ * { transition: none !important; } }
      `}</style>

      <div style={s.shell}>
        <header style={s.header}>
          <div style={s.eyebrow}>Exposição itinerante · 25 de Abril em 3D</div>
          <h1 style={s.title}>Avaliação pós-exposição</h1>
        </header>

        {/* ───── ECRÃ DO CÓDIGO ───── */}
        {phase === "codigo" && (
          <div style={s.card}>
            <div style={{ ...s.codeIcon, background: ACCENT + "16", color: ACCENT }}>🔑</div>
            <h2 style={s.secTitle}>Código de requisição</h2>
            <p style={s.codeText}>
              Para aceder à avaliação, deverá indicar o código de requisição recebido por e-mail.
            </p>
            <input
              type="text"
              value={codigo}
              onChange={(e) => { setCodigo(e.target.value); setCodigoErro(false); }}
              onKeyDown={(e) => e.key === "Enter" && validarCodigo()}
              placeholder="Ex.: REQ-2026-0042"
              style={{ ...s.input, textAlign: "center", fontSize: 18, letterSpacing: "0.06em", textTransform: "uppercase", borderColor: codigoErro ? "#D9534F" : "#E4E1DA" }}
            />
            {codigoErro && <div style={s.codeErro}>Código não reconhecido. Verifique o e-mail de confirmação da requisição.</div>}
            <button type="button" onClick={validarCodigo} style={{ ...s.btnPrimary, background: ACCENT, width: "100%", marginTop: 16 }}>
              Aceder à avaliação
            </button>
            <p style={s.codeNota}>
              Na versão final, o código é validado automaticamente contra a requisição que lhe deu origem.
            </p>
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <button type="button" onClick={() => onVoltar?.()} style={{ ...s.btnGhost, fontSize: 13.5, padding: "8px 16px" }}>← Voltar ao início</button>
            </div>
          </div>
        )}

        {/* ───── INTRO ───── */}
        {phase === "intro" && (
          <div style={s.card}>
            <div style={s.gateEyebrow}>Código validado · {codigo.toUpperCase()}</div>
            <h2 style={s.secTitle}>Apresentação e âmbito</h2>
            <div style={s.gateText}>
              <p style={{ margin: "0 0 12px" }}>
                [Placeholder — texto de apresentação e âmbito do questionário de avaliação a inserir.]
              </p>
              <p style={{ margin: 0 }}>
                Ao prosseguir, declara que tomou conhecimento do âmbito deste questionário e deseja
                continuar com a avaliação da exposição.
              </p>
            </div>
            <div style={s.gateNav}>
              <button type="button" onClick={() => setPhase("codigo")} style={s.btnGhost}>Voltar</button>
              <button type="button" onClick={() => setPhase("form")} style={{ ...s.btnPrimary, background: ACCENT }}>Começar avaliação</button>
            </div>
          </div>
        )}

        {/* ───── WIZARD ───── */}
        {phase === "form" && !isDone && (
          <>
            <div style={s.progressWrap}>
              <div style={s.progressTrack}><div style={{ ...s.progressFill, width: `${progress}%`, background: ACCENT }} /></div>
              <div style={s.progressMeta}><span><strong style={{ color: ACCENT }}>{sec.n}</strong> / 11 · {sec.titulo}</span></div>
            </div>

            <div style={s.card}>
              {/* SECÇÃO 1 */}
              {sec.id === "identificacao" && (
                <Section titulo="Identificação">
                  <Field label="1.1. Escola/agrupamento e docente responsável">
                    <div style={{ display: "grid", gap: 10 }}>
                      <TextInput value={f.ident.escola} onChange={(v) => setN("ident", "escola", v)} placeholder="Nome da escola ou agrupamento" />
                      <TextInput value={f.ident.docente} onChange={(v) => setN("ident", "docente", v)} placeholder="Nome do/a docente responsável" />
                    </div>
                  </Field>
                  <Field label="1.2. Período em que a exposição esteve patente">
                    <TextInput value={f.periodo} onChange={(v) => set("periodo", v)} placeholder="Ex.: 4 a 22 de maio de 2026" />
                  </Field>
                  <Field label="1.3. A exposição esteve disponível conforme o período previsto?">
                    <Radio options={E.esteveDisp} value={f.esteveDisp} onChange={(v) => set("esteveDisp", v)} />
                  </Field>
                </Section>
              )}

              {/* SECÇÃO 2 */}
              {sec.id === "fisica" && (
                <Section titulo="Avaliação da exposição física">
                  <Field label="2.1. Adequação dos conteúdos ao nível etário"><Radio options={ESC_QUALIDADE} value={f.q21} onChange={(v) => set("q21", v)} /></Field>
                  <Field label="2.2. Qualidade científica e histórica dos conteúdos"><Radio options={ESC_QUALIDADE} value={f.q22} onChange={(v) => set("q22", v)} /></Field>
                  <Field label="2.3. Clareza e acessibilidade da linguagem"><Radio options={ESC_QUALIDADE} value={f.q23} onChange={(v) => set("q23", v)} /></Field>
                  <Field label="2.4. Qualidade dos suportes físicos e da montagem"><Radio options={ESC_QUALIDADE} value={f.q24} onChange={(v) => set("q24", v)} /></Field>
                  <Field label="2.5. Impacto visual e capacidade de captar a atenção"><Radio options={ESC_QUALIDADE} value={f.q25} onChange={(v) => set("q25", v)} /></Field>
                  <Field label="2.6. Aspetos mais positivos da exposição"><TextArea value={f.q26} onChange={(v) => set("q26", v)} placeholder="Texto livre…" /></Field>
                  <Field label="2.7. Aspetos a melhorar"><TextArea value={f.q27} onChange={(v) => set("q27", v)} placeholder="Texto livre…" /></Field>
                </Section>
              )}

              {/* SECÇÃO 3 */}
              {sec.id === "repositorio" && (
                <Section titulo="Repositório digital e Kit Pedagógico">
                  <Field label="3.1. Acedeu ao repositório digital no âmbito desta exposição?"><Radio options={E.repoAcesso} value={f.q31} onChange={(v) => set("q31", v)} /></Field>
                  {f.q31 === "Sim" && <Field label="3.2. Avaliação geral dos recursos disponíveis"><Radio options={ESC_QUALIDADE} value={f.q32} onChange={(v) => set("q32", v)} /></Field>}
                  <Field label="3.3. Os códigos QR nos painéis funcionaram adequadamente?"><Radio options={E.qrFunc} value={f.q33} onChange={(v) => set("q33", v)} /></Field>
                  <Field label="3.4. Os documentos e imagens do repositório foram usados em sala de aula?"><Radio options={SIM_NAO} value={f.q34} onChange={(v) => set("q34", v)} /></Field>
                  <Field label="3.5. Comentários sobre o repositório"><TextArea value={f.q35} onChange={(v) => set("q35", v)} placeholder="Texto livre…" /></Field>
                  <Field label="3.6. Utilizou o kit pedagógico com os/as discentes?"><Radio options={E.kitUtil} value={f.q36} onChange={(v) => set("q36", v)} /></Field>
                  {f.q36 === "Sim" && (
                    <>
                      <Field label="3.7. Que atividades do kit foram usadas?"><Checks options={OPC.atividadesKit} values={f.atividadesKit} onChange={(v) => set("atividadesKit", v)} /></Field>
                      <Field label="3.8. Avaliação geral da adequação e utilidade do kit"><Radio options={ESC_QUALIDADE} value={f.q38} onChange={(v) => set("q38", v)} /></Field>
                    </>
                  )}
                  <Field label="3.9. Comentários sobre o kit pedagógico"><TextArea value={f.q39} onChange={(v) => set("q39", v)} placeholder="Texto livre…" /></Field>
                </Section>
              )}

              {/* SECÇÃO 4 */}
              {sec.id === "curricular" && (
                <Section titulo="Impacto curricular e pedagógico">
                  <Field label="4.1. Contribuiu para as Aprendizagens Essenciais de História?"><Radio options={E.contribAE} value={f.q41} onChange={(v) => set("q41", v)} /></Field>
                  {f.q41 === "Sim" && (
                    <>
                      <Field label="4.2. Que ano(s) de escolaridade estavam envolvidos?"><Checks options={OPC.anos} values={f.anos} onChange={(v) => set("anos", v)} /></Field>
                      <Field label="4.3. Domínios das AE de História trabalhados"><Checks options={OPC.dominiosAE} values={f.dominiosAE} onChange={(v) => set("dominiosAE", v)} /></Field>
                    </>
                  )}
                  <Field label="4.4. A exposição cobre os conteúdos programáticos?"><Radio options={E.cobreConteudos} value={f.q44} onChange={(v) => set("q44", v)} /></Field>
                  <Field label="4.5. Justifique ou indique conteúdos em falta"><TextArea value={f.q45} onChange={(v) => set("q45", v)} placeholder="Texto livre…" /></Field>
                  <Field label="4.6. Os/As discentes trabalharam com as fontes históricas presentes?"><Radio options={E.fontes} value={f.q46} onChange={(v) => set("q46", v)} /></Field>
                  <Field label="4.7. Contribuiu para a educação para a cidadania e a democracia?"><Radio options={ESC_QUALIDADE} value={f.q47} onChange={(v) => set("q47", v)} /></Field>
                  <Field label="4.8. Foi utilizada noutras disciplinas além de História?"><Radio options={SIM_NAO} value={f.q48} onChange={(v) => set("q48", v)} /></Field>
                  {f.q48 === "Sim" && <Field label="4.9. Em que disciplinas?"><Checks options={OPC.disciplinas} values={f.disciplinas} onChange={(v) => set("disciplinas", v)} /></Field>}
                  <Field label="4.10. Houve articulação formal entre docentes de diferentes disciplinas?"><Radio options={E.interdisc} value={f.q410} onChange={(v) => set("q410", v)} /></Field>
                  {f.q410 === "Sim" && <Field label="4.11. Descreva como foi feita essa articulação"><TextArea value={f.q411} onChange={(v) => set("q411", v)} placeholder="Texto livre…" /></Field>}
                  <Field label="4.12. Foi articulada com projetos da escola (cidadania, memória)?"><Radio options={E.artic} value={f.q412} onChange={(v) => set("q412", v)} /></Field>
                  <Field label="4.13. Gerou contacto com testemunhos ou história oral?"><Radio options={E.oral} value={f.q413} onChange={(v) => set("q413", v)} /></Field>
                  {(f.q413 && f.q413 !== "Não") && <Field label="4.14. Descreva brevemente"><TextArea value={f.q414} onChange={(v) => set("q414", v)} placeholder="Texto livre…" /></Field>}
                  <Field label="4.15. Motivou visitas a outros locais de memória?"><Radio options={E.visitas} value={f.q415} onChange={(v) => set("q415", v)} /></Field>
                  {f.q415 === "Sim" && <Field label="4.16. A que locais?"><TextArea value={f.q416} onChange={(v) => set("q416", v)} placeholder="Texto livre…" /></Field>}
                  <Field label="4.17. Utilizou a exposição para preparar materiais próprios?"><Radio options={SIM_NAO} value={f.q417} onChange={(v) => set("q417", v)} /></Field>
                </Section>
              )}

              {/* SECÇÃO 5 */}
              {sec.id === "reacao" && (
                <Section titulo="Reação dos/as discentes">
                  <Field label="5.1. Nível de envolvimento e motivação observado"><Radio options={ESC_QUALIDADE} value={f.q51} onChange={(v) => set("q51", v)} /></Field>
                  <Field label="5.2. Grau de interesse pelos temas e conceitos abordados"><Radio options={ESC_QUALIDADE} value={f.q52} onChange={(v) => set("q52", v)} /></Field>
                  <Field label="5.3. Colocaram questões ou comentários espontâneos?"><Radio options={E.oral} value={f.q53} onChange={(v) => set("q53", v)} /></Field>
                  <Field label="5.4. Gerou debate entre os/as discentes?"><Radio options={E.debate} value={f.q54} onChange={(v) => set("q54", v)} /></Field>
                  <Field label="5.5. Algum/a discente partilhou memórias familiares?"><Radio options={E.memorias} value={f.q55} onChange={(v) => set("q55", v)} /></Field>
                  <Field label="5.6. Despertou interesse em saber mais sobre o tema?"><Radio options={E.memorias} value={f.q56} onChange={(v) => set("q56", v)} /></Field>
                </Section>
              )}

              {/* SECÇÃO 6 */}
              {sec.id === "pos" && (
                <Section titulo="Atividades realizadas após a exposição">
                  <Field label="6.1. Foram realizadas atividades de seguimento?"><Radio options={SIM_NAO} value={f.q61} onChange={(v) => set("q61", v)} /></Field>
                  {f.q61 === "Sim" && <Field label="6.2. Que tipo de atividades?"><Checks options={OPC.atividadesPos} values={f.atividadesPos} onChange={(v) => set("atividadesPos", v)} /></Field>}
                  <Field label="6.3. Foram produzidos trabalhos pelos/as discentes?"><Radio options={SIM_NAO} value={f.q63} onChange={(v) => set("q63", v)} /></Field>
                  {f.q63 === "Sim" && <Field label="6.4. Descreva brevemente"><TextArea value={f.q64} onChange={(v) => set("q64", v)} placeholder="Texto livre…" /></Field>}
                  <Field label="6.5. A exposição foi referida em momentos de avaliação?"><Radio options={E.prova} value={f.q65} onChange={(v) => set("q65", v)} /></Field>
                </Section>
              )}

              {/* SECÇÃO 7 */}
              {sec.id === "logistica" && (
                <Section titulo="Logística e condições de acolhimento">
                  <Field label="7.1. O processo de requisição e comunicação com o CD25A-UC foi satisfatório?"><Radio options={ESC_QUALIDADE} value={f.q71} onChange={(v) => set("q71", v)} /></Field>
                  <Field label="7.2. Facilidade de montagem e desmontagem"><Radio options={ESC_QUALIDADE} value={f.q72} onChange={(v) => set("q72", v)} /></Field>
                  <Field label="7.3. O espaço permitiu uma experiência de visita satisfatória?"><Radio options={E.espaco} value={f.q73} onChange={(v) => set("q73", v)} /></Field>
                  <Field label="7.4. O prazo de 21 dias úteis foi:"><Radio options={E.prazo} value={f.q74} onChange={(v) => set("q74", v)} /></Field>
                  <Field label="7.5. Encontrou dificuldades no transporte ou manuseamento?"><Radio options={E.transporte} value={f.q75} onChange={(v) => set("q75", v)} /></Field>
                </Section>
              )}

              {/* SECÇÃO 8 */}
              {sec.id === "memoria" && (
                <Section titulo="Memória e Identidade">
                  <Field label="8.1. Gerou discussão sobre o significado do 25 de Abril?"><Radio options={E.atualidade} value={f.q81} onChange={(v) => set("q81", v)} /></Field>
                  <Field label="8.2. Os/As discentes relacionaram os conteúdos com o presente?"><Radio options={E.atualidade} value={f.q82} onChange={(v) => set("q82", v)} /></Field>
                  <Field label="8.3. Contribuiu para a construção da identidade e memória coletiva?"><Radio options={E.identidade} value={f.q83} onChange={(v) => set("q83", v)} /></Field>
                </Section>
              )}

              {/* SECÇÃO 9 */}
              {sec.id === "instituicao" && (
                <Section titulo="O CD25A-UC como instituição">
                  <Field label="9.1. Ficou a conhecer melhor o CD25A-UC através desta experiência?"><Radio options={E.conheceu} value={f.q91} onChange={(v) => set("q91", v)} /></Field>
                  <Field label="9.2. Tenciona visitar o CD25A-UC presencialmente com os/as discentes?"><Radio options={E.visitar} value={f.q92} onChange={(v) => set("q92", v)} /></Field>
                  <Field label="9.3. Já recomendou esta exposição a colegas ou outras escolas?"><Radio options={E.recomendou} value={f.q93} onChange={(v) => set("q93", v)} /></Field>
                </Section>
              )}

              {/* SECÇÃO 10 */}
              {sec.id === "global" && (
                <Section titulo="Avaliação global e sugestões">
                  <Field label="10.1. Satisfação geral com a exposição"><Radio options={ESC_QUALIDADE} value={f.q101} onChange={(v) => set("q101", v)} /></Field>
                  <Field label="10.2. Satisfação global com os recursos digitais e kit"><Radio options={ESC_QUALIDADE} value={f.q102} onChange={(v) => set("q102", v)} /></Field>
                  <Field label="10.3. Pretende requisitar novamente a exposição?"><Radio options={E.requisitarNovo} value={f.q103} onChange={(v) => set("q103", v)} /></Field>
                  <Field label="10.4. Pretende requisitar outras exposições do CD25A-UC?"><Radio options={E.outras} value={f.q104} onChange={(v) => set("q104", v)} /></Field>
                  <Field label="10.5. Sugestões de melhoria para a exposição"><TextArea value={f.q105} onChange={(v) => set("q105", v)} placeholder="Texto livre…" /></Field>
                  <Field label="10.6. Sugestões para o repositório digital e kit"><TextArea value={f.q106} onChange={(v) => set("q106", v)} placeholder="Texto livre…" /></Field>
                  <Field label="10.7. Temas ou períodos que gostaria de ver em futuras exposições"><TextArea value={f.q107} onChange={(v) => set("q107", v)} placeholder="Texto livre…" /></Field>
                </Section>
              )}

              {/* SECÇÃO 11 */}
              {sec.id === "inovacao" && (
                <Section titulo="Inovação e perspetiva dos/as discentes">
                  <Field label="11.1. Aspetos que os/as discentes consideraram mais marcantes"><TextArea value={f.q111} onChange={(v) => set("q111", v)} placeholder="Texto livre…" /></Field>
                  <Field label="11.2. O que gostariam de ver numa futura exposição"><TextArea value={f.q112} onChange={(v) => set("q112", v)} placeholder="Texto livre…" /></Field>
                  <Field label="11.3. Tecnologias ou formatos interativos sugeridos"><Checks options={OPC.tecnologias} values={f.tecnologias} onChange={(v) => set("tecnologias", v)} /></Field>
                  <Field label="11.4. Inovações tecnológicas que considera mais adequadas"><TextArea value={f.q114} onChange={(v) => set("q114", v)} placeholder="Texto livre…" /></Field>
                  <Field label="11.5. Necessidades dos/as discentes que uma futura exposição deveria responder"><TextArea value={f.q115} onChange={(v) => set("q115", v)} placeholder="Texto livre…" /></Field>
                </Section>
              )}

              <div style={s.navRow}>
                <button type="button" onClick={() => setStep((x) => Math.max(x - 1, 0))} disabled={step === 0} style={{ ...s.btnGhost, opacity: step === 0 ? 0.4 : 1, cursor: step === 0 ? "not-allowed" : "pointer" }}>Anterior</button>
                <button type="button" onClick={() => setStep((x) => x + 1)} style={{ ...s.btnPrimary, background: ACCENT }}>{step === SECTIONS.length - 1 ? "Rever e submeter" : "Continuar"}</button>
              </div>
            </div>
          </>
        )}

        {/* ───── CONFIRMAÇÃO ───── */}
        {phase === "form" && isDone && (
          <div style={s.card}>
            {submitting ? (
              <>
                <div style={{ ...s.codeIcon, background: ACCENT + "18", color: ACCENT, fontSize: 20 }}>⏳</div>
                <h2 style={s.confirmTitle}>A submeter…</h2>
                <p style={s.confirmText}>A sua avaliação está a ser registada. Por favor, aguarde.</p>
              </>
            ) : submitError ? (
              <>
                <div style={{ ...s.codeIcon, background: "#FFF0F0", color: "#C0392B" }}>✕</div>
                <h2 style={s.confirmTitle}>Erro ao submeter</h2>
                <p style={s.confirmText}>{submitError}</p>
                <div style={{ textAlign: "center" }}>
                  <button type="button" onClick={() => { setSubmitError(null); setSubmitted(false); }} style={{ ...s.btnPrimary, background: ACCENT }}>Tentar novamente</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ ...s.codeIcon, background: ACCENT + "18", color: ACCENT }}>✓</div>
                <h2 style={s.confirmTitle}>Avaliação concluída</h2>
                <p style={s.confirmText}>
                  Obrigado por avaliar a exposição. A avaliação ficou automaticamente associada à requisição <strong>{codigo.toUpperCase()}</strong> e os dados alimentam as estatísticas do projeto.
                </p>
                <div style={{ textAlign: "center" }}>
                  <button type="button" onClick={() => onVoltar?.()} style={s.btnGhost}>← Voltar ao início</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      </div>{/* /content */}
    </div>
  );
}

function Section({ titulo, children }) {
  return (
    <div>
      <h2 style={s.secTitle}>{titulo}</h2>
      <div style={{ marginTop: 18 }}>{children}</div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "linear-gradient(170deg,#FBFAF7 0%,#F6F3EC 100%)", fontFamily: "'Inter',system-ui,sans-serif", color: "#2B2723" },
  content: { padding: "32px 20px 60px" },
  shell: { maxWidth: 600, margin: "0 auto" },
  header: { marginBottom: 24 },
  eyebrow: { fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "#B08968", fontWeight: 600, marginBottom: 10 },
  title: { fontFamily: "'Fraunces',serif", fontSize: 38, lineHeight: 1.05, fontWeight: 800, margin: 0, letterSpacing: "-.02em" },
  card: { background: "#fff", border: "1px solid #ECE8E1", borderRadius: 22, padding: "30px 30px 24px", boxShadow: "0 12px 40px #2b27230d" },
  codeIcon: { width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 18px" },
  codeText: { fontSize: 14.5, lineHeight: 1.6, color: "#6B655C", textAlign: "center", margin: "0 auto 20px", maxWidth: 420 },
  codeErro: { marginTop: 10, fontSize: 13.5, color: "#C0392B", textAlign: "center" },
  codeNota: { marginTop: 16, fontSize: 12.5, color: "#A8A299", textAlign: "center", lineHeight: 1.5 },
  secTitle: { fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 600, margin: 0, letterSpacing: "-.01em", textAlign: "center" },
  gateEyebrow: { fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "#7BA86A", fontWeight: 600, marginBottom: 12, textAlign: "center" },
  gateText: { fontSize: 14.5, lineHeight: 1.65, color: "#54504A", margin: "16px 0 26px", background: "#FBFAF7", border: "1px solid #EFE9DD", borderRadius: 14, padding: "20px 22px" },
  gateNav: { display: "flex", justifyContent: "space-between", gap: 12 },
  progressWrap: { marginBottom: 18 },
  progressTrack: { height: 6, background: "#EAE6DE", borderRadius: 99, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 99, transition: "width .3s ease" },
  progressMeta: { marginTop: 8, fontSize: 13.5, color: "#6B655C" },
  label: { display: "block", fontSize: 14.5, fontWeight: 600, marginBottom: 8, lineHeight: 1.4 },
  hint: { fontSize: 12.5, color: "#8A847B", marginBottom: 10, marginTop: -2 },
  input: { width: "100%", padding: "11px 14px", border: "1.5px solid #E4E1DA", borderRadius: 11, fontSize: 14.5, fontFamily: "inherit", color: "#2B2723", background: "#fff", outline: "none", transition: "border-color .15s" },
  option: { display: "flex", alignItems: "center", gap: 11, padding: "11px 14px", border: "1.5px solid", borderRadius: 11, fontSize: 14, fontFamily: "inherit", textAlign: "left", cursor: "pointer", transition: "all .15s", lineHeight: 1.35 },
  radioDot: { width: 18, height: 18, borderRadius: "50%", border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  radioInner: { width: 9, height: 9, borderRadius: "50%" },
  checkBox: { width: 18, height: 18, borderRadius: 6, border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  checkMark: { color: "#fff", fontSize: 12, fontWeight: 700, lineHeight: 1 },
  navRow: { display: "flex", justifyContent: "space-between", gap: 12, marginTop: 28, paddingTop: 20, borderTop: "1px solid #F0ECE4" },
  btnGhost: { padding: "12px 22px", border: "1.5px solid #E4E1DA", borderRadius: 12, background: "#fff", fontSize: 14.5, fontWeight: 600, fontFamily: "inherit", color: "#54504A", cursor: "pointer" },
  btnPrimary: { padding: "12px 26px", border: "none", borderRadius: 12, color: "#fff", fontSize: 14.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" },
  confirmTitle: { fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 700, textAlign: "center", margin: "0 0 10px" },
  confirmText: { fontSize: 14.5, lineHeight: 1.6, color: "#6B655C", textAlign: "center", margin: "0 auto 22px", maxWidth: 440 },
};
