import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import "../../globals.css";
import { Sidebar } from "./components/Sidebar"; // Ajusta la ruta si es necesario

export const metadata = {
  title: "Panel Admin | Versori",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {}
        },
      },
    },
  );

  // 1. Verificar Sesión
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Verificar Roles
  const { data: rolesData } = await supabase
    .from("club_usuarios")
    .select("roles!inner(nombre)")
    .eq("id_usuario", user.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasAccess = rolesData?.some((r: any) =>
    ["admin", "cajero", "staff"].includes(r.roles?.nombre),
  );

  if (!hasAccess) {
    redirect("/");
  }

  return (
    <html lang="es">
      {/* Forzamos bg-slate-50 en el body para evitar el fondo negro global */}
      <body className="bg-slate-50">
        <div className="flex h-screen text-gray-900 overflow-hidden">
          <Sidebar />

          {/* CAMBIO CLAVE AQUÍ: 
             1. Eliminé 'p-6' (esto causaba el recuadro negro).
             2. Agregué 'bg-slate-50' para asegurar continuidad de color.
             3. 'flex-1' y 'overflow-y-auto' permiten que solo el contenido haga scroll.
          */}
          <main className="flex-1 overflow-y-auto bg-slate-50 relative">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
