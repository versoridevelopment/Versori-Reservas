import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isSuperadminPath(pathname: string) {
  return pathname === "/superadmin" || pathname.startsWith("/superadmin/");
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = req.nextUrl;

  // ✅ Confirmación: requiere login
  if (url.pathname.startsWith("/reserva/confirmacion")) {
    if (!user) {
      const redirectUrl = url.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", url.pathname + url.search);
      return NextResponse.redirect(redirectUrl);
    }
  }

  const needsAdmin = isAdminPath(url.pathname);
  const needsSuperadmin = isSuperadminPath(url.pathname);

  // --- PROTECCIÓN ADMIN / SUPERADMIN ---
  if (needsAdmin || needsSuperadmin) {
    // 1) Si no hay usuario -> login
    if (!user) {
      const redirectUrl = url.clone();
      redirectUrl.pathname = "/login";
      return NextResponse.redirect(redirectUrl);
    }

    // 2) Consultar roles
    const { data: rolesData, error } = await supabase
      .from("club_usuarios")
      .select("roles!inner(nombre)")
      .eq("id_usuario", user.id);

    if (error) {
      const redirectUrl = url.clone();
      redirectUrl.pathname = "/";
      return NextResponse.redirect(redirectUrl);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRoles =
      rolesData?.map((r: any) => String(r.roles?.nombre || "").toLowerCase()) ||
      [];

    // 3) Whitelists separadas
    const allowedAdminRoles = ["admin", "cajero", "staff"];
    const allowedSuperadminRoles = ["superadmin"];

    const hasAdminAccess = userRoles.some((r) => allowedAdminRoles.includes(r));
    const hasSuperadminAccess = userRoles.some((r) =>
      allowedSuperadminRoles.includes(r),
    );

    // 4) Validación según ruta
    if (needsSuperadmin) {
      if (!hasSuperadminAccess) {
        console.log(
          `⛔ Acceso SUPERADMIN denegado a ${user.email}. Roles: ${userRoles.join(
            ",",
          )}`,
        );
        const redirectUrl = url.clone();
        redirectUrl.pathname = "/";
        return NextResponse.redirect(redirectUrl);
      }
    } else if (needsAdmin) {
      // Nota: superadmin NO entra a /admin a menos que lo agregues acá
      if (!hasAdminAccess) {
        console.log(
          `⛔ Acceso ADMIN denegado a ${user.email}. Roles: ${userRoles.join(
            ",",
          )}`,
        );
        const redirectUrl = url.clone();
        redirectUrl.pathname = "/";
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  // --- Recovery (sin cambios) ---
  const recoveryCookie = req.cookies.get("recovery_pending")?.value;
  if (recoveryCookie === "true" && !url.pathname.startsWith("/reset-password")) {
    const redirectUrl = url.clone();
    redirectUrl.pathname = "/reset-password";
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|auth|api|videos|sponsors|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)",
  ],
};
