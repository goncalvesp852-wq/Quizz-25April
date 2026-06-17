import { useState, useEffect, useCallback } from "react";
import Homepage from "./pages/Homepage.jsx";
import Requisicao from "./pages/Requisicao.jsx";
import Avaliacao from "./pages/Avaliacao.jsx";
import AreaReservada from "./pages/AreaReservada.jsx";

const PAGES = ["home", "requisicao", "avaliacao", "reservada"];

function pageFromPath() {
  const path = window.location.pathname.replace(/^\//, "") || "home";
  return PAGES.includes(path) ? path : "home";
}

export default function App() {
  const [page, setPage] = useState(pageFromPath);

  // Sincroniza a URL quando a página muda (navegação interna)
  const navigate = useCallback((target) => {
    const path = target === "home" ? "/" : `/${target}`;
    window.history.pushState({ page: target }, "", path);
    setPage(target);
    window.scrollTo(0, 0);
  }, []);

  // Botão ← do browser
  useEffect(() => {
    function onPop(e) {
      const target = e.state?.page ?? pageFromPath();
      setPage(target);
      window.scrollTo(0, 0);
    }
    window.addEventListener("popstate", onPop);
    // Regista o estado inicial para que o primeiro popstate funcione
    window.history.replaceState({ page }, "", window.location.pathname);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const goHome = () => navigate("home");

  if (page === "requisicao") return <Requisicao onVoltar={goHome} />;
  if (page === "avaliacao")  return <Avaliacao  onVoltar={goHome} />;
  if (page === "reservada")  return <AreaReservada onVoltar={goHome} />;

  return (
    <Homepage
      onRequisitar={() => navigate("requisicao")}
      onAvaliar={() => navigate("avaliacao")}
      onAreaReservada={() => navigate("reservada")}
    />
  );
}
