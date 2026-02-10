import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import "../../globals.css";

// ✅ TOP LOADER
import NextTopLoader from "nextjs-toploader";

// Asegúrate de que la ruta apunte correctamente a tu Sidebar.
// Si Sidebar está en src/app/(admin)/components/Sidebar.tsx:
import { Sidebar } from "./components/Sidebar";

// ✅ Definimos la interfaz exacta que esperamos de la base de datos
interface ClubData {
  id_club: number;
  nombre: string;
  logo_url: string | null;
}

// --- HELPER: Lógica centralizada para obtener el contexto del club ---
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

  // 1. Autenticación
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si no hay usuario, retornamos estado vacío
  if (!user) return { user: null, club: null, hasAccess: false };

  // 2. Detección de Club
  let currentClub: ClubData | null = null;

  // Limpieza del host para obtener subdominio
  const hostname = host.split(":")[0];
  const parts = hostname.split(".");
  const subdomain =
    parts.length > 1 && parts[0] !== "www" && parts[0] !== "localhost"
      ? parts[0]
      : null;

  // A. Estrategia Subdominio (Producción / Subdominio Local)
  if (subdomain) {
    const { data: clubData } = await supabase
      .from("clubes")
      .select("id_club, nombre, logo_url")
      .eq("subdominio", subdomain)
      .single();

    if (clubData) {
      currentClub = clubData as ClubData;
    }
  }

  // B. Estrategia Fallback (Primer club del usuario si falla lo anterior)
  if (!currentClub) {
    const { data: defaultClub } = await supabase
      .from("club_usuarios")
      .select("clubes(id_club, nombre, logo_url)")
      .eq("id_usuario", user.id)
      .limit(1)
      .maybeSingle();

    if (defaultClub?.clubes) {
      currentClub = Array.isArray(defaultClub.clubes)
        ? (defaultClub.clubes[0] as ClubData)
        : (defaultClub.clubes as unknown as ClubData);
    }
  }

  // 3. Verificación de Roles (Seguridad)
  const { data: rolesData } = await supabase
    .from("club_usuarios")
    .select("roles!inner(nombre)")
    .eq("id_usuario", user.id);

  const hasAccess = rolesData?.some((r: any) =>
    ["admin", "cajero", "staff", "profe"].includes(r.roles?.nombre),
  );

  return { user, club: currentClub, hasAccess };
}

// --- METADATA DINÁMICA ---
export async function generateMetadata() {
  const { club } = await getClubContext();

  return {
    title: club ? `${club.nombre} - Admin` : "Panel Admin | Versori",
    icons: {
      icon: club?.logo_url || "/favicon.ico",
    },
  };
}

// --- LAYOUT PRINCIPAL ---
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, club, hasAccess } = await getClubContext();

  if (!user) {
    redirect("/login");
  }

  if (!hasAccess) {
    redirect("/");
  }

  return (
    <html lang="es">
      <body className="bg-slate-50 antialiased">
        {/* ✅ Barra de carga superior */}
        <NextTopLoader
          color={"#3b82f6"}
          height={3}
          showSpinner={false}
          easing="ease"
          speed={200}
          zIndex={99999}
        />

        <div className="flex h-screen text-gray-900 overflow-hidden">
          <Sidebar
            clubName={club?.nombre || "Mi Club"}
            clubLogo={club?.logo_url}
          />

          <main className="flex-1 overflow-y-auto bg-slate-50 relative focus:outline-none">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
