import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export const runtime = "nodejs";

// Helper: traer id_tarifario del club (el "activo")
async function getTarifarioActivoByClub(id_club: number) {
  const { data, error } = await supabaseAdmin
    .from("canchas_tarifarios")
    .select("id_tarifario")
    .eq("id_club", id_club)
    .eq("activo", true)
    .order("id_tarifario", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.id_tarifario ?? null;
}

/**
 * GET /api/admin/tarifas?id_club=1
 * Lista reglas del tarifario activo del club
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idClubParam = searchParams.get("id_club");
    if (!idClubParam) return NextResponse.json({ error: "id_club es requerido" }, { status: 400 });

    const id_club = Number(idClubParam);
    if (Number.isNaN(id_club)) return NextResponse.json({ error: "id_club debe ser numérico" }, { status: 400 });

    const id_tarifario = await getTarifarioActivoByClub(id_club);
    if (!id_tarifario) return NextResponse.json({ error: "El club no tiene tarifario activo" }, { status: 404 });

    const { data, error } = await supabaseAdmin
      .from("canchas_tarifas_reglas")
      .select("*")
      .eq("id_tarifario", id_tarifario)
      .order("segmento", { ascending: true })
      .order("prioridad", { ascending: false })
      .order("dow", { ascending: true })
      .order("hora_desde", { ascending: true })
      .order("duracion_min", { ascending: true });

    if (error) {
      console.error("[ADMIN GET /tarifas] error:", error);
      return NextResponse.json({ error: "Error al obtener tarifas" }, { status: 500 });
    }

    return NextResponse.json({ id_tarifario, reglas: data ?? [] });
  } catch (err: any) {
    console.error("[ADMIN GET /tarifas] ex:", err);
    return NextResponse.json({ error: err?.message || "Error interno" }, { status: 500 });
  }
}

/**
 * POST /api/admin/tarifas
 * Crea una regla en el tarifario activo del club.
 * Body: { id_club, segmento, dow, hora_desde, hora_hasta, cruza_medianoche, duracion_min, precio, prioridad, activo }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const id_club = Number(body?.id_club);

    if (!id_club || Number.isNaN(id_club)) {
      return NextResponse.json({ error: "id_club es requerido y numérico" }, { status: 400 });
    }

    const id_tarifario = await getTarifarioActivoByClub(id_club);
    if (!id_tarifario) return NextResponse.json({ error: "El club no tiene tarifario activo" }, { status: 404 });

    const payload = {
      id_tarifario,
      segmento: body?.segmento ?? "publico",
      dow: body?.dow ?? null,
      hora_desde: body?.hora_desde,
      hora_hasta: body?.hora_hasta,
      cruza_medianoche: body?.cruza_medianoche ?? false,
      duracion_min: body?.duracion_min,
      precio: body?.precio,
      prioridad: body?.prioridad ?? 0,
      activo: body?.activo ?? true,
      vigente_desde: body?.vigente_desde ?? new Date().toISOString().slice(0, 10),
      vigente_hasta: body?.vigente_hasta ?? null,
    };

    // Validación mínima
    if (!payload.hora_desde || !payload.hora_hasta || !payload.duracion_min || payload.precio == null) {
      return NextResponse.json(
        { error: "hora_desde, hora_hasta, duracion_min y precio son obligatorios" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("canchas_tarifas_reglas")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("[ADMIN POST /tarifas] error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error("[ADMIN POST /tarifas] ex:", err);
    return NextResponse.json({ error: err?.message || "Error interno" }, { status: 500 });
  }
}
