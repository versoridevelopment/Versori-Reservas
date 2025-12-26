// src/app/api/admin/tarifarios/defaults/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export const runtime = "nodejs";

/**
 * GET /api/admin/tarifarios/defaults?id_club=1
 * Devuelve:
 * - tipos de cancha del club (en realidad los tipos existentes; el club decide defaults por tipo)
 * - defaults actuales (id_tipo_cancha -> id_tarifario)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idClubParam = searchParams.get("id_club");

    if (!idClubParam) {
      return NextResponse.json({ error: "id_club es requerido" }, { status: 400 });
    }

    const id_club = Number(idClubParam);
    if (Number.isNaN(id_club)) {
      return NextResponse.json({ error: "id_club debe ser numérico" }, { status: 400 });
    }

    // Tipos + deporte (para mostrar "padel_standard", "futbol_5", etc.)
    const { data: tipos, error: tiposError } = await supabaseAdmin
      .from("tipos_cancha")
      .select("id_tipo_cancha,nombre,capacidad_jugadores,superficie,deportes(id_deporte,nombre)")
      .order("id_tipo_cancha", { ascending: true });

    if (tiposError) {
      console.error("[GET /tarifarios/defaults] tiposError:", tiposError);
      return NextResponse.json({ error: "Error al obtener tipos de cancha" }, { status: 500 });
    }

    // Defaults ya seteados para el club
    const { data: defaults, error: defaultsError } = await supabaseAdmin
      .from("club_tarifarios_default")
      .select("id_tipo_cancha,id_tarifario")
      .eq("id_club", id_club);

    if (defaultsError) {
      console.error("[GET /tarifarios/defaults] defaultsError:", defaultsError);
      return NextResponse.json({ error: "Error al obtener defaults" }, { status: 500 });
    }

    return NextResponse.json({
      tipos: tipos ?? [],
      defaults: defaults ?? [],
    });
  } catch (err) {
    console.error("[GET /tarifarios/defaults] ex:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/tarifarios/defaults
 * Body:
 * {
 *   id_club: number,
 *   items: [{ id_tipo_cancha: number, id_tarifario: number | null }]
 * }
 *
 * - si id_tarifario = null => borra el default para ese tipo
 * - si id_tarifario != null => upsert
 */
export async function PUT(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const id_club = Number(body?.id_club);
    const items = (body?.items as any[]) ?? [];

    if (!id_club || Number.isNaN(id_club)) {
      return NextResponse.json({ error: "id_club (number) es requerido" }, { status: 400 });
    }

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "items debe ser un array" }, { status: 400 });
    }

    // Separar upserts y deletes
    const toUpsert = items
      .filter((x) => x?.id_tipo_cancha && x?.id_tarifario !== null && x?.id_tarifario !== undefined)
      .map((x) => ({
        id_club,
        id_tipo_cancha: Number(x.id_tipo_cancha),
        id_tarifario: Number(x.id_tarifario),
      }))
      .filter((x) => !Number.isNaN(x.id_tipo_cancha) && !Number.isNaN(x.id_tarifario));

    const toDelete = items
      .filter((x) => x?.id_tipo_cancha && (x?.id_tarifario === null || x?.id_tarifario === undefined))
      .map((x) => Number(x.id_tipo_cancha))
      .filter((n) => !Number.isNaN(n));

    // 1) deletes
    if (toDelete.length > 0) {
      const { error: delError } = await supabaseAdmin
        .from("club_tarifarios_default")
        .delete()
        .eq("id_club", id_club)
        .in("id_tipo_cancha", toDelete);

      if (delError) {
        console.error("[PUT /tarifarios/defaults] delError:", delError);
        return NextResponse.json({ error: "Error al borrar defaults" }, { status: 500 });
      }
    }

    // 2) upserts
    if (toUpsert.length > 0) {
      const { error: upsertError } = await supabaseAdmin
        .from("club_tarifarios_default")
        .upsert(toUpsert, { onConflict: "id_club,id_tipo_cancha" });

      if (upsertError) {
        console.error("[PUT /tarifarios/defaults] upsertError:", upsertError);
        return NextResponse.json({ error: "Error al guardar defaults" }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[PUT /tarifarios/defaults] ex:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
