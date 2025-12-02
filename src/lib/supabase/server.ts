// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Inicializa el cliente de Supabase en entorno de servidor (Next.js 15 compatible).
 */
export async function getSupabaseServerClient() {
  // ✅ cookies() ahora es ASYNC en Next 15
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set({ name, value, ...options });
            }
          } catch {
            // cookies() puede ser inmutable en SSR puro
          }
        },
      },
    }
  );

  return supabase;
}
