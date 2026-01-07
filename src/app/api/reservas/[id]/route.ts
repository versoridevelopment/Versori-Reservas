import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id_reserva = Number(params.id);
    if (!id_reserva || Number.isNaN(id_reserva)) {
      return NextResponse.json({ error: "id inválido" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("reservas")
      .select(`
        id_reserva,
        estado,
        expires_at,
        confirmed_at,
        reservas_pagos (
          id_pago,
          status,
          mp_status,
          mp_payment_id,
          amount,
          created_at
        )
      `)
      .eq("id_reserva", id_reserva)
      .order("created_at", { referencedTable: "reservas_pagos", ascending: false })
      .limit(1, { referencedTable: "reservas_pagos" })
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    const now = new Date();

    // Expirada por tiempo (hold vencido)
    if (
      data.estado === "pendiente_pago" &&
      data.expires_at &&
      new Date(data.expires_at) <= now
    ) {
      return NextResponse.json({
        id_reserva,
        estado: "expirada",
      });
    }

    // Si hay pago rechazado explícito
    const ultimoPago = data.reservas_pagos?.[0];
    if (
      ultimoPago &&
      ["rejected", "cancelled"].includes(ultimoPago.mp_status)
    ) {
      return NextResponse.json({
        id_reserva,
        estado: "rechazada",
      });
    }

    // Estado normal
    return NextResponse.json({
      id_reserva,
      estado: data.estado,
      confirmed_at: data.confirmed_at,
    });
  } catch (e: any) {
    console.error("[GET /api/reservas/:id] ex:", e);
    return NextResponse.json(
      { error: e?.message || "Error interno" },
      { status: 500 }
    );
  }
}
