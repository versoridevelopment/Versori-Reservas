import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export const runtime = "nodejs";

/**
 * GET /api/admin/usuarios?id_club=1&q=texto
 * Devuelve usuarios del club con roles agregados y flag es_profe.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idClubParam = searchParams.get("id_club");
    const q = (searchParams.get("q") ?? "").trim();

    if (!idClubParam) {
      return NextResponse.json({ error: "id_club es requerido" }, { status: 400 });
    }

    const id_club = Number(idClubParam);
    if (Number.isNaN(id_club)) {
      return NextResponse.json({ error: "id_club debe ser numérico" }, { status: 400 });
    }

    let query = supabaseAdmin
      .from("v_club_usuarios_roles_agregado")
      .select("*")
      .eq("id_club", id_club);

    // Búsqueda (email / nombre / apellido)
    if (q.length > 0) {
      // PostgREST OR sintaxis: col.ilike.%q%
      query = query.or(
        `email.ilike.%${q}%,nombre.ilike.%${q}%,apellido.ilike.%${q}%`
      );
    }

    const { data, error } = await query
      .order("apellido", { ascending: true })
      .order("nombre", { ascending: true });

    if (error) {
      console.error("[ADMIN GET /usuarios] error:", error);
      return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[ADMIN GET /usuarios] ex:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
