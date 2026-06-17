import { useState, useEffect } from "react";

// Logótipos e ícone do projeto (data-URI base64 dos ficheiros do Pedro)
const LOGO_CRAVO = "/images/logo_cravo.png";
const LOGO_FCT = "/images/logo_fct.png";
const LOGO_UC = "/images/logo_uc.png";
const LOGO_CD25A = "/images/logo_cd25a.png";
const LOGO_C50 = "/images/logo_c50.png";
const LOGO_PNA = "/images/logo_pna.png";
const LOGO_REBOBINAR = "/images/logo_rebobinar.png";

// ════════════════════════════════════════════════════════════
//  HOMEPAGE — «25 de Abril em 3D»
//  Logo central · fundo em fade lento · área reservada · rodapé
//  (Imagens e logos são placeholders — substituir pelos ficheiros reais.)
// ════════════════════════════════════════════════════════════

// Imagens de fundo — acervo do CD25A-UC (25 de Abril e período revolucionário).
const BG_SOLDADOS = "/images/bg_soldados.jpg";
const BG_TANQUE = "/images/bg_tanque.jpg";
const BG_MANIF_LX = "/images/bg_manif_lx.jpg";
const BG_FASCISMO = "/images/bg_fascismo.jpg";
const BG_CRIANCAS = "/images/bg_criancas.jpg";
const BG_LONDRES = "/images/bg_londres.jpg";
const BG_JIPE = "/images/bg_jipe.jpg";
const BG_PUNHOS = "/images/bg_punhos.jpg";
const BG_COLONIAS = "/images/bg_colonias.jpg";
const BG_POVO_CARRO = "/images/bg_povo_carro.jpg";
const BG_CARROS = "/images/bg_carros.jpg";
const BG_ULTRAMAR = "/images/bg_ultramar.jpg";

const BG_SLIDES = [
  { src: BG_SOLDADOS },
  { src: BG_TANQUE },
  { src: BG_PUNHOS },
  { src: BG_MANIF_LX },
  { src: BG_JIPE },
  { src: BG_FASCISMO },
  { src: BG_LONDRES },
  { src: BG_CRIANCAS },
  { src: BG_COLONIAS },
  { src: BG_POVO_CARRO },
  { src: BG_CARROS },
  { src: BG_ULTRAMAR },
];

const FADE_INTERVAL = 7000; // 6s por imagem

