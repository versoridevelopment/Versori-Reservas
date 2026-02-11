import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function assertAdminOrStaff(params: { id_club: number; userId: string }) {
  const { data } = await supabaseAdmin
    .from("club_usuarios")
    .select("roles!inner(nombre)")
    .eq("id_club", params.id_club)
    .eq("id_usuario", params.userId)
    .in("roles.nombre", ["admin", "cajero"])
    .limit(1);
  return data && data.length > 0
    ? { ok: true }
    : { ok: false, status: 403, error: "Sin permisos" };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const id_club = Number(url.searchParams.get("id_club") || 0);

    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const estado = url.searchParams.get("estado");

    if (!id || !id_club)
      return NextResponse.json(
        { error: "Parámetros inválidos" },
        { status: 400 },
      );

    const supabase = await getSupabaseServerClient();
    const { data: authRes } = await supabase.auth.getUser();
    if (!authRes?.user)
      return NextResponse.json({ error: "LOGIN_REQUERIDO" }, { status: 401 });

    const perm = await assertAdminOrStaff({ id_club, userId: authRes.user.id });
    if (!perm.ok)
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

    // ✅ Consulta sin columnas de texto borradas
    let q = supabaseAdmin
      .from("reservas")
      .select(
        "id_reserva, fecha, inicio, fin, fin_dia_offset, estado, precio_total, segmento, created_at, id_cliente_manual",
      )
      .eq("id_club", id_club)
      .eq("id_turno_fijo", id)
      .order("fecha", { ascending: true });

    if (from) q = q.gte("fecha", from);
    if (to) q = q.lte("fecha", to);
    if (estado) q = q.eq("estado", estado);

    const { data, error } = await q;
    if (error) throw error;

    return NextResponse.json({ ok: true, data: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
