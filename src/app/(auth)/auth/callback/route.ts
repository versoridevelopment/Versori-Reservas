// src/app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  // ✅ Si NO viene code, pasamos a CLIENT (/auth/confirm) para leer hash (#access_token)
  if (!code) {
    return NextResponse.redirect(
      `${url.origin}/auth/confirm?next=${encodeURIComponent(next)}`
    );
  }

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
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession error:", error.message);
    // si falla el exchange, intentamos client fallback igual
    return NextResponse.redirect(
      `${url.origin}/auth/confirm?next=${encodeURIComponent(next)}`
    );
  }

  // ✅ cookies SSR listas => tu middleware ve user
  return NextResponse.redirect(`${url.origin}${next}`);
}
