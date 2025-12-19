import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export const runtime = "nodejs";

/**
 * PUT /api/admin/tarifarios/defaults
 * Body:
 *  { id_club, id_tipo_cancha, id_tarifario } -> upsert
 *  { id_club, id_tipo_cancha, id_tarifario: null } -> delete default (volver a "sin default")
 */
export async function PUT(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const id_club = Number(body?.id_club);
    const id_tipo_cancha = Number(body?.id_tipo_cancha);
    const id_tarifario_raw = body?.id_tarifario;

    if (!id_club || Number.isNaN(id_club)) return NextResponse.json({ error: "id_club inválido" }, { status: 400 });
    if (!id_tipo_cancha || Number.isNaN(id_tipo_cancha)) return NextResponse.json({ error: "id_tipo_cancha inválido" }, { status: 400 });

    // null => borrar default
    if (id_tarifario_raw === null) {
      const { error } = await supabaseAdmin
        .from("club_tarifarios_default")
        .delete()
        .eq("id_club", id_club)
        .eq("id_tipo_cancha", id_tipo_cancha);

      if (error) {
        console.error("[PUT /tarifarios/defaults] delete error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, removed: true });
    }

    const id_tarifario = Number(id_tarifario_raw);
    if (!id_tarifario || Number.isNaN(id_tarifario)) {
      return NextResponse.json({ error: "id_tarifario inválido" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("club_tarifarios_default")
      .upsert(
        [{ id_club, id_tipo_cancha, id_tarifario }],
        { onConflict: "id_club,id_tipo_cancha" }
      )
      .select()
      .single();

    if (error) {
      console.error("[PUT /tarifarios/defaults] upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, row: data });
  } catch (err: any) {
    console.error("[PUT /tarifarios/defaults] ex:", err);
    return NextResponse.json({ error: err?.message || "Error interno" }, { status: 500 });
  }
}
