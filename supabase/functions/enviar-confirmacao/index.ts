import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Variáveis de ambiente (configuradas no painel do Supabase)
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL     = Deno.env.get("FROM_EMAIL") ?? "25 de Abril em 3D <onboarding@resend.dev>";
const SITE_URL       = Deno.env.get("SITE_URL") ?? "https://quizz-25-april.vercel.app";

// Cliente Supabase com service role (variáveis automáticas nas Edge Functions)
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// ── Helpers ──────────────────────────────────────────────────
function fmtData(iso: string): string {
  const [y, m, d] = iso.split("T")[0].split("-");
  return `${d}/${m}/${y}`;
}

function corLocal(local: string): string {
  return local === "coimbra" ? "#E5544B" : "#7C5CBF";
}

async function enviarEmail(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend: ${res.status} — ${body}`);
  }
}

// ── Templates de e-mail ──────────────────────────────────────
function emailDocente(req: Record<string, unknown>, membro: Record<string, string> | null): string {
  const local    = req.local as string;
  const localNome = local === "coimbra" ? "Coimbra" : "Évora";
  const cor      = corLocal(local);
  const membroInfo = membro
    ? `<p style="margin:0 0 12px">O/A responsável pela exposição em <strong>${localNome}</strong> é
       <strong>${membro.nome}</strong>${membro.cargo ? ` (${membro.cargo})` : ""}.
       Contacto: <a href="mailto:${membro.email}" style="color:${cor}">${membro.email}</a>
       ${membro.telemovel ? `· ${membro.telemovel}` : ""}.</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt"><head><meta charset="utf-8"><title>Requisição confirmada</title></head>
<body style="margin:0;padding:0;background:#F6F3EC;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 8px 32px #2b272312">
  <!-- cabeçalho -->
  <tr><td style="background:${cor};padding:32px 40px">
    <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#ffffff99;margin-bottom:8px">Exposição itinerante</div>
    <div style="font-size:26px;font-weight:700;color:#fff">25 de Abril em 3D</div>
  </td></tr>
  <!-- corpo -->
  <tr><td style="padding:36px 40px;color:#2B2723">
    <h1 style="font-size:20px;margin:0 0 16px;font-weight:700">Requisição recebida com sucesso</h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6">Caro/a <strong>${req.docente_nome}</strong>,</p>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#54504A">
      A requisição da exposição <strong>«25 de Abril em 3D: Democratizar, Descolonizar, Desenvolver»</strong>
      para <strong>${req.nome_escola}</strong> foi registada com sucesso.
    </p>
    <!-- detalhes -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px;font-size:14px">
      <tr><td style="padding:10px 0;border-bottom:1px solid #F0ECE4;color:#8A847B;width:35%">Local</td><td style="padding:10px 0;border-bottom:1px solid #F0ECE4;font-weight:600">${localNome}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #F0ECE4;color:#8A847B">Escola</td><td style="padding:10px 0;border-bottom:1px solid #F0ECE4">${req.nome_escola}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #F0ECE4;color:#8A847B">Início</td><td style="padding:10px 0;border-bottom:1px solid #F0ECE4">${fmtData(req.data_inicio as string)}</td></tr>
      <tr><td style="padding:10px 0;color:#8A847B">Fim</td><td style="padding:10px 0">${fmtData(req.data_fim as string)}</td></tr>
    </table>
    ${membroInfo}
    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#54504A">
      A equipa do CD25A-UC entrará em contacto para confirmar os detalhes logísticos da montagem.
    </p>
  </td></tr>
  <!-- rodapé -->
  <tr><td style="background:#F4F0E8;padding:20px 40px;font-size:12px;color:#8A847B;text-align:center">
    Centro de Documentação 25 de Abril · Universidade de Coimbra
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function emailEquipa(req: Record<string, unknown>): string {
  const local     = req.local as string;
  const localNome = local === "coimbra" ? "Coimbra" : "Évora";
  const cor       = corLocal(local);

  return `<!DOCTYPE html>
<html lang="pt"><head><meta charset="utf-8"><title>Nova requisição</title></head>
<body style="margin:0;padding:0;background:#F6F3EC;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 8px 32px #2b272312">
  <tr><td style="background:#2B2723;padding:28px 40px">
    <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#ffffff60;margin-bottom:6px">Área reservada · CD25A</div>
    <div style="font-size:20px;font-weight:700;color:#fff">Nova requisição — <span style="color:${cor}">${localNome}</span></div>
  </td></tr>
  <tr><td style="padding:32px 40px;color:#2B2723">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;margin-bottom:28px">
      <tr><td style="padding:10px 0;border-bottom:1px solid #F0ECE4;color:#8A847B;width:35%">Requisição</td><td style="padding:10px 0;border-bottom:1px solid #F0ECE4;font-weight:700;color:${cor}">#${req.id}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #F0ECE4;color:#8A847B">Escola</td><td style="padding:10px 0;border-bottom:1px solid #F0ECE4;font-weight:600">${req.nome_escola}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #F0ECE4;color:#8A847B">Docente</td><td style="padding:10px 0;border-bottom:1px solid #F0ECE4">${req.docente_nome}<br><a href="mailto:${req.docente_email}" style="color:${cor};font-size:13px">${req.docente_email}</a>${req.docente_tel ? `<span style="color:#8A847B;font-size:13px"> · ${req.docente_tel}</span>` : ""}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #F0ECE4;color:#8A847B">Período</td><td style="padding:10px 0;border-bottom:1px solid #F0ECE4">${fmtData(req.data_inicio as string)} — ${fmtData(req.data_fim as string)}</td></tr>
      <tr><td style="padding:10px 0;color:#8A847B">Localização</td><td style="padding:10px 0">${req.distrito ?? "—"}${req.concelho ? `, ${req.concelho}` : ""}</td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="${SITE_URL}/reservada" style="display:inline-block;background:${cor};color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:600;font-size:14px">
        Ver na Área Reservada →
      </a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background:#F4F0E8;padding:16px 40px;font-size:12px;color:#8A847B;text-align:center">
    Centro de Documentação 25 de Abril · Universidade de Coimbra
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

// ── Handler principal ─────────────────────────────────────────
Deno.serve(async (req) => {
  // O webhook do Supabase envia sempre POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.json();
    // O webhook envia { type: "INSERT", record: {...}, ... }
    const requisicao = payload.record ?? payload;

    if (!requisicao?.docente_email) {
      return new Response(JSON.stringify({ error: "Payload inválido" }), { status: 400 });
    }

    // Busca o membro da equipa responsável pelo local
    const { data: membros } = await supabase
      .from("perfis")
      .select("nome, cargo, email, telemovel")
      .eq("papel", requisicao.local)
      .limit(1);

    const membro = membros?.[0] ?? null;

    // Envia os dois e-mails em paralelo
    await Promise.all([
      enviarEmail(
        requisicao.docente_email,
        `Requisição confirmada — #${requisicao.id} — 25 de Abril em 3D`,
        emailDocente(requisicao, membro),
      ),
      membro
        ? enviarEmail(
            membro.email,
            `Nova requisição — #${requisicao.id} — ${requisicao.nome_escola}`,
            emailEquipa(requisicao),
          )
        : Promise.resolve(),
    ]);

    console.log(`E-mails enviados para ${requisicao.docente_email}${membro ? ` e ${membro.email}` : ""}`);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Erro ao enviar e-mails:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
