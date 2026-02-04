// src/lib/getClubBySubdomain.ts
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export type Club = {
  id_club: number;
  nombre: string;
  subdominio: string;
  logo_url: string;
  color_primario: string;
  color_secundario: string;
  imagen_hero_url: string;
  color_texto: string;
  texto_bienvenida_titulo: string;
  texto_bienvenida_subtitulo: string;
};

/**
 * Busca un club por subdominio en la tabla "clubes".
 * Devuelve null si no existe o hay error.
 */
export async function getClubBySubdomain(
  subdomain: string
): Promise<Club | null> {
  const { data, error } = await supabaseAdmin
    .from("clubes")
    .select(
      `
      id_club,
      nombre,
      subdominio,
      logo_url,
      color_primario,
      color_secundario,
      imagen_hero_url,
      color_texto,
      texto_bienvenida_titulo,
      texto_bienvenida_subtitulo
      `
    )
    .eq("subdominio", subdomain)
    .maybeSingle();

  if (error) {
    console.error("[getClubBySubdomain] error supabase:", error.message);
    return null;
  }

  return data ?? null;
}
