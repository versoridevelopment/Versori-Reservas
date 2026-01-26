import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function assertAdminOrStaff(params: { id_club: number; userId: string }) {
  const { id_club, userId } = params;

  const { data, error } = await supabaseAdmin
    .from("club_usuarios")
    .select("id_usuario, id_club, roles!inner(nombre)")
    .eq("id_club", id_club)
    .eq("id_usuario", userId)
    .in("roles.nombre", ["admin", "staff"])
    .limit(1);

  if (error) return { ok: false as const, status: 500, error: `Error validando rol: ${error.message}` };
  if (!data || data.length === 0) return { ok: false as const, status: 403, error: "No tenés permisos en este club" };
  return { ok: true as const };
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const id_reserva = Number(id);
    if (!id_reserva || Number.isNaN(id_reserva)) {
      return NextResponse.json({ ok: false, error: "id_reserva inválido" }, { status: 400 });
    }

    // Auth
    const supabase = await getSupabaseServerClient();
    const { data: authRes, error: aErr } = await supabase.auth.getUser();
    if (aErr) return NextResponse.json({ ok: false, error: "No se pudo validar la sesión" }, { status: 401 });
    const userId = authRes?.user?.id ?? null;
    if (!userId) return NextResponse.json({ ok: false, error: "LOGIN_REQUERIDO" }, { status: 401 });

    // Buscar reserva (y el club)
    const { data: reserva, error: rErr } = await supabaseAdmin
      .from("reservas")
      .select("id_reserva,id_club,estado")
      .eq("id_reserva", id_reserva)
      .maybeSingle();

    if (rErr) return NextResponse.json({ ok: false, error: `Error leyendo reserva: ${rErr.message}` }, { status: 500 });
    if (!reserva) return NextResponse.json({ ok: false, error: "Reserva no encontrada" }, { status: 404 });

    const id_club = Number((reserva as any).id_club);

    // Permisos
    const perm = await assertAdminOrStaff({ id_club, userId });
    if (!perm.ok) return NextResponse.json({ ok: false, error: perm.error }, { status: perm.status });

    // Cancelar
    const { error: upErr } = await supabaseAdmin
      .from("reservas")
      .update({
        estado: "cancelada",
        // si tenés campos de auditoría opcionales:
        // updated_at: new Date().toISOString(),
      })
      .eq("id_reserva", id_reserva);

    if (upErr) return NextResponse.json({ ok: false, error: `Error cancelando: ${upErr.message}` }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[POST /api/admin/reservas/[id]/cancelar] ex:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Error interno" }, { status: 500 });
  }
}
