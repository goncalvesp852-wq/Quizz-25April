const LOGO_CRAVO = "/images/logo_cravo.png";

export default function TopBar({ onVoltar, label = "← Início" }) {
  return (
    <div style={s.bar}>
      <div style={s.inner}>
        <button type="button" onClick={onVoltar} style={s.back} aria-label="Voltar à página inicial">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {label}
        </button>
        <img src={LOGO_CRAVO} alt="25 de Abril em 3D" style={s.logo} />
      </div>
    </div>
  );
}

const s = {
  bar: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(251,250,247,0.88)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    borderBottom: "1px solid #EAE6DE",
  },
  inner: {
    maxWidth: 700,
    margin: "0 auto",
    padding: "10px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  back: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "none",
    border: "none",
    padding: "6px 10px",
    borderRadius: 9,
    fontSize: 14,
    fontWeight: 600,
    color: "#54504A",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "background .15s, color .15s",
  },
  logo: {
    height: 30,
    width: "auto",
    opacity: 0.7,
  },
};
