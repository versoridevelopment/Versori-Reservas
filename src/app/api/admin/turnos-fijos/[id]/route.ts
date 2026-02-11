import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const id_club = Number(url.searchParams.get("id_club"));

    // 1. Obtener Template
    const { data: tf, error } = await supabaseAdmin
      .from("turnos_fijos")
      .select("*")
      .eq("id_turno_fijo", id)
      .eq("id_club", id_club)
      .maybeSingle();

    if (error || !tf)
      return NextResponse.json(
        { ok: false, error: "No encontrado" },
        { status: 404 },
      );

    // 2. Consultas paralelas: Cliente y Reservas generadas
    const [clienteRes, reservasRes] = await Promise.all([
      supabaseAdmin
        .from("clientes_manuales")
        .select("nombre, telefono, email")
        .eq("id_cliente", tf.id_cliente_manual)
        .single(),
      supabaseAdmin
        .from("reservas")
        .select("id_reserva, fecha, inicio, fin, estado")
        .eq("id_turno_fijo", id)
        .gte("fecha", new Date().toISOString().split("T")[0])
        .order("fecha", { ascending: true }),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        ...tf,
        cliente: clienteRes.data || { nombre: "Desconocido" },
        reservas: reservasRes.data || [],
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
