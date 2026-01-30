// src/app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getBaseDomain(hostname: string) {
  // ej:
  // - ferpadel.versorisports.com -> versorisports.com
  // - localhost -> localhost
  const parts = hostname.split(".");
  if (hostname === "localhost") return "localhost";
  if (parts.length <= 2) return hostname;
  return parts.slice(-2).join(".");
}

function buildTargetOrigin(url: URL, sub: string | null) {
  const protocol = url.protocol; // https:
  const hostname = url.hostname; // ferpadel.versorisports.com | versorisports.com | localhost

  if (!sub) return url.origin;

  // Local: sub.localhost:3000
  if (hostname === "localhost") {
    const port = url.port ? `:${url.port}` : "";
    return `${protocol}//${sub}.localhost${port}`;
  }

  // Prod: sub + baseDomain
  const baseDomain = getBaseDomain(hostname);
  return `${protocol}//${sub}.${baseDomain}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  const sub = url.searchParams.get("sub"); // ✅ para multi-tenant (opcional)

  // ✅ origin “destino” (subdominio si viene sub)
  const targetOrigin = buildTargetOrigin(url, sub);

  // ✅ Si NO viene code (implicit flow con hash), server no ve el hash
  // entonces mandamos a auth-code-error en el mismo targetOrigin.
  if (!code) {
    return NextResponse.redirect(
      `${targetOrigin}/auth/auth-code-error?next=${encodeURIComponent(next)}`
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
    return NextResponse.redirect(
      `${targetOrigin}/auth/auth-code-error?next=${encodeURIComponent(next)}`
    );
  }

  // ✅ OK: sesión seteada en cookies -> redirect final
  return NextResponse.redirect(`${targetOrigin}${next}`);
}
