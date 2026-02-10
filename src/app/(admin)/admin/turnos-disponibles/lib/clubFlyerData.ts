import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { pickTelefono } from "./phone";

type ClubThemeRow = {
  nombre: string;
  logo_url: string | null;
  color_primario: string | null;
  color_secundario: string | null;
};

type ContactoRow = { id_contacto: number };
type TelefonoRow = { numero: string | null; tipo: string | null };

export async function getClubFlyerData(id_club: number) {
  const { data: clubRow, error: clubErr } = await supabaseAdmin
    .from("clubes")
    .select("nombre,logo_url,color_primario,color_secundario")
    .eq("id_club", id_club)
    .maybeSingle<ClubThemeRow>();

  if (clubErr || !clubRow) {
    throw new Error(clubErr?.message || "No se pudo leer club");
  }

  const { data: canchas, error: cErr } = await supabaseAdmin
    .from("canchas")
    .select("id_cancha,nombre")
    .eq("id_club", id_club)
    .eq("activa", true)
    .eq("estado", true)
    .order("nombre");

  if (cErr) throw new Error(cErr.message);

  let phone = "";

  const { data: contacto, error: conErr } = await supabaseAdmin
    .from("contacto")
    .select("id_contacto")
    .eq("id_club", id_club)
    .maybeSingle<ContactoRow>();

  if (conErr) {
    // No tiramos abajo la página por teléfono
    console.warn("[getClubFlyerData] contacto:", conErr.message);
  }

  if (contacto?.id_contacto) {
    const { data: tels, error: tErr } = await supabaseAdmin
      .from("telefono")
      .select("numero,tipo")
      .eq("id_contacto", contacto.id_contacto)
      .order("id_telefono", { ascending: true })
      .returns<TelefonoRow[]>();

    if (tErr) console.warn("[getClubFlyerData] telefono:", tErr.message);
    else phone = pickTelefono(tels || []);
  }

  return {
    clubNombre: clubRow.nombre,
    clubTheme: {
      logoUrl: clubRow.logo_url,
      primary: clubRow.color_primario,
      secondary: clubRow.color_secundario,
    },
    phone,
    canchas: (canchas ?? []) as { id_cancha: number; nombre: string }[],
  };
}
