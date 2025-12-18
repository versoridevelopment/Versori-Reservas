import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export const runtime = "nodejs";

/**
 * GET /api/admin/tarifarios?id_club=1
 * Devuelve:
 * - tarifarios del club
 * - tipos de cancha (con deporte)
 * - defaults (club + tipo_cancha -> tarifario)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idClubParam = searchParams.get("id_club");
    if (!idClubParam) return NextResponse.json({ error: "id_club es requerido" }, { status: 400 });

    const id_club = Number(idClubParam);
    if (Number.isNaN(id_club)) return NextResponse.json({ error: "id_club debe ser numérico" }, { status: 400 });

    // 1) Tarifarios del club
    const { data: tarifarios, error: e1 } = await supabaseAdmin
      .from("canchas_tarifarios")
      .select("*")
      .eq("id_club", id_club)
      .order("activo", { ascending: false })
      .order("nombre", { ascending: true });

    if (e1) {
      console.error("[GET /tarifarios] tarifarios error:", e1);
      return NextResponse.json({ error: e1.message }, { status: 500 });
    }

    // 2) Tipos de cancha (global) + deporte
    const { data: tipos, error: e2 } = await supabaseAdmin
      .from("tipos_cancha")
      .select("id_tipo_cancha, nombre, id_deporte, deportes ( nombre )")
      .order("id_deporte", { ascending: true })
      .order("nombre", { ascending: true });

    if (e2) {
      console.error("[GET /tarifarios] tipos error:", e2);
      return NextResponse.json({ error: e2.message }, { status: 500 });
    }

    // 3) Defaults por tipo para el club
    const { data: defaults, error: e3 } = await supabaseAdmin
      .from("club_tarifarios_default")
      .select("*")
      .eq("id_club", id_club);

    if (e3) {
      console.error("[GET /tarifarios] defaults error:", e3);
      return NextResponse.json({ error: e3.message }, { status: 500 });
    }

    return NextResponse.json({ tarifarios: tarifarios ?? [], tipos: tipos ?? [], defaults: defaults ?? [] });
  } catch (err: any) {
    console.error("[GET /tarifarios] ex:", err);
    return NextResponse.json({ error: err?.message || "Error interno" }, { status: 500 });
  }
}

/**
 * POST /api/admin/tarifarios
 * Body: { id_club, nombre, descripcion? }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const id_club = Number(body?.id_club);
    const nombre = (body?.nombre ?? "").trim();
    const descripcion = body?.descripcion ?? null;

    if (!id_club || Number.isNaN(id_club)) {
      return NextResponse.json({ error: "id_club es requerido y numérico" }, { status: 400 });
    }
    if (!nombre) {
      return NextResponse.json({ error: "nombre es requerido" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("canchas_tarifarios")
      .insert([{ id_club, nombre, descripcion, activo: true }])
      .select()
      .single();

    if (error) {
      console.error("[POST /tarifarios] error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error("[POST /tarifarios] ex:", err);
    return NextResponse.json({ error: err?.message || "Error interno" }, { status: 500 });
  }
}
