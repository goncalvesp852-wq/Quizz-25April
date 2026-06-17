import { useState, useMemo, useEffect } from "react";
import { supabase } from "../lib/supabase.js";

// ════════════════════════════════════════════════════════════
//  DADOS — extraídos do questionário LimeSurvey (estrutura real)
//  Nota: opções a confirmar/atualizar pelo Pedro.
// ════════════════════════════════════════════════════════════

const DISTRITOS = ["Aveiro","Beja","Braga","Bragança","Castelo Branco","Coimbra","Faro","Guarda","Leiria","Lisboa","Portalegre","Porto","Santarém","Setúbal","Viana do Castelo","Vila Real","Viseu","Évora"];

const NUTS_III = ["Alto Minho","Cávado","Ave","Área Metropolitana do Porto","Alto Tâmega e Barroso","Tâmega e Sousa","Douro","Terras de Trás-os-Montes","Região de Aveiro","Região de Coimbra","Região de Leiria","Viseu Dão Lafões","Beira Baixa","Beiras e Serra da Estrela","Oeste","Médio Tejo","Lezíria do Tejo","Grande Lisboa","Península de Setúbal","Alentejo Litoral","Alto Alentejo","Alentejo Central","Baixo Alentejo","Algarve","R. A. Açores","R. A. Madeira"];

const OPC = {
  tipoEstab: ["Público", "Privado", "Cooperativo"],
  estatuto: ["TEIP (Território Educativo de Intervenção Prioritária)", "Escola de 2.ª oportunidade", "Não aplicável"],
  simNao: ["Sim", "Não"],
  simNaoNS: ["Sim", "Não", "Não sei"],
  disciplinaPrincipal: ["História", "Português", "Cidadania e Desenvolvimento"],
  integradaEm: ["Atividade letiva (em contexto de sala de aula ou visita de estudo)", "Atividade extracurricular (clube, projeto, semana temática, etc.)", "Ambas"],
  dominiosAE: ["Conhecimento cronológico e contextualização histórica", "Análise e interpretação de fontes históricas", "Construção de perspetivas e interpretações históricas", "Comunicação em História (oral, escrita, visual)"],
  disciplinasArtic: ["Português", "Cidadania e Desenvolvimento", "Geografia", "Filosofia", "Economia", "Sociologia", "Artes Visuais / Educação Visual", "Educação Física"],
  objetivoPrincipal: ["Enquadrar conteúdos curriculares", "Promover a educação para a cidadania e a democracia", "Comemorar a data do 25 de Abril", "Apoiar um projeto de escola ou atividade extracurricular"],
  competencias: ["Pensamento crítico e análise de fontes históricas", "Educação para a cidadania e a democracia", "Conhecimento e contextualização histórica", "Literacia visual e análise de imagem", "Valorização da memória histórica e da identidade coletiva", "Capacidade de relacionar o passado histórico com os desafios do presente"],
  necessidades: ["Aprofundar o conhecimento sobre o Estado Novo e as suas consequências", "Compreender o processo de democratização após o 25 de Abril (Democratizar)", "Compreender o processo de descolonização e as suas implicações (Descolonizar)", "Compreender o processo de desenvolvimento económico e social após o 25 de Abril (Desenvolver)", "Desenvolver a consciência cívica e democrática", "Refletir sobre a atualidade dos valores e conquistas da Revolução de Abril"],
  impacto: ["Aumento do interesse e curiosidade pelos temas abordados", "Melhor compreensão do período histórico e dos seus processos", "Desenvolvimento do espírito crítico face às fontes históricas", "Valorização da democracia e dos direitos fundamentais", "Reflexão sobre a memória familiar e coletiva ligada ao período"],
  conhecimentoPrevio: ["Estado Novo e resistência", "O 25 de Abril e o Movimento das Forças Armadas", "Processo de democratização (Democratizar)", "Processo de descolonização (Descolonizar)", "Desenvolvimento económico e social pós-74 (Desenvolver)", "Não espero conhecimento prévio significativo", "Não sei"],
  atividadesKit: ["Fichas de trabalho para discentes", "Fontes primárias comentadas", "Sugestões de debate e perguntas de discussão", "Ainda não sei / Todas"],
  comoConheceu: ["Através do CD25A-UC (sítio web, e-mail ou contacto direto)", "Através de redes sociais", "Através de um/a colega docente", "Através de uma Câmara Municipal ou serviço educativo municipal", "Através da Direção-Geral da Educação (DGE) ou Direção de Serviços Regional"],
};

// ── Secções do wizard (1–8) ──
const SECTIONS = [
  { id: "entidade", n: 1, titulo: "Identificação da entidade" },
  { id: "docente", n: 2, titulo: "Docente responsável" },
  { id: "pedagogica", n: 3, titulo: "Informações pedagógicas" },
  { id: "objetivos", n: 4, titulo: "Objetivos e expectativas" },
  { id: "atividades", n: 5, titulo: "Atividades planeadas" },
  { id: "repositorio", n: 6, titulo: "Repositório e Kit" },
  { id: "relacao", n: 7, titulo: "Relação com o CD25A-UC" },
  { id: "datas", n: 8, titulo: "Local e datas" },
];

