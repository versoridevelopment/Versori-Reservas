import { notFound } from "next/navigation";
import TurnosDisponiblesClient from "./TurnosDisponiblesClient";
import { getCurrentClub } from "@/lib/ObetenerClubUtils/getCurrentClub";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export const runtime = "nodejs";

type Cancha = { id_cancha: number; nombre: string };

type ClubThemeRow = {
  nombre: string;
  logo_url: string | null;
  color_primario: string | null;
  color_secundario: string | null;
};

type ContactoRow = {
  id_contacto: number;
};

type TelefonoRow = {
  numero: string | null;
  tipo: string | null;
};

function pickTelefono(tels: TelefonoRow[]) {
  const clean = (s: any) => String(s ?? "").trim();
  const normalized = tels
    .map((t) => ({
      numero: clean(t.numero),
      tipo: clean(t.tipo).toLowerCase(),
    }))
    .filter((t) => t.numero.length > 0);

  if (normalized.length === 0) return "";

  // Preferencias
  const prefer = ["whatsapp", "wsp", "celular", "móvil", "movil", "mobile", "principal"];
  for (const p of prefer) {
    const found = normalized.find((t) => t.tipo.includes(p));
    if (found) return found.numero;
  }
  return normalized[0].numero;
}

export default async function Page() {
  const club = await getCurrentClub();
  if (!club) return notFound();

  // 1) Theme del club (logo + colores)
  const { data: clubRow, error: clubErr } = await supabaseAdmin
    .from("clubes")
    .select("nombre,logo_url,color_primario,color_secundario")
    .eq("id_club", club.id_club)
    .maybeSingle<ClubThemeRow>();

  if (clubErr || !clubRow) {
    console.error("[turnos-disponibles/page] club theme error:", clubErr?.message);
    return notFound();
  }

  // 2) Canchas
  const { data: canchas, error: cErr } = await supabaseAdmin
    .from("canchas")
    .select("id_cancha,nombre")
    .eq("id_club", club.id_club)
    .eq("activa", true)
    .eq("estado", true)
    .order("nombre");

  if (cErr) {
    console.error("[turnos-disponibles/page] error canchas:", cErr.message);
    return notFound();
  }

  // 3) Teléfono (contacto -> telefono)
  let phone = "";

  // 3.1 buscar contacto del club
  const { data: contacto, error: conErr } = await supabaseAdmin
    .from("contacto")
    .select("id_contacto")
    .eq("id_club", club.id_club)
    .maybeSingle<ContactoRow>();

  if (conErr) {
    console.warn("[turnos-disponibles/page] contacto error:", conErr.message);
  }

  // 3.2 si hay contacto, buscar teléfonos
  if (contacto?.id_contacto) {
    const { data: tels, error: tErr } = await supabaseAdmin
      .from("telefono")
      .select("numero,tipo")
      .eq("id_contacto", contacto.id_contacto)
      .order("id_telefono", { ascending: true })
      .returns<TelefonoRow[]>();

    if (tErr) {
      console.warn("[turnos-disponibles/page] telefono error:", tErr.message);
    } else {
      phone = pickTelefono(tels || []);
    }
  }

  return (
    <TurnosDisponiblesClient
      idClub={club.id_club}
      clubNombre={clubRow.nombre}
      clubTheme={{
        logoUrl: clubRow.logo_url,
        primary: clubRow.color_primario,
        secondary: clubRow.color_secundario,
      }}
      phone={phone}
      canchas={(canchas ?? []) as Cancha[]}
    />
  );
}
