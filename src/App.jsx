import { useState } from "react";
import Homepage from "./pages/Homepage.jsx";
import Requisicao from "./pages/Requisicao.jsx";
import Avaliacao from "./pages/Avaliacao.jsx";
import AreaReservada from "./pages/AreaReservada.jsx";

// ────────────────────────────────────────────────────────────
//  Navegação de DEMONSTRAÇÃO
//  Barra simples no topo só para percorrer as 4 páginas da
//  maqueta. Não faz parte do site final — serve para veres
//  o resultado enquanto está a ser montado.
// ────────────────────────────────────────────────────────────
const PAGES = [
  { id: "home", nome: "Homepage", Comp: Homepage },
  { id: "requisicao", nome: "Requisição", Comp: Requisicao },
  { id: "avaliacao", nome: "Avaliação", Comp: Avaliacao },
  { id: "reservada", nome: "Área reservada", Comp: AreaReservada },
];

export default function App() {
  const [page, setPage] = useState("home");
  const Current = PAGES.find((p) => p.id === page).Comp;

  return (
    <div>
      <nav style={nav.bar}>
        <span style={nav.label}>Demonstração · ver páginas:</span>
        {PAGES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPage(p.id)}
            style={{
              ...nav.btn,
              ...(page === p.id ? nav.btnActive : null),
            }}
          >
            {p.nome}
          </button>
        ))}
      </nav>
      <Current />
    </div>
  );
}

const nav = {
  bar: {
    position: "sticky",
    top: 0,
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    padding: "8px 14px",
    background: "#1a1714",
    color: "#fff",
    fontFamily: "system-ui, sans-serif",
    fontSize: 13,
  },
  label: { opacity: 0.6, marginRight: 6 },
  btn: {
    border: "1px solid #ffffff30",
    background: "transparent",
    color: "#fff",
    padding: "5px 12px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "inherit",
  },
  btnActive: { background: "#fff", color: "#1a1714", borderColor: "#fff" },
};
