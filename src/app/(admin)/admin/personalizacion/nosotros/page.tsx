import { supabase } from "@/lib/supabase/supabaseClient";
import { getCurrentClub } from "@/lib/ObetenerClubUtils/getCurrentClub";
import SobreNosotrosForm from "./SobreNosotrosForm";

export default async function SobreNosotrosPage() {
  const club = await getCurrentClub();

  if (!club) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-red-500 font-semibold bg-red-50 m-4 rounded-xl">
        Error: No se ha detectado el club.
      </div>
    );
  }

  // Traemos los datos de la DB
  const { data: nosotrosData } = await supabase
    .from("nosotros")
    .select(
      "hero_descripcion, historia_titulo, historia_contenido, historia_imagen_url, valores, frase_cierre"
    )
    .eq("id_club", club.id_club)
    .single();

  return (
    <SobreNosotrosForm
      initialData={nosotrosData}
      clubId={club.id_club}
      subdominio={club.subdominio}
    />
  );
}
