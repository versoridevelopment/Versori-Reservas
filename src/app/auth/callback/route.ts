import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";

function baseDomainFromHost(host: string) {
  // ejemplo simple: ferpadel.versorisports.com -> versorisports.com
  // si usás www, dev, etc. ajustalo según tu caso
  const parts = host.split(".");
  if (parts.length >= 2) return parts.slice(-2).join(".");
  return host;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  const tenant = url.searchParams.get("tenant"); // subdominio (ferpadel)

  if (!code) {
    return NextResponse.redirect(`${url.origin}/auth/auth-code-error`);
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
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${url.origin}/auth/auth-code-error`);
  }

  // ✅ reconstruimos el destino
  const currentHost = url.host; // incluye puerto si hubiera
  const baseDomain = baseDomainFromHost(currentHost);

  const targetOrigin = tenant
    ? `https://${tenant}.${baseDomain}`
    : url.origin; // fallback

  return NextResponse.redirect(`${targetOrigin}${next}`);
}