// ════════════════════════════════════════════════════════════
//  FERIADOS — perpétuos (qualquer ano)
// ════════════════════════════════════════════════════════════
function easterSunday(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1;return new Date(y,mo-1,da);}
function addDays(date,n){const d=new Date(date);d.setDate(d.getDate()+n);return d;}
function iso(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function holidaysForYear(year, local){
  const h=new Map(); const add=(d,n)=>h.set(iso(d),n);
  add(new Date(year,0,1),"Ano Novo"); add(new Date(year,3,25),"Dia da Liberdade");
  add(new Date(year,4,1),"Dia do Trabalhador"); add(new Date(year,5,10),"Dia de Portugal");
  add(new Date(year,7,15),"Assunção"); add(new Date(year,9,5),"Implantação da República");
  add(new Date(year,10,1),"Todos os Santos"); add(new Date(year,11,1),"Restauração");
  add(new Date(year,11,8),"Imaculada Conceição"); add(new Date(year,11,25),"Natal");
  const e=easterSunday(year);
  add(addDays(e,-47),"Carnaval"); add(addDays(e,-2),"Sexta-feira Santa");
  add(e,"Páscoa"); add(addDays(e,60),"Corpo de Deus");
  if(local==="coimbra") add(new Date(year,6,4),"Feriado Municipal de Coimbra");
  if(local==="evora") add(new Date(year,5,29),"Feriado Municipal de Évora");
  return h;
}
const MONTH_NAMES=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WEEKDAY_LABELS=["S","T","Q","Q","S","S","D"];
const MAX_BUSINESS_DAYS=21;
function countBusinessDays(s,e,b){let c=0,cur=new Date(s);while(cur<=e){if(!b(cur))c++;cur=addDays(cur,1);}return c;}
function lastAllowedEnd(s,b){let u=0,cur=new Date(s),last=new Date(s);for(let i=0;i<100;i++){if(!b(cur)){u++;if(u>MAX_BUSINESS_DAYS)break;last=new Date(cur);}cur=addDays(cur,1);}return last;}

// ── Reservas já existentes (SIMULADAS para a maqueta) ──
// Na versão final, vêm do Supabase. Cada reserva ocupa [inicio, fim] no seu local.
// Datas a partir de hoje para serem visíveis no calendário.
function makeSimReservas() {
  const t = new Date(); t.setHours(0,0,0,0);
  const mk = (offStart, offEnd) => ({ start: addDays(t, offStart), end: addDays(t, offEnd) });
  return {
    coimbra: [ mk(7, 12), mk(28, 40) ],
    evora: [ mk(14, 18) ],
  };
}

// Dado um conjunto de reservas e uma função isWeekendOrHoliday, devolve uma função
// que diz se um dia está bloqueado por estar DENTRO de uma reserva ou no seu buffer
// (1 dia útil a seguir ao fim). O buffer salta fins de semana e feriados.
function makeReservaBlocker(reservas, isNonBusiness) {
  // pré-calcula, para cada reserva, o conjunto de dias ocupados + dia de buffer
  const blocked = new Set();
  const bufferDays = new Set();
  for (const r of reservas || []) {
    // dias da própria reserva
    let cur = new Date(r.start);
    while (cur <= r.end) { blocked.add(iso(cur)); cur = addDays(cur, 1); }
    // buffer: 1 dia útil a seguir ao fim (salta fds/feriados)
    let d = addDays(r.end, 1);
    for (let i = 0; i < 30; i++) {
      if (!isNonBusiness(d)) { bufferDays.add(iso(d)); break; }
      d = addDays(d, 1);
    }
  }
  return {
    isReserved: (d) => blocked.has(iso(d)),
    isBuffer: (d) => bufferDays.has(iso(d)),
  };
}

// ════════════════════════════════════════════════════════════
//  COMPONENTES DE CAMPO
// ════════════════════════════════════════════════════════════
function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <label style={s.label}>{label}</label>
      {hint && <div style={s.hint}>{hint}</div>}
      {children}
    </div>
  );
}

function RadioGroup({ options, value, onChange, accent }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {options.map((o) => {
        const active = value === o;
        return (
          <button key={o} type="button" onClick={() => onChange(o)}
            style={{ ...s.option, borderColor: active ? accent : "#E4E1DA", background: active ? accent + "10" : "#fff" }}>
            <span style={{ ...s.radioDot, borderColor: active ? accent : "#CFCAC2" }}>
              {active && <span style={{ ...s.radioInner, background: accent }} />}
            </span>
            <span style={{ color: active ? "#2B2723" : "#54504A" }}>{o}</span>
          </button>
        );
      })}
    </div>
  );
}

