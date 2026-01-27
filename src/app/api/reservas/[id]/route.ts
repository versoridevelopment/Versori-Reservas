import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export const runtime = "nodejs";

type Estado = "pendiente_pago" | "confirmada" | "expirada" | "rechazada";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const id_reserva = Number(id);

    if (!id_reserva || Number.isNaN(id_reserva)) {
      return NextResponse.json({ error: "id inválido" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("reservas")
      .select(
        `
        id_reserva,
        estado,
        expires_at,
        confirmed_at,
        id_usuario,
        fecha,
        inicio,
        fin,
        fin_dia_offset,
        precio_total,
        anticipo_porcentaje,
        monto_anticipo,
        cliente_nombre,
        cliente_telefono,
        cliente_email,
        clubes:clubes ( id_club, nombre, subdominio ),
        canchas:canchas ( id_cancha, nombre ),
        reservas_pagos (
          id_pago,
          status,
          mp_status,
          mp_status_detail,
          mp_payment_id,
          amount,
          currency,
          created_at
        )
      `
      )
      .eq("id_reserva", id_reserva)
      .order("created_at", { referencedTable: "reservas_pagos", ascending: false })
      .limit(1, { referencedTable: "reservas_pagos" })
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    // Estado “derivado” (expirada / rechazada por último pago)
    const now = new Date();
    let estado: Estado = data.estado as Estado;

    if (estado === "pendiente_pago" && data.expires_at) {
      const exp = new Date(data.expires_at);
      if (!Number.isFinite(exp.getTime()) || exp <= now) estado = "expirada";
    }

    const ultimoPago = (data as any).reservas_pagos?.[0];
    if (ultimoPago && ["rejected", "cancelled"].includes(String(ultimoPago.mp_status))) {
      estado = "rechazada";
    }

    // ✅ Fallback de cliente desde profiles si la reserva no tiene cliente_*
    let cliente_nombre: string | null = data.cliente_nombre ?? null;
    let cliente_telefono: string | null = data.cliente_telefono ?? null;
    let cliente_email: string | null = data.cliente_email ?? null;

    const userId = data.id_usuario ?? null;

    if (
      userId &&
      (!cliente_nombre || !cliente_telefono || !cliente_email)
    ) {
      const { data: prof, error: pErr } = await supabaseAdmin
        .from("profiles")
        .select("nombre, apellido, telefono, email")
        .eq("id_usuario", userId)
        .maybeSingle();

      if (!pErr && prof) {
        const fullName = [prof.nombre, prof.apellido].filter(Boolean).join(" ").trim();
        if (!cliente_nombre && fullName) cliente_nombre = fullName;
        if (!cliente_telefono && prof.telefono) cliente_telefono = prof.telefono;
        if (!cliente_email && prof.email) cliente_email = prof.email;
      }
    }

    return NextResponse.json({
      id_reserva: data.id_reserva,
      estado,
      expires_at: data.expires_at,
      confirmed_at: data.confirmed_at,

      fecha: data.fecha,
      inicio: data.inicio,
      fin: data.fin,
      fin_dia_offset: data.fin_dia_offset,

      precio_total: data.precio_total,
      anticipo_porcentaje: data.anticipo_porcentaje,
      monto_anticipo: data.monto_anticipo,

      cliente_nombre,
      cliente_telefono,
      cliente_email,

      club_nombre: (data as any).clubes?.nombre ?? null,
      club_subdominio: (data as any).clubes?.subdominio ?? null,
      cancha_nombre: (data as any).canchas?.nombre ?? null,

      ultimo_pago: ultimoPago
        ? {
            id_pago: ultimoPago.id_pago,
            status: ultimoPago.status,
            mp_status: ultimoPago.mp_status,
            mp_status_detail: ultimoPago.mp_status_detail,
            mp_payment_id: ultimoPago.mp_payment_id,
            amount: ultimoPago.amount,
            currency: ultimoPago.currency,
            created_at: ultimoPago.created_at,
          }
        : null,
    });
  } catch (e: any) {
    console.error("[GET /api/reservas/:id] ex:", e);
    return NextResponse.json(
      { error: e?.message || "Error interno" },
      { status: 500 }
    );
  }
}
