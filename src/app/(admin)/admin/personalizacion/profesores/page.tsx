import { supabase } from "@/lib/supabase/supabaseClient";
import { getCurrentClub } from "@/lib/ObetenerClubUtils/getCurrentClub";
import ProfesoresClient from "./ProfesoresClient";

export default async function ProfesoresPage() {
  // 1. Obtenemos el club básico (ID y Subdominio)
  const club = await getCurrentClub();

  if (!club) {
    return <div className="p-8 text-red-500">Error: Club no identificado.</div>;
  }

  // 2. BUSCAR CONFIGURACIÓN ESPECÍFICA + FOTO DE EQUIPO
  // Hacemos una consulta para traer el estado activo y hacemos JOIN con 'nosotros' para la foto
  const { data: config } = await supabase
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

  // 3. Obtenemos la lista de profesores
  const { data: profesores } = await supabase
    .from("profesores")
    .select("*")
    .eq("id_club", club.id_club)
    .order("created_at", { ascending: true });

  // 4. Extracción segura de la foto (Manejo de array/objeto de Supabase)
  // 'nosotros' puede venir como array o como objeto dependiendo de tu configuración de Supabase
  const nosotrosData = config?.nosotros as any;
  const teamPhoto = Array.isArray(nosotrosData)
    ? nosotrosData[0]?.equipo_imagen_url
    : nosotrosData?.equipo_imagen_url;

  return (
    <ProfesoresClient
      initialData={profesores || []}
      clubId={club.id_club}
      subdominio={club.subdominio}
      initialActivo={config?.activo_profesores ?? false}
      initialTeamPhoto={teamPhoto || null}
    />
  );
}
