import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import UserProfileForm from "../components/perfil/UserProfileForm";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const cookieStore = await cookies();

  // 1. INTENTO ESTÁNDAR
  // Usamos 'let' porque podríamos necesitar sobrescribirlo abajo
  let supabase = createServerComponentClient({
    cookies: () =>
      ({
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {},
        remove(name: string, options: any) {},
        getAll() {
          return cookieStore
            .getAll()
            .map((c) => ({ name: c.name, value: c.value }));
        },
      } as any),
  });

  let {
    data: { session },
  } = await supabase.auth.getSession();

  // 2. FALLBACK MANUAL (PLAN B - RECUPERACIÓN DE COOKIE BASE64)
  if (!session) {
    console.log(
      "⚠️ [Perfil] Falló lectura estándar. Intentando recuperación manual de cookies..."
    );

    try {
      const allCookies = cookieStore.getAll();
      const tokenCookies = allCookies.filter((c) =>
        c.name.includes("-auth-token")
      );

      if (tokenCookies.length > 0) {
        // a. Ordenar fragmentos
        tokenCookies.sort((a, b) => {
          const aIndex = parseInt(a.name.split(".").pop() || "0");
          const bIndex = parseInt(b.name.split(".").pop() || "0");
          return aIndex - bIndex;
        });

        let combinedValue = tokenCookies.map((c) => c.value).join("");

        // b. Decodificar Base64 si es necesario (Formato nuevo de Supabase)
        if (combinedValue.startsWith("base64-")) {
          const base64Str = combinedValue.replace("base64-", "");
          const jsonStr = Buffer.from(base64Str, "base64").toString("utf-8");
          combinedValue = jsonStr;
        }

        // c. Parsear JSON
        const sessionData = JSON.parse(combinedValue);

        if (sessionData.access_token) {
          // d. Crear cliente limpio
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
          const manualClient = createClient(supabaseUrl, supabaseKey);

          // e. Forzar sesión
          const { data: manualSession } = await manualClient.auth.setSession({
            access_token: sessionData.access_token,
            refresh_token: sessionData.refresh_token,
          });

          if (manualSession.session) {
            console.log("✅ [Perfil] ¡Sesión recuperada manualmente!");
            session = manualSession.session;

            // CORRECCIÓN: Eliminamos @ts-expect-error y usamos 'as any'
            // Esto evita el error de linter "Unused directive" y el de "Missing description"
            supabase = manualClient as any;
          }
        }
      }
    } catch (err) {
      console.error("❌ [Perfil] Error fatal en recuperación manual:", err);
    }
  }

  // 3. VALIDACIÓN FINAL
  if (!session) {
    console.log("⛔ [Perfil] Imposible recuperar sesión. Redirigiendo.");
    redirect("/login");
  }

  // 4. Obtener datos
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id_usuario", session.user.id)
    .single();

  return (
    <div className="min-h-screen bg-[#0b0d12] pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Mi Perfil</h1>
          <p className="text-gray-400">Bienvenido/a.</p>
        </div>

        <UserProfileForm
          initialData={profile}
          email={session.user.email || ""}
          userId={session.user.id}
        />
      </div>
    </div>
  );
}
