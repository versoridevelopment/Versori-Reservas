// lib/supabaseClient.ts
import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      // ✅ para que confirmación de email funcione en otro navegador/teléfono
      flowType: "implicit",

      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
