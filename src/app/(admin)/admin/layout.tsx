import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import "../../globals.css";
import { Sidebar } from "./components/Sidebar";

// --- 1. METADATA DINÁMICA (Opcional, pero recomendado) ---
export async function generateMetadata() {
  const { club } = await getClubContext();
  return {
    title: club ? ` ${club.nombre} - Administrador` : "Panel de Administración",
    icons: {
      icon: club?.logo_url || "/favicon.ico",
    },
  };
}

// --- HELPER: Lógica para obtener el club actual ---
async function getClubContext() {
  const cookieStore = await cookies();
  const headersList = await headers();
  const host = headersList.get("host") || "";

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
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {}
        },
      },
    },
  );

  // A. Verificar Sesión
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, club: null, hasAccess: false };

  // B. Detectar Club (Subdominio > Fallback)
  let currentClub = null;
  const subdomain = host.split(".")[0];
  const isLocalhostRoot =
    subdomain === "localhost" || host.includes("127.0.0.1");

  // Intento 1: Por Subdominio
  if (!isLocalhostRoot && subdomain !== "www") {
    const { data: clubData } = await supabase
      .from("clubes")
      .select("id_club, nombre, logo_url")
      .eq("subdominio", subdomain)
      .single();

    if (clubData) currentClub = clubData;
  }

  // Intento 2: Fallback (Primer club del usuario)
  if (!currentClub) {
    const { data: defaultClub } = await supabase
      .from("club_usuarios")
      .select("clubes(id_club, nombre, logo_url)")
      .eq("id_usuario", user.id)
      .limit(1)
      .maybeSingle();

    if (defaultClub?.clubes) {
      // Forzamos el tipo porque Supabase a veces devuelve array en joins
      currentClub = Array.isArray(defaultClub.clubes)
        ? defaultClub.clubes[0]
        : defaultClub.clubes;
    }
  }

  // C. Verificar Roles
  const { data: rolesData } = await supabase
    .from("club_usuarios")
    .select("roles!inner(nombre)")
    .eq("id_usuario", user.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasAccess = rolesData?.some((r: any) =>
    ["admin", "cajero", "staff"].includes(r.roles?.nombre),
  );

  return { user, club: currentClub, hasAccess };
}

// --- LAYOUT PRINCIPAL ---
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Obtenemos los datos del contexto antes de renderizar
  const { user, club, hasAccess } = await getClubContext();

  if (!user) redirect("/login");
  if (!hasAccess) redirect("/");

  return (
    <html lang="es">
      <body className="bg-slate-50">
        <div className="flex h-screen text-gray-900 overflow-hidden">
          {/* ✅ AQUÍ PASAMOS LOS DATOS DINÁMICOS AL SIDEBAR */}
          <Sidebar
            clubName={club?.nombre || "Mi Club"}
            clubLogo={club?.logo_url}
          />

          <main className="flex-1 overflow-y-auto bg-slate-50 relative">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
