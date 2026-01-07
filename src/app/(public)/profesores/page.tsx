import { getCurrentClub } from "@/lib/ObetenerClubUtils/getCurrentClub";
import { supabase } from "@/lib/supabase/supabaseClient";
import ProfesoresUI from "@/app/(public)/components/profesores/ProfesoresUI";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function ProfesoresPage() {
  // 1. Detectar club
  const club = await getCurrentClub();

  if (!club) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Club no encontrado
      </div>
    );
  }

  // 2. VERIFICACIÓN Y OBTENCIÓN DE FOTO DE EQUIPO
  // MODIFICADO: Ahora pedimos también 'nosotros (equipo_imagen_url)'
  const { data: clubConfig } = await supabase
    .from("clubes")
    .select(
      `
      activo_profesores,
      nosotros (
        equipo_imagen_url
      )
    `
    )
    .eq("id_club", club.id_club)
    .single();

  // Si la configuración existe y el campo es false, redirigimos
  if (clubConfig && clubConfig.activo_profesores === false) {
    redirect("/");
  }

  // 3. Buscar profesores en la DB
  const { data: profesores } = await supabase
    .from("profesores")
    .select("*")
    .eq("id_club", club.id_club)
    .eq("activo", true) // <-- FIX: Mostrar solo profesores activos
    .order("created_at", { ascending: true });

  // 4. EXTRAER LA FOTO (NUEVO)
  // Verificamos si 'nosotros' viene como array o objeto y extraemos la URL
  // 'any' se usa aquí temporalmente por si Typescript no infiere la relación anidada automáticamente
  const nosotrosData = clubConfig?.nosotros as any;

  const teamPhotoUrl =
    (Array.isArray(nosotrosData)
      ? nosotrosData[0]?.equipo_imagen_url
      : nosotrosData?.equipo_imagen_url) || null;

  // 5. Renderizar UI pasando la nueva prop teamPhotoUrl
  return (
    <ProfesoresUI profesores={profesores || []} teamPhotoUrl={teamPhotoUrl} />
  );
}
