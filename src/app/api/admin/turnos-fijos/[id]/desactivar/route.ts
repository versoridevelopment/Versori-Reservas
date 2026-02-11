import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { id_club, cancelar_futuras, motivo } = body;

    const supabase = await getSupabaseServerClient();
    const { data: authRes } = await supabase.auth.getUser();
    if (!authRes?.user)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    // 1. Desactivar el template
    const { error: upErr } = await supabaseAdmin
      .from("turnos_fijos")
      .update({ activo: false, updated_at: new Date().toISOString() })
      .eq("id_turno_fijo", id)
      .eq("id_club", id_club);

    if (upErr) throw upErr;

    // 2. Cancelar reservas futuras si se solicitó
    let canceled_count = 0;
    if (cancelar_futuras) {
      const hoy = new Date().toISOString().split("T")[0];
      const { data: canceled, error: canErr } = await supabaseAdmin
        .from("reservas")
        .update({
          estado: "cancelada",
          notas: motivo || "Turno fijo desactivado",
          cancelado_at: new Date().toISOString(),
        })
        .eq("id_turno_fijo", id)
        .gte("fecha", hoy)
        .in("estado", ["confirmada", "pendiente_pago"])
        .select("id_reserva");

      if (canErr) throw canErr;
      canceled_count = canceled?.length || 0;
    }

    return NextResponse.json({ ok: true, canceled_count });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