function CheckGroup({ options, values, onChange, accent }) {
  const toggle = (o) => values.includes(o) ? onChange(values.filter(v => v !== o)) : onChange([...values, o]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {options.map((o) => {
        const active = values.includes(o);
        return (
          <button key={o} type="button" onClick={() => toggle(o)}
            style={{ ...s.option, borderColor: active ? accent : "#E4E1DA", background: active ? accent + "10" : "#fff" }}>
            <span style={{ ...s.checkBox, borderColor: active ? accent : "#CFCAC2", background: active ? accent : "#fff" }}>
              {active && <span style={s.checkMark}>✓</span>}
            </span>
            <span style={{ color: active ? "#2B2723" : "#54504A" }}>{o}</span>
          </button>
        );
      })}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text" }) {
  return <input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={s.input} />;
}
function Select({ value, onChange, options, placeholder }) {
  return (
    <select value={value || ""} onChange={(e) => onChange(e.target.value)} style={s.input}>
      <option value="" disabled>{placeholder || "Selecione…"}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

// ════════════════════════════════════════════════════════════
//  CALENDÁRIO (validado anteriormente)
// ════════════════════════════════════════════════════════════
function Calendario({ local, value, onChange, accent }) {
  const sim = useMemo(() => makeSimReservas(), []);
  // abre no mês da primeira reserva do local (para o buffer ser logo visível na maqueta)
  const firstReserva = (sim[local] || [])[0];
  const [viewDate, setViewDate] = useState(firstReserva ? new Date(firstReserva.start.getFullYear(), firstReserva.start.getMonth(), 1) : new Date());
  const [hover, setHover] = useState(null);
  const [limitWarn, setLimitWarn] = useState(false);
  const year = viewDate.getFullYear(), month = viewDate.getMonth();
  const holidays = useMemo(() => holidaysForYear(year, local), [year, local]);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const accentSoft = accent + "1e";

  const rangeStart = value?.start || null, rangeEnd = value?.end || null;
  const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;
  const holidayName = (d) => holidays.get(iso(d)) || null;
  const isNonBusiness = (d) => isWeekend(d) || !!holidayName(d);
  const isPast = (d) => d < today;

  // Reservas existentes do local (simuladas) + buffer pós-reserva
  const blocker = useMemo(
    () => makeReservaBlocker(sim[local] || [], isNonBusiness),
    [local, year, month]
  );

  // Um dia é "bloqueado" para seleção se: fds/feriado, reservado, ou buffer
  const isBlocked = (d) => isNonBusiness(d) || blocker.isReserved(d) || blocker.isBuffer(d);

  const grid = useMemo(() => {
    const first = new Date(year, month, 1);
    const off = (first.getDay() + 6) % 7;
    const dim = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < off; i++) cells.push(null);
    for (let d = 1; d <= dim; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7) cells.push(null);
    return cells;
  }, [year, month]);

  function hasReservaBetween(a, b) {
    let cur = new Date(a);
    while (cur <= b) { if (blocker.isReserved(cur) || blocker.isBuffer(cur)) return true; cur = addDays(cur, 1); }
    return false;
  }
  function inRange(d) {
    if (!rangeStart) return false;
    let end = rangeEnd || hover;
    if (!end) return iso(d) === iso(rangeStart);
    if (!rangeEnd && hover && hover >= rangeStart) {
      const me = lastAllowedEnd(rangeStart, isBlocked);
      if (end > me) end = me;
      // não destacar para lá de uma reserva existente
      let cur = new Date(rangeStart);
      while (cur <= end) { if (blocker.isReserved(cur) || blocker.isBuffer(cur)) { end = addDays(cur, -1); break; } cur = addDays(cur, 1); }
    }
    const [lo, hi] = rangeStart <= end ? [rangeStart, end] : [end, rangeStart];
    return d >= lo && d <= hi;
  }
  function handleClick(d) {
    if (isPast(d) || isBlocked(d)) return;
    setLimitWarn(false);
    if (!rangeStart || (rangeStart && rangeEnd)) { onChange({ start: d, end: null }); return; }
    if (d < rangeStart) { onChange({ start: d, end: null }); return; }
    // Não pode atravessar uma reserva/buffer existente
    if (hasReservaBetween(rangeStart, d)) { onChange({ start: d, end: null }); setLimitWarn("reserva"); return; }
    const used = countBusinessDays(rangeStart, d, isBlocked);
    if (used > MAX_BUSINESS_DAYS) { onChange({ start: rangeStart, end: lastAllowedEnd(rangeStart, isBlocked) }); setLimitWarn("limite"); return; }
    onChange({ start: rangeStart, end: d });
  }
  const businessDaysUsed = rangeStart && rangeEnd ? countBusinessDays(rangeStart, rangeEnd, isBlocked) : 0;

  return (
    <div>
      <div style={{ ...s.calCard, borderColor: accentSoft }}>
        <div style={s.calNav}>
          <button type="button" className="nav-btn" style={s.navBtn} onClick={() => setViewDate(new Date(year, month - 1, 1))} aria-label="Mês anterior">‹</button>
          <div style={s.monthLabel}>{MONTH_NAMES[month]} <span style={{ color: "#A8A299" }}>{year}</span></div>
          <button type="button" className="nav-btn" style={s.navBtn} onClick={() => setViewDate(new Date(year, month + 1, 1))} aria-label="Mês seguinte">›</button>
        </div>
        <div style={s.weekRow}>{WEEKDAY_LABELS.map((w, i) => <div key={i} style={{ ...s.weekCell, color: i >= 5 ? "#C9B3AF" : "#9A948B" }}>{w}</div>)}</div>
        <div style={s.calGrid}>
          {grid.map((d, i) => {
            if (!d) return <div key={i} />;
            const blocked = isBlocked(d), past = isPast(d), hName = holidayName(d);
            const reserved = blocker.isReserved(d), buffer = blocker.isBuffer(d);
            const selected = inRange(d), isStart = rangeStart && iso(d) === iso(rangeStart), isEnd = rangeEnd && iso(d) === iso(rangeEnd);
            let beyond = false;
            if (rangeStart && !rangeEnd && d > rangeStart) beyond = d > lastAllowedEnd(rangeStart, isBlocked);
            const disabled = blocked || past || beyond;
            let bg = "transparent", color = "#2B2723";
            if (reserved) { bg = "#EBE7E0"; color = "#B8B2A8"; }
            else if (buffer) { bg = "repeating-linear-gradient(45deg,#F1EFEA,#F1EFEA 4px,#E8E4DC 4px,#E8E4DC 8px)"; color = "#B8B2A8"; }
            if (selected && !blocked) { bg = accentSoft; color = accent; }
            if (isStart || isEnd) { bg = accent; color = "#fff"; }
            if (disabled && !reserved && !buffer) color = "#CFCAC2";
            const title = hName || (reserved ? "Período já requisitado" : buffer ? "Dia de avaliação da exposição" : isWeekend(d) ? "Fim de semana" : "");
            return (
              <button key={i} type="button" className="day-btn" disabled={disabled} title={title}
                onClick={() => handleClick(d)} onMouseEnter={() => rangeStart && !rangeEnd && !disabled && setHover(d)}
                style={{ ...s.dayBtn, background: bg, color, cursor: disabled ? "not-allowed" : "pointer", fontWeight: isStart || isEnd ? 700 : 500, borderRadius: isStart || isEnd ? 12 : 10, opacity: past ? 0.4 : 1 }}>
                {d.getDate()}{hName && !past && !reserved && <span style={{ ...s.holidayDot, background: accent }} />}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={s.legend}>
          <span style={s.legendItem}><span style={{ ...s.legendSwatch, background: accent }} /> Selecionado</span>
          <span style={s.legendItem}><span style={{ ...s.legendSwatch, background: "#fff", border: "1px solid #E4E1DA", position: "relative" }}><span style={{ ...s.holidayDot, background: accent, top: 3, right: 3 }} /></span> Feriado</span>
          <span style={s.legendItem}><span style={{ ...s.legendSwatch, background: "#EBE7E0" }} /> Já requisitado</span>
          <span style={s.legendItem}><span style={{ ...s.legendSwatch, background: "repeating-linear-gradient(45deg,#F1EFEA,#F1EFEA 3px,#E8E4DC 3px,#E8E4DC 6px)" }} /> Dia de avaliação</span>
        </div>
        <div style={s.counter}>
          {rangeStart && rangeEnd ? (<><strong style={{ color: accent }}>{businessDaysUsed}</strong> dias de visita<span style={s.counterSep}>·</span>{rangeStart.getDate()} {MONTH_NAMES[rangeStart.getMonth()].slice(0, 3)} — {rangeEnd.getDate()} {MONTH_NAMES[rangeEnd.getMonth()].slice(0, 3)}</>) : rangeStart ? "Selecione a data de fim" : `Máximo ${MAX_BUSINESS_DAYS} dias úteis`}
        </div>
        {limitWarn === "limite" && <div style={s.warn}>O período máximo é de {MAX_BUSINESS_DAYS} dias de visita. A seleção foi ajustada ao limite — para um período diferente, escolha uma nova data de início.</div>}
        {limitWarn === "reserva" && <div style={s.warn}>Esse intervalo cruza um período já requisitado (ou o dia de avaliação seguinte). Escolha um período antes ou depois da reserva existente.</div>}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  APP
// ════════════════════════════════════════════════════════════
export default function App({ onVoltar }) {
  // gate: "intro" → "rgpd" → "form" (wizard) → confirmação. "recusou" = saída.
  const [phase, setPhase] = useState("intro");
  const [step, setStep] = useState(0);
  const [f, setF] = useState({
    integradaEm: [], dominiosAE: [], disciplinasArtic: [], competencias: [],
    necessidades: [], impacto: [], conhecimentoPrevio: [], atividadesKit: [],
    contacto: {}, docente: {}, grupo: {},
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setNested = (grp, k, v) => setF((p) => ({ ...p, [grp]: { ...p[grp], [k]: v } }));

  const local = f.local;
  const accent = local === "evora" ? "#7C5CBF" : local === "coimbra" ? "#E5544B" : "#C77B54";

  const sec = SECTIONS[step];
  const progress = ((step + 1) / SECTIONS.length) * 100;

  const [erroValidacao, setErroValidacao] = useState(null);

  // Campos obrigatórios por secção (os que a base de dados exige ou
  // sem os quais a requisição não faz sentido).
  function camposEmFalta() {
    const sec = SECTIONS[step];
    const faltam = [];
    if (sec.id === "entidade") {
      if (!f.nomeEscola?.trim()) faltam.push("Nome da escola / agrupamento");
    }
    if (sec.id === "docente") {
      if (!f.docente?.nome?.trim()) faltam.push("Nome do/a docente responsável");
      if (!f.docente?.email?.trim()) faltam.push("E-mail do/a docente");
    }
    if (sec.id === "datas") {
      if (!f.local) faltam.push("Local (Coimbra ou Évora)");
      if (!f.datas?.start || !f.datas?.end) faltam.push("Período de datas no calendário");
    }
    return faltam;
  }

  function next() {
    const faltam = camposEmFalta();
    if (faltam.length) { setErroValidacao(faltam); return; }
    setErroValidacao(null);
    setStep((s) => Math.min(s + 1, SECTIONS.length));
  }
  function prev() { setErroValidacao(null); setSubmitError(null); setStep((s) => Math.max(s - 1, 0)); }

  const isDone = step >= SECTIONS.length;

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [codigoGerado, setCodigoGerado] = useState(null);

  useEffect(() => {
    if (!isDone || phase !== "form" || codigoGerado || submitting) return;

    const { contacto = {}, docente = {}, datas, nomeEscola, tipoEstab, nuts, distrito, concelho,
      local, integradaEm, dominiosAE, disciplinasArtic, competencias, necessidades, impacto,
      conhecimentoPrevio, atividadesKit, grupo, q18, q19, q110, q111, q32, q35, q37, q39, q43,
      q51, q52, q61, q62, q63, q71, q72, q73, estatuto, disciplinaPrincipal, objetivoPrincipal, q48 } = f;

    const payload = {
      local,
      data_inicio: datas?.start ? iso(datas.start) : null,
      data_fim: datas?.end ? iso(datas.end) : null,
      nome_escola: nomeEscola,
      tipo_estab: tipoEstab,
      nuts,
      distrito,
      concelho,
      morada: contacto.morada,
      codigo_postal: contacto.cp,
      tel_inst: contacto.tel,
      email_inst: contacto.email,
      docente_nome: docente.nome,
      docente_cargo: docente.cargo,
      docente_tel: docente.tel,
      docente_email: docente.email,
      dados_pedagogicos: {
        estatuto, disciplinaPrincipal, integradaEm, dominiosAE, disciplinasArtic,
        competencias, necessidades, impacto, conhecimentoPrevio, atividadesKit,
        objetivoPrincipal, grupo, q18, q19, q110, q111, q32, q35, q37, q39, q43,
        q51, q52, q61, q62, q63, q71, q72, q73, q48,
      },
    };

    setSubmitting(true);
    setSubmitError(null);
    supabase.rpc("submeter_requisicao", { dados: payload })
      .then(({ data, error }) => {
        if (error) { setSubmitError(error.message); }
        else { setCodigoGerado(data); }
      })
      .finally(() => setSubmitting(false));
  }, [isDone, phase]);

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,800&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        .day-btn { transition: background .15s, color .15s, transform .1s; }
        .day-btn:not(:disabled):hover { transform: scale(1.08); }
        .nav-btn:focus-visible, .day-btn:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid ${accent}; outline-offset: 2px; }
        input:focus, select:focus { border-color: ${accent} !important; }
        @media (prefers-reduced-motion: reduce){ * { transition:none !important; } }
      `}</style>

      <div style={s.shell}>
        <header style={s.header}>
          <div style={s.eyebrow}>Exposição itinerante · 25 de Abril em 3D</div>
          <h1 style={s.title}>Requisitar a exposição</h1>
        </header>

        {/* ───── PORTEIRO 1: APRESENTAÇÃO E ÂMBITO ───── */}
        {phase === "intro" && (
          <div style={s.card}>
            <div style={s.gateEyebrow}>Passo prévio · 1 de 2</div>
            <h2 style={s.secTitle}>Apresentação e âmbito</h2>
            <div style={s.gateText}>
              <p style={{ margin: "0 0 12px" }}>
                [Placeholder — texto de apresentação e âmbito do formulário a inserir pelo Pedro.
                Descreve o que é a exposição «25 de Abril em 3D», a quem se destina, e o âmbito
                da requisição.]
              </p>
              <p style={{ margin: 0 }}>
                Ao prosseguir, declara que leu e tomou conhecimento da apresentação e âmbito do
                presente formulário e deseja prosseguir com a requisição.
              </p>
            </div>
            <div style={s.gateNav}>
              <button type="button" onClick={() => setPhase("recusou")} style={s.btnGhost}>Não prosseguir</button>
              <button type="button" onClick={() => setPhase("rgpd")} style={{ ...s.btnPrimary, background: accent }}>Li e quero prosseguir</button>
            </div>
          </div>
        )}

        {/* ───── PORTEIRO 2: CONDIÇÕES + RGPD ───── */}
        {phase === "rgpd" && (
          <div style={s.card}>
            <div style={s.gateEyebrow}>Passo prévio · 2 de 2</div>
            <h2 style={s.secTitle}>Condições e proteção de dados</h2>
            <div style={s.gateText}>
              <p style={{ margin: "0 0 12px" }}>
                [Placeholder — condições gerais de cedência e política de proteção de dados
                pessoais da Universidade de Coimbra (UC) a inserir pelo Pedro.]
              </p>
              <p style={{ margin: 0 }}>
                Ao aceitar, declara que leu e tomou conhecimento das condições gerais de cedência
                e da política de proteção de dados pessoais da UC, e aceita os seus termos. Sem
                esta aceitação não é possível prosseguir com a requisição.
              </p>
            </div>
            <div style={s.gateNav}>
              <button type="button" onClick={() => setPhase("recusou")} style={s.btnGhost}>Não aceito</button>
              <button type="button" onClick={() => setPhase("form")} style={{ ...s.btnPrimary, background: accent }}>Aceito e quero prosseguir</button>
            </div>
          </div>
        )}

        {/* ───── SAÍDA: RECUSOU ───── */}
        {phase === "recusou" && (
          <div style={s.card}>
            <div style={{ ...s.confirmIcon, background: "#F1EFEA", color: "#9A948B" }}>✕</div>
            <h2 style={s.confirmTitle}>Requisição não iniciada</h2>
            <p style={s.confirmText}>
              Para requisitar a exposição é necessário aceitar o âmbito do formulário e a política
              de proteção de dados. Pode rever esta decisão quando quiser.
            </p>
            <div style={{ textAlign: "center" }}>
              <button type="button" onClick={() => setPhase("intro")} style={s.btnGhost}>← Voltar ao início</button>
            </div>
          </div>
        )}

        {phase === "form" && !isDone && (
          <>
            {/* Barra de progresso */}
            <div style={s.progressWrap}>
              <div style={s.progressTrack}><div style={{ ...s.progressFill, width: `${progress}%`, background: accent }} /></div>
              <div style={s.progressMeta}>
                <span><strong style={{ color: accent }}>{sec.n}</strong> / 8 · {sec.titulo}</span>
              </div>
            </div>

            <div style={s.card}>
              {/* ───── SECÇÃO 1 ───── */}
              {sec.id === "entidade" && (
                <Section titulo="Identificação da entidade requerente">
                  <Field label="1.1. Nome da escola / agrupamento"><TextInput value={f.nomeEscola} onChange={(v) => set("nomeEscola", v)} placeholder="Ex.: Agrupamento de Escolas de…" /></Field>
                  <Field label="1.2. Tipo de estabelecimento"><RadioGroup options={OPC.tipoEstab} value={f.tipoEstab} onChange={(v) => set("tipoEstab", v)} accent={accent} /></Field>
                  <Field label="1.3. Estatuto especial (se aplicável)"><RadioGroup options={OPC.estatuto} value={f.estatuto} onChange={(v) => set("estatuto", v)} accent={accent} /></Field>
                  <Field label="1.4. Região / NUT III"><Select value={f.nuts} onChange={(v) => set("nuts", v)} options={NUTS_III} /></Field>
                  <Field label="1.5. Distrito"><Select value={f.distrito} onChange={(v) => set("distrito", v)} options={DISTRITOS} /></Field>
                  <Field label="1.6. Concelho" hint="Na versão final, a lista de concelhos filtra-se pelo distrito (308 concelhos, fonte oficial).">
                    <TextInput value={f.concelho} onChange={(v) => set("concelho", v)} placeholder="Concelho" /></Field>
                  <Field label="1.7. Contacto(s) e morada da instituição">
                    <div style={s.subGrid}>
                      <TextInput value={f.contacto.morada} onChange={(v) => setNested("contacto", "morada", v)} placeholder="Morada completa" />
                      <TextInput value={f.contacto.cp} onChange={(v) => setNested("contacto", "cp", v)} placeholder="Código postal" />
                      <TextInput value={f.contacto.tel} onChange={(v) => setNested("contacto", "tel", v)} placeholder="Telefone institucional" />
                      <TextInput value={f.contacto.email} onChange={(v) => setNested("contacto", "email", v)} placeholder="E-mail institucional" type="email" />
                    </div>
                  </Field>
                  <Field label="1.8. A escola tem Projeto Educativo que integre memória histórica, democracia ou cidadania?"><RadioGroup options={OPC.simNao} value={f.q18} onChange={(v) => set("q18", v)} accent={accent} /></Field>
                  <Field label="1.9. Já houve iniciativas sobre o 25 de Abril na escola este ano letivo?"><RadioGroup options={OPC.simNao} value={f.q19} onChange={(v) => set("q19", v)} accent={accent} /></Field>
                  <Field label="1.10. A escola já teve contacto com outros recursos do CD25A-UC?"><RadioGroup options={OPC.simNao} value={f.q110} onChange={(v) => set("q110", v)} accent={accent} /></Field>
                  <Field label="1.11. A escola tem projetos ativos de cidadania ou memória histórica este ano?"><RadioGroup options={OPC.simNao} value={f.q111} onChange={(v) => set("q111", v)} accent={accent} /></Field>
                </Section>
              )}

              {/* ───── SECÇÃO 2 ───── */}
              {sec.id === "docente" && (
                <Section titulo="Docente responsável" nota="Estes dados de contacto são necessários para gerir a requisição. (Validar o texto RGPD na versão final.)">
                  <div style={s.subGrid}>
                    <TextInput value={f.docente.nome} onChange={(v) => setNested("docente", "nome", v)} placeholder="Nome completo" />
                    <TextInput value={f.docente.cargo} onChange={(v) => setNested("docente", "cargo", v)} placeholder="Cargo / função" />
                    <TextInput value={f.docente.tel} onChange={(v) => setNested("docente", "tel", v)} placeholder="Telefone / telemóvel" />
                    <TextInput value={f.docente.email} onChange={(v) => setNested("docente", "email", v)} placeholder="E-mail" type="email" />
                  </div>
                </Section>
              )}

              {/* ───── SECÇÃO 3 (com condicionais) ───── */}
              {sec.id === "pedagogica" && (
                <Section titulo="Informações pedagógicas">
                  <Field label="3.1. Caracterização do grupo escolar">
                    <div style={s.subGrid}>
                      <TextInput value={f.grupo.anos} onChange={(v) => setNested("grupo", "anos", v)} placeholder="Ano(s) de escolaridade / ciclo" />
                      <TextInput value={f.grupo.nDiscentes} onChange={(v) => setNested("grupo", "nDiscentes", v)} placeholder="N.º previsto de discentes" type="number" />
                      <TextInput value={f.grupo.nTurmas} onChange={(v) => setNested("grupo", "nTurmas", v)} placeholder="N.º previsto de turmas" type="number" />
                      <TextInput value={f.grupo.nDocentes} onChange={(v) => setNested("grupo", "nDocentes", v)} placeholder="N.º de docentes acompanhantes" type="number" />
                    </div>
                  </Field>
                  <Field label="3.2. O grupo inclui alunos/as com necessidades educativas especiais (NEE)?"><RadioGroup options={OPC.simNao} value={f.q32} onChange={(v) => set("q32", v)} accent={accent} /></Field>
                  <Field label="3.3. Disciplina principal da requisição"><RadioGroup options={OPC.disciplinaPrincipal} value={f.disciplinaPrincipal} onChange={(v) => set("disciplinaPrincipal", v)} accent={accent} /></Field>
                  <Field label="3.4. A exposição será integrada em:"><CheckGroup options={OPC.integradaEm} values={f.integradaEm} onChange={(v) => set("integradaEm", v)} accent={accent} /></Field>
                  <Field label="3.5. A requisição enquadra-se nas Aprendizagens Essenciais (AE) de História?"><RadioGroup options={OPC.simNao} value={f.q35} onChange={(v) => set("q35", v)} accent={accent} /></Field>
                  {f.q35 === "Sim" && (
                    <Field label="3.6. Que domínios das AE de História pretende trabalhar?"><CheckGroup options={OPC.dominiosAE} values={f.dominiosAE} onChange={(v) => set("dominiosAE", v)} accent={accent} /></Field>
                  )}
                  <Field label="3.7. Prevê articulação com outras disciplinas?"><RadioGroup options={OPC.simNao} value={f.q37} onChange={(v) => set("q37", v)} accent={accent} /></Field>
                  {f.q37 === "Sim" && (
                    <Field label="3.8. Com que disciplinas?"><CheckGroup options={OPC.disciplinasArtic} values={f.disciplinasArtic} onChange={(v) => set("disciplinasArtic", v)} accent={accent} /></Field>
                  )}
                  <Field label="3.9. Pretende usar os materiais pedagógicos do CD25A-UC em sala de aula?"><RadioGroup options={OPC.simNao} value={f.q39} onChange={(v) => set("q39", v)} accent={accent} /></Field>
                </Section>
              )}

              {/* ───── SECÇÃO 4 ───── */}
              {sec.id === "objetivos" && (
                <Section titulo="Objetivos e expectativas">
                  <Field label="4.1. Objetivo principal da requisição"><RadioGroup options={OPC.objetivoPrincipal} value={f.objetivoPrincipal} onChange={(v) => set("objetivoPrincipal", v)} accent={accent} /></Field>
                  <Field label="4.2. Competências a desenvolver nos/as discentes"><CheckGroup options={OPC.competencias} values={f.competencias} onChange={(v) => set("competencias", v)} accent={accent} /></Field>
                  <Field label="4.3. Resultados de aprendizagem concretos que espera alcançar"><textarea value={f.q43 || ""} onChange={(e) => set("q43", e.target.value)} placeholder="Texto livre…" style={{ ...s.input, minHeight: 90, resize: "vertical", fontFamily: "inherit" }} /></Field>
                  <Field label="4.4. Necessidades dos/as discentes a que espera dar resposta"><CheckGroup options={OPC.necessidades} values={f.necessidades} onChange={(v) => set("necessidades", v)} accent={accent} /></Field>
                  <Field label="4.5. Impacto esperado nos/as discentes"><CheckGroup options={OPC.impacto} values={f.impacto} onChange={(v) => set("impacto", v)} accent={accent} /></Field>
                  <Field label="4.6. Conhecimento prévio esperado"><CheckGroup options={OPC.conhecimentoPrevio} values={f.conhecimentoPrevio} onChange={(v) => set("conhecimentoPrevio", v)} accent={accent} /></Field>
                </Section>
              )}

              {/* ───── SECÇÃO 5 ───── */}
              {sec.id === "atividades" && (
                <Section titulo="Atividades planeadas">
                  <Field label="5.1. Está prevista uma atividade de preparação antes da exposição?"><RadioGroup options={OPC.simNao} value={f.q51} onChange={(v) => set("q51", v)} accent={accent} /></Field>
                  <Field label="5.2. Está prevista uma atividade de seguimento ou avaliação depois?"><RadioGroup options={OPC.simNao} value={f.q52} onChange={(v) => set("q52", v)} accent={accent} /></Field>
                </Section>
              )}

              {/* ───── SECÇÃO 6 (com condicional) ───── */}
              {sec.id === "repositorio" && (
                <Section titulo="Repositório digital e Kit Pedagógico">
                  <Field label="6.1. Conhecia o repositório digital do CD25A-UC?"><RadioGroup options={OPC.simNao} value={f.q61} onChange={(v) => set("q61", v)} accent={accent} /></Field>
                  <Field label="6.2. Tenciona aceder ao repositório no âmbito desta requisição?"><RadioGroup options={OPC.simNao} value={f.q62} onChange={(v) => set("q62", v)} accent={accent} /></Field>
                  <Field label="6.3. Tenciona utilizar o kit pedagógico com os/as discentes?"><RadioGroup options={OPC.simNao} value={f.q63} onChange={(v) => set("q63", v)} accent={accent} /></Field>
                  {f.q63 === "Sim" && (
                    <Field label="6.4. Que atividades do kit tenciona utilizar?"><CheckGroup options={OPC.atividadesKit} values={f.atividadesKit} onChange={(v) => set("atividadesKit", v)} accent={accent} /></Field>
                  )}
                </Section>
              )}

              {/* ───── SECÇÃO 7 ───── */}
              {sec.id === "relacao" && (
                <Section titulo="Relação com o CD25A-UC">
                  <Field label="7.1. Como tomou conhecimento da exposição?"><RadioGroup options={OPC.comoConheceu} value={f.q71} onChange={(v) => set("q71", v)} accent={accent} /></Field>
                  <Field label="7.2. A instituição já conhecia o CD25A-UC?"><RadioGroup options={OPC.simNao} value={f.q72} onChange={(v) => set("q72", v)} accent={accent} /></Field>
                  <Field label="7.3. A escola já requisitou esta exposição anteriormente?"><RadioGroup options={OPC.simNao} value={f.q73} onChange={(v) => set("q73", v)} accent={accent} /></Field>
                </Section>
              )}

              {/* ───── SECÇÃO 8 — LOCAL + CALENDÁRIO ───── */}
              {sec.id === "datas" && (
                <Section titulo="Local e datas pretendidas">
                  <Field label="8.1. Onde quer receber a exposição?">
                    <div style={s.localRow}>
                      {[{ id: "coimbra", nome: "Coimbra", c: "#E5544B" }, { id: "evora", nome: "Évora", c: "#7C5CBF" }].map((c) => {
                        const active = local === c.id;
                        return (
                          <button key={c.id} type="button" onClick={() => setF((p) => ({ ...p, local: c.id, datas: null }))}
                            style={{ ...s.localCard, borderColor: active ? c.c : "#E4E1DA", background: active ? c.c + "12" : "#fff" }}>
                            <span style={{ ...s.localDot, background: c.c }} /><span style={s.localNome}>{c.nome}</span>
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                  {local ? (
                    <Field label="8.2. Selecione o período pretendido" hint="Fins de semana e feriados não contam como dias de visita.">
                      <Calendario local={local} value={f.datas} onChange={(v) => set("datas", v)} accent={accent} />
                    </Field>
                  ) : <div style={s.placeholder}>Escolha o local para ver o calendário.</div>}
                </Section>
              )}

              {/* Navegação */}
              {Array.isArray(erroValidacao) && erroValidacao.length > 0 && (
                <div style={s.erroValidacao}>
                  <strong>Campos obrigatórios em falta:</strong>
                  <ul style={{ margin: "6px 0 0", paddingLeft: 20 }}>
                    {erroValidacao.map((campo) => <li key={campo}>{campo}</li>)}
                  </ul>
                </div>
              )}
              <div style={s.navRow}>
                <button type="button" onClick={prev} disabled={step === 0} style={{ ...s.btnGhost, opacity: step === 0 ? 0.4 : 1, cursor: step === 0 ? "not-allowed" : "pointer" }}>Anterior</button>
                <button type="button" onClick={next} style={{ ...s.btnPrimary, background: accent }}>{step === SECTIONS.length - 1 ? "Rever e submeter" : "Continuar"}</button>
              </div>
            </div>
          </>
        )}

        {/* CONFIRMAÇÃO */}
        {phase === "form" && isDone && (
          <div style={s.card}>
            {submitting ? (
              <>
                <div style={{ ...s.confirmIcon, background: accent + "18", color: accent, fontSize: 20 }}>⏳</div>
                <h2 style={s.confirmTitle}>A submeter…</h2>
                <p style={s.confirmText}>A sua requisição está a ser registada. Por favor, aguarde.</p>
              </>
            ) : submitError ? (
              <>
                <div style={{ ...s.confirmIcon, background: "#FFF0F0", color: "#C0392B" }}>✕</div>
                <h2 style={s.confirmTitle}>Erro ao submeter</h2>
                <p style={s.confirmText}>{submitError}</p>
                <div style={{ textAlign: "center" }}>
                  <button type="button" onClick={() => { setSubmitError(null); setCodigoGerado(null); }} style={{ ...s.btnPrimary, background: accent }}>Tentar novamente</button>
                </div>
              </>
            ) : codigoGerado ? (
              <>
                <div style={{ ...s.confirmIcon, background: accent + "18", color: accent }}>✓</div>
                <h2 style={s.confirmTitle}>Requisição submetida</h2>
                {codigoGerado && (
                  <div style={{ textAlign: "center", margin: "0 auto 20px" }}>
                    <div style={{ fontSize: 13, color: "#8A847B", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em" }}>Código da sua requisição</div>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 32, fontWeight: 800, color: accent, letterSpacing: ".04em", background: accent + "12", display: "inline-block", padding: "10px 28px", borderRadius: 14, border: `2px solid ${accent}40` }}>{codigoGerado}</div>
                    <div style={{ marginTop: 12, fontSize: 13.5, color: "#6B655C", lineHeight: 1.5, maxWidth: 380, margin: "12px auto 0" }}>Guarde este código — vai precisar dele para avaliar a exposição no final.</div>
                  </div>
                )}
                <p style={s.confirmText}>
                  As datas para <strong>{local === "evora" ? "Évora" : "Coimbra"}</strong> ficam
                  automaticamente bloqueadas para outras escolas.
                </p>
                <div style={s.resumo}>
                  <div style={s.resumoRow}><span style={s.resumoK}>Escola</span><span>{f.nomeEscola || "—"}</span></div>
                  <div style={s.resumoRow}><span style={s.resumoK}>Local</span><span>{local === "evora" ? "Évora" : local === "coimbra" ? "Coimbra" : "—"}</span></div>
                  <div style={s.resumoRow}><span style={s.resumoK}>Datas</span><span>{f.datas?.start && f.datas?.end ? `${f.datas.start.toLocaleDateString("pt-PT")} — ${f.datas.end.toLocaleDateString("pt-PT")}` : "—"}</span></div>
                  <div style={s.resumoRow}><span style={s.resumoK}>Discentes</span><span>{f.grupo.nDiscentes || "—"}</span></div>
                </div>
                <button type="button" onClick={() => onVoltar?.()} style={{ ...s.btnGhost, marginTop: 18 }}>← Voltar ao início</button>
              </>
            ) : (
              <>
                <div style={{ ...s.confirmIcon, background: accent + "18", color: accent, fontSize: 20 }}>⏳</div>
                <h2 style={s.confirmTitle}>A submeter…</h2>
                <p style={s.confirmText}>A sua requisição está a ser registada. Por favor, aguarde.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ titulo, nota, children }) {
  return (
    <div>
      <h2 style={s.secTitle}>{titulo}</h2>
      {nota && <div style={s.secNota}>{nota}</div>}
      <div style={{ marginTop: 18 }}>{children}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  ESTILOS
// ════════════════════════════════════════════════════════════
const s = {
  page: { minHeight: "100vh", background: "linear-gradient(170deg,#FBFAF7 0%,#F6F3EC 100%)", fontFamily: "'Inter',system-ui,sans-serif", padding: "40px 20px", color: "#2B2723" },
  shell: { maxWidth: 600, margin: "0 auto" },
  header: { marginBottom: 24 },
  eyebrow: { fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "#B08968", fontWeight: 600, marginBottom: 10 },
  title: { fontFamily: "'Fraunces',serif", fontSize: 38, lineHeight: 1.05, fontWeight: 800, margin: 0, letterSpacing: "-.02em" },
  progressWrap: { marginBottom: 18 },
  progressTrack: { height: 6, background: "#EAE6DE", borderRadius: 99, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 99, transition: "width .3s ease" },
  progressMeta: { marginTop: 8, fontSize: 13.5, color: "#6B655C" },
  card: { background: "#fff", border: "1px solid #ECE8E1", borderRadius: 22, padding: "30px 30px 24px", boxShadow: "0 12px 40px #2b27230d" },
  secTitle: { fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 600, margin: 0, letterSpacing: "-.01em" },
  secNota: { marginTop: 8, fontSize: 13, color: "#8A847B", background: "#FBF9F4", border: "1px solid #EFE9DD", borderRadius: 10, padding: "10px 12px" },
  label: { display: "block", fontSize: 14.5, fontWeight: 600, marginBottom: 8, lineHeight: 1.4 },
  hint: { fontSize: 12.5, color: "#8A847B", marginBottom: 10, marginTop: -2 },
  input: { width: "100%", padding: "11px 14px", border: "1.5px solid #E4E1DA", borderRadius: 11, fontSize: 14.5, fontFamily: "inherit", color: "#2B2723", background: "#fff", outline: "none", transition: "border-color .15s" },
  subGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  option: { display: "flex", alignItems: "center", gap: 11, padding: "11px 14px", border: "1.5px solid", borderRadius: 11, fontSize: 14, fontFamily: "inherit", textAlign: "left", cursor: "pointer", transition: "all .15s", lineHeight: 1.35 },
  radioDot: { width: 18, height: 18, borderRadius: "50%", border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  radioInner: { width: 9, height: 9, borderRadius: "50%" },
  checkBox: { width: 18, height: 18, borderRadius: 6, border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  checkMark: { color: "#fff", fontSize: 12, fontWeight: 700, lineHeight: 1 },
  localRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  localCard: { border: "1.5px solid", borderRadius: 16, padding: "18px", display: "flex", flexDirection: "column", gap: 8, cursor: "pointer", fontFamily: "inherit", transition: "all .18s" },
  localDot: { width: 11, height: 11, borderRadius: "50%" },
  localNome: { fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 600 },
  placeholder: { padding: "24px", textAlign: "center", color: "#9A948B", fontSize: 14, background: "#FBFAF7", borderRadius: 12, border: "1px dashed #DDD8CF" },
  erroValidacao: { marginTop: 20, background: "#FDECEA", border: "1px solid #F5C6C0", borderRadius: 12, padding: "12px 16px", fontSize: 13.5, lineHeight: 1.5, color: "#B3261E" },
  navRow: { display: "flex", justifyContent: "space-between", gap: 12, marginTop: 28, paddingTop: 20, borderTop: "1px solid #F0ECE4" },
  btnGhost: { padding: "12px 22px", border: "1.5px solid #E4E1DA", borderRadius: 12, background: "#fff", fontSize: 14.5, fontWeight: 600, fontFamily: "inherit", color: "#54504A", cursor: "pointer" },
  btnPrimary: { padding: "12px 26px", border: "none", borderRadius: 12, color: "#fff", fontSize: 14.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" },
  // calendário
  calCard: { background: "#fff", border: "1.5px solid", borderRadius: 18, padding: "18px 18px 22px" },
  calNav: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  navBtn: { width: 36, height: 36, borderRadius: 11, border: "1px solid #ECE8E1", background: "#FBFAF7", fontSize: 20, cursor: "pointer", color: "#6B655C", fontFamily: "inherit" },
  monthLabel: { fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 600 },
  weekRow: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 6 },
  weekCell: { textAlign: "center", fontSize: 11.5, fontWeight: 600, padding: "3px 0" },
  calGrid: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 },
  dayBtn: { aspectRatio: "1", border: "none", borderRadius: 10, fontSize: 14, fontFamily: "inherit", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" },
  holidayDot: { position: "absolute", top: 5, right: 5, width: 5, height: 5, borderRadius: "50%" },
  legend: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 12 },
  legendItem: { display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#6B655C" },
  legendSwatch: { width: 15, height: 15, borderRadius: 5, display: "inline-block" },
  counter: { background: "#FBFAF7", border: "1px solid #ECE8E1", borderRadius: 12, padding: "12px 16px", fontSize: 14.5, color: "#6B655C" },
  counterSep: { margin: "0 9px", color: "#D6D1C8" },
  warn: { marginTop: 12, background: "#FFF8E6", border: "1px solid #F0E2B8", borderRadius: 12, padding: "11px 15px", fontSize: 13, lineHeight: 1.5, color: "#8A6D1F" },
  // confirmação
  confirmIcon: { width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, margin: "0 auto 18px" },
  confirmTitle: { fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 700, textAlign: "center", margin: "0 0 10px" },
  confirmText: { fontSize: 14.5, lineHeight: 1.6, color: "#6B655C", textAlign: "center", margin: "0 auto 22px", maxWidth: 420 },
  resumo: { display: "flex", flexDirection: "column", gap: 1, background: "#ECE8E1", borderRadius: 14, overflow: "hidden", border: "1px solid #ECE8E1" },
  resumoRow: { display: "flex", justifyContent: "space-between", gap: 16, background: "#FBFAF7", padding: "13px 16px", fontSize: 14 },
  resumoK: { fontWeight: 600, color: "#8A847B", fontSize: 13 },
  gateEyebrow: { fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: "#B08968", fontWeight: 600, marginBottom: 12 },
  gateText: { fontSize: 14.5, lineHeight: 1.65, color: "#54504A", margin: "16px 0 26px", background: "#FBFAF7", border: "1px solid #EFE9DD", borderRadius: 14, padding: "20px 22px" },
  gateNav: { display: "flex", justifyContent: "space-between", gap: 12 },
};