export default function Homepage({ onRequisitar, onAvaliar, onAreaReservada }) {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % BG_SLIDES.length), FADE_INTERVAL);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,900&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        @keyframes kenburns { 0% { transform: scale(1.0); } 100% { transform: scale(1.08); } }
        .bg-slide { animation: kenburns 28s ease-in-out infinite alternate; }
        .req-btn { transition: transform .18s, box-shadow .18s; }
        .req-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 40px #00000040; }
        .aval-btn { transition: background .15s, border-color .15s, transform .18s; }
        .aval-btn:hover { transform: translateY(-2px); background: #ffffff1f; border-color: #ffffff80; }
        .req-btn:focus-visible, .aval-btn:focus-visible, .login-link:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
        .login-link { transition: background .15s, border-color .15s; }
        .login-link:hover { background: #ffffff1f; border-color: #ffffff66; }
        @media (prefers-reduced-motion: reduce){ .bg-slide { animation: none; } * { transition: none !important; } }
        .social-link:hover { background: #2B272314 !important; border-color: #00000020 !important; color: #2B2723 !important; }
        .social-link:focus-visible { outline: 2px solid #B08968; outline-offset: 2px; }
        @media (max-width: 720px){ .hero-title { font-size: 40px !important; } .footer-inner { flex-direction: column !important; align-items: flex-start !important; } .footer-social { text-align: left !important; } }
      `}</style>

      {/* ───── FUNDO: imagens em fade lento ───── */}
      <div style={s.bgWrap}>
        {BG_SLIDES.map((sl, i) => (
          <div key={i} className="bg-slide"
            style={{
              ...s.bgSlide,
              backgroundImage: `url(${sl.src})`,
              opacity: i === slide ? 1 : 0,
            }}
            aria-hidden="true" />
        ))}
        <div style={s.bgScrim} aria-hidden="true" />
      </div>

      {/* ───── TOPO: área reservada ───── */}
      <header style={s.topbar}>
        <div style={s.topbarInner}>
          <button type="button" className="login-link" style={s.loginLink} onClick={onAreaReservada}>
            Área reservada
          </button>
        </div>
      </header>

      {/* ───── CENTRO: logo + botão ───── */}
      <main style={s.hero}>
        <div style={s.logoBlock}>
          <img src={LOGO_CRAVO} alt="25 de Abril em 3D" style={s.logoCravo} />
          <h1 className="hero-title" style={s.heroTitle}>25 de Abril em 3D</h1>
          <p style={s.heroSub}>Democratizar · Descolonizar · Desenvolver</p>
        </div>

        <div style={s.ctaRow}>
          <button type="button" className="req-btn" style={s.reqBtn} onClick={onRequisitar}>
            Requisitar a exposição →
          </button>
          <button type="button" className="aval-btn" style={s.avalBtn} onClick={onAvaliar}>
            Avaliar a exposição
          </button>
        </div>
        <p style={s.heroHint}>Para aceder à avaliação, deverá indicar o código de requisição recebido por e-mail.</p>
      </main>

      {/* ───── RODAPÉ ───── */}
      <footer style={s.footer}>
        <div className="footer-inner" style={s.footerInner}>
          <div style={s.footerLogos}>
            <div style={s.logoGroup}>
              <span style={s.footerLabel}>Financiamento</span>
              <div style={s.logoRow}>
                <img src={LOGO_FCT} alt="Fundação para a Ciência e a Tecnologia" style={s.logoFct} />
              </div>
            </div>
            <div style={s.logoDivider} />
            <div style={s.logoGroup}>
              <span style={s.footerLabel}>Coordenação</span>
              <div style={s.logoRow}>
                <img src={LOGO_CD25A} alt="Centro de Documentação 25 de Abril" style={s.logoCd25a} />
                <img src={LOGO_UC} alt="Universidade de Coimbra" style={s.logoUc} />
              </div>
            </div>
            <div style={s.logoDivider} />
            <div style={s.logoGroup}>
              <span style={s.footerLabel}>Apoio</span>
              <div style={s.logoRow}>
                <img src={LOGO_C50} alt="Comemorações 50 anos do 25 de Abril" style={s.logoC50} />
                <img src={LOGO_PNA} alt="Plano Nacional das Artes" style={s.logoApoio} />
                <img src={LOGO_REBOBINAR} alt="Rebobinar" style={s.logoApoio} />
              </div>
            </div>
          </div>

          <div className="footer-social" style={s.social}>
            <span style={s.socialText}>Acompanhe a itinerância das exposições</span>
            <div style={s.socialIcons}>
              <a href="#" className="social-link" style={s.socialLink} aria-label="Instagram do CD25A">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href="#" className="social-link" style={s.socialLink} aria-label="Facebook do CD25A">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
            </div>
          </div>
        </div>

        <div style={s.copyright}>
          © Centro de Documentação 25 de Abril da Universidade de Coimbra · 2026 · Todos os direitos reservados
        </div>
      </footer>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", position: "relative", fontFamily: "'Inter',system-ui,sans-serif", display: "flex", flexDirection: "column", overflow: "hidden", color: "#fff" },
  // fundo
  bgWrap: { position: "fixed", inset: 0, zIndex: 0 },
  bgSlide: { position: "absolute", inset: 0, transition: "opacity 3s ease-in-out", backgroundSize: "cover", backgroundPosition: "center", willChange: "opacity, transform" },
  bgScrim: { position: "absolute", inset: 0, background: "linear-gradient(180deg, #00000078 0%, #00000052 40%, #0000008c 100%)" },
  // topo
  topbar: { position: "relative", zIndex: 2, padding: "20px 24px" },
  topbarInner: { maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "flex-end" },
  topbarBrand: { fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 17, letterSpacing: ".02em", textShadow: "0 1px 8px #0006" },
  loginLink: { display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 99, border: "1px solid #ffffff33", background: "#ffffff12", backdropFilter: "blur(8px)", color: "#fff", fontSize: 13.5, fontWeight: 500, fontFamily: "inherit", cursor: "pointer" },
  lockIcon: { fontSize: 14, opacity: 0.9 },
  // hero
  hero: { position: "relative", zIndex: 2, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "60px 24px" },
  logoBlock: { marginBottom: 40 },
  logoCravo: { width: "clamp(90px,8vw,140px)", height: "auto", margin: "0 auto 24px", display: "block", filter: "drop-shadow(0 12px 40px #00000050)" },
  heroTitle: { fontFamily: "'Fraunces',serif", fontSize: "clamp(40px,5vw,80px)", fontWeight: 900, margin: "0 0 14px", letterSpacing: "-.03em", textShadow: "0 2px 24px #0007", lineHeight: 1 },
  heroSub: { fontSize: "clamp(14px,1.2vw,20px)", letterSpacing: ".04em", color: "#ffffffdd", margin: 0, fontWeight: 500, textShadow: "0 1px 12px #0006" },
  reqBtn: { padding: "clamp(14px,1.2vw,20px) clamp(28px,2.5vw,48px)", borderRadius: 99, border: "none", background: "#fff", color: "#1c1a18", fontSize: "clamp(15px,1.1vw,19px)", fontWeight: 600, fontFamily: "inherit", cursor: "pointer", boxShadow: "0 10px 32px #00000035" },
  ctaRow: { display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" },
  avalBtn: { padding: "clamp(14px,1.2vw,20px) clamp(22px,2vw,40px)", borderRadius: 99, border: "1.5px solid #ffffff4d", background: "#ffffff12", backdropFilter: "blur(8px)", color: "#fff", fontSize: "clamp(15px,1.1vw,19px)", fontWeight: 600, fontFamily: "inherit", cursor: "pointer" },
  heroHint: { marginTop: 18, fontSize: "clamp(12px,0.85vw,15px)", color: "#ffffffb0", letterSpacing: ".03em", textShadow: "0 1px 10px #0006" },
  // rodapé
  footer: { position: "relative", zIndex: 2, background: "#F5F1E8", borderTop: "1px solid #00000010", padding: "20px 24px 16px" },
  footerInner: { maxWidth: 1400, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 28, flexWrap: "nowrap" },
  footerLogos: { display: "flex", alignItems: "flex-start", gap: 24, flexWrap: "wrap" },
  logoGroup: { display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" },
  logoDivider: { width: 1, alignSelf: "stretch", background: "#00000012", margin: "4px 0" },
  footerLabel: { fontSize: "clamp(8px,0.7vw,11px)", letterSpacing: ".14em", textTransform: "uppercase", color: "#A8A299", fontWeight: 600 },
  logoRow: { display: "flex", gap: "clamp(10px,1.2vw,22px)", alignItems: "center", height: "clamp(50px,5vw,76px)" },
  logoImg: { height: "clamp(28px,2.5vw,42px)", width: "auto", objectFit: "contain", maxWidth: 180 },
  logoFct: { height: "clamp(30px,2.6vw,44px)", width: "auto", objectFit: "contain", maxWidth: 200 },
  logoCd25a: { height: "clamp(38px,3.6vw,58px)", width: "auto", objectFit: "contain", maxWidth: 240 },
  logoUc: { height: "clamp(34px,3.2vw,52px)", width: "auto", objectFit: "contain", maxWidth: 180 },
  logoC50: { height: "clamp(44px,4vw,66px)", width: "auto", objectFit: "contain", maxWidth: 180 },
  logoApoio: { height: "clamp(36px,3.4vw,56px)", width: "auto", objectFit: "contain", maxWidth: 180 },
  social: { display: "flex", alignItems: "center", gap: 12, marginLeft: "auto" },
  socialText: { fontSize: 12.5, color: "#8A847B", lineHeight: 1.3, textAlign: "right", maxWidth: 180 },
  socialIcons: { display: "flex", gap: 8, flexShrink: 0 },
  socialLink: { display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 9, background: "#2B27230a", border: "1px solid #00000012", color: "#54504A", textDecoration: "none", transition: "all .15s" },
  copyright: { maxWidth: 1100, margin: "16px auto 0", paddingTop: 14, borderTop: "1px solid #00000010", fontSize: 11.5, color: "#A8A299", textAlign: "center", lineHeight: 1.5 },
};
