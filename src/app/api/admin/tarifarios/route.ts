// src/app/api/admin/tarifarios/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export const runtime = "nodejs";

/**
 * GET /api/admin/tarifarios?id_club=1
 * Lista tarifarios del club (activos e inactivos)
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

    const { data, error } = await supabaseAdmin
      .from("canchas_tarifarios")
      .select("id_tarifario,id_club,nombre,descripcion,activo,created_at")
      .eq("id_club", id_club)
      .order("id_tarifario", { ascending: true });

    if (error) {
      console.error("[ADMIN GET /tarifarios] error:", error);
      return NextResponse.json({ error: "Error al obtener tarifarios" }, { status: 500 });
    }

    return NextResponse.json({ tarifarios: data ?? [] });
  } catch (err) {
    console.error("[ADMIN GET /tarifarios] ex:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

/**
 * POST /api/admin/tarifarios
 * Body JSON: { id_club, nombre, descripcion?, activo? }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const id_club = Number(body?.id_club);
    const nombre = (body?.nombre as string | undefined)?.trim();
    const descripcion = (body?.descripcion as string | undefined) ?? null;
    const activo = body?.activo ?? true;

    if (!id_club || Number.isNaN(id_club) || !nombre) {
      return NextResponse.json(
        { error: "id_club (number) y nombre (string) son requeridos" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("canchas_tarifarios")
      .insert([{ id_club, nombre, descripcion, activo }])
      .select("id_tarifario,id_club,nombre,descripcion,activo,created_at")
      .single();

    if (error) {
      console.error("[ADMIN POST /tarifarios] error:", error);
      return NextResponse.json({ error: "Error al crear tarifario" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[ADMIN POST /tarifarios] ex:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
