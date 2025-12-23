import { createClient } from "@supabase/supabase-js";

// NOTA: Estas variables deben estar en tu .env.local
// NEXT_PUBLIC_SUPABASE_URL=...
// SUPABASE_SERVICE_ROLE_KEY=... (Esta NO debe llevar NEXT_PUBLIC)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Faltan las variables de entorno de Supabase Admin");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
