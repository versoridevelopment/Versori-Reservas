import { notFound } from "next/navigation";
import { getCurrentClub } from "@/lib/ObetenerClubUtils/getCurrentClub";
import { supabase } from "@/lib/supabase/supabaseClient";
import NosotrosClient from "@/app/(admin)/admin/components/NosotrosClient";

export const revalidate = 0;

export default async function NosotrosPage() {
  const club = await getCurrentClub();

  if (!club) {
    return (
      <div className="min-h-screen bg-[#0b0d12] flex items-center justify-center text-white">
        Cargando...
      </div>
    );
  }

  // Traemos TODOS los campos de la tabla nosotros
  const { data: config } = await supabase
    .from("nosotros")
    .select("*")
    .eq("id_club", club.id_club)
    .maybeSingle();

  // Si está desactivada o no existe, 404
  if (!config || !config.activo_nosotros) {
    return notFound();
  }

  return <NosotrosClient config={config} />;
}
