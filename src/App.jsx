import { useState, useEffect, useCallback } from "react";
import Entrada from "./pages/Entrada.jsx";
import Homepage from "./pages/Homepage.jsx";
import Requisicao from "./pages/Requisicao.jsx";
import Avaliacao from "./pages/Avaliacao.jsx";
import AreaReservada from "./pages/AreaReservada.jsx";
import { getSessao, logout, ehAdmin } from "./lib/auth.js";

const PAGES = ["home", "requisicao", "avaliacao"];

function pageFromPath() {
  const path = window.location.pathname.replace(/^\//, "") || "home";
  return PAGES.includes(path) ? path : "home";
}

export default function App() {
  const [perfil, setPerfil] = useState(getSessao);
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
    window.history.replaceState({ page }, "", window.location.pathname);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const goHome = () => navigate("home");

  // ── Autenticação ──────────────────────────────────────────
  function handleAutenticado(p) {
    setPerfil(p);
    navigate("home");
  }
  function handleSair() {
    logout();
    setPerfil(null);
    navigate("home");
  }

  // 1) Sem sessão → página de entrada (iniciar sessão / criar conta)
  if (!perfil) {
    return <Entrada onAutenticado={handleAutenticado} />;
  }

  // 2) Equipa / gestão (tipo_perfil 2, 3, 4) → painel de gestão direto
  if (ehAdmin(perfil)) {
    return <AreaReservada perfil={perfil} onSair={handleSair} />;
  }

  // 3) Utilizador normal (tipo_perfil 1) → site público "25 de Abril em 3D"
  if (page === "requisicao") return <Requisicao onVoltar={goHome} />;
  if (page === "avaliacao")  return <Avaliacao  onVoltar={goHome} />;

  return (
    <Homepage
      perfil={perfil}
      onRequisitar={() => navigate("requisicao")}
      onAvaliar={() => navigate("avaliacao")}
      onSair={handleSair}
    />
  );
}
