import { useState } from "react";
import Homepage from "./pages/Homepage.jsx";
import Requisicao from "./pages/Requisicao.jsx";
import Avaliacao from "./pages/Avaliacao.jsx";
import AreaReservada from "./pages/AreaReservada.jsx";

export default function App() {
  const [page, setPage] = useState("home");
  const goHome = () => setPage("home");

  if (page === "requisicao") return <Requisicao onVoltar={goHome} />;
  if (page === "avaliacao")  return <Avaliacao  onVoltar={goHome} />;
  if (page === "reservada")  return <AreaReservada onVoltar={goHome} />;

  return (
    <Homepage
      onRequisitar={() => setPage("requisicao")}
      onAvaliar={() => setPage("avaliacao")}
      onAreaReservada={() => setPage("reservada")}
    />
  );
}
