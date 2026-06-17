import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Aviso claro na consola se as variáveis de ambiente faltarem, em vez de
// rebentar no arranque e deixar a página em branco.
if (!url || !key) {
  console.error(
    "[Supabase] Variáveis de ambiente em falta: " +
      "VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY. " +
      "A base de dados não vai funcionar até estas serem configuradas."
  );
}

// Valores de reserva (placeholder) garantem que createClient não lança
// erro à carga do módulo; as chamadas à base de dados falham de forma
// controlada, mas o site continua a renderizar.
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  key || "placeholder-key"
);

export const supabaseConfigurado = Boolean(url && key);
