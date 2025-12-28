import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Inicializamos Supabase para que gestione las cookies de sesión automáticamente
  const supabase = createMiddlewareClient({ req, res });

  // Refrescamos la sesión (esto escribe la cookie si es necesario)
  await supabase.auth.getSession();

  // --- TU LÓGICA DE BLOQUEO ---
  const recoveryCookie = req.cookies.get("recovery_pending")?.value;

  if (recoveryCookie === "true") {
    if (!req.nextUrl.pathname.startsWith("/reset-password")) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/reset-password";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|auth|videos|sponsors|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)",
  ],
};
