import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Body = {
  amount: number;
  currency?: string; // default "ARS"
  provider: "efectivo" | "transferencia" | "mercadopago";
  status?: "approved" | "pending" | "rejected";
  note?: string | null;
  // campos opcionales por si querés guardar data MP
  mp_payment_id?: string | number | null;
  mp_preference_id?: string | null;
  mp_status?: string | null;
  mp_status_detail?: string | null;
  external_reference?: string | null;
  raw?: any;
};

async function assertAdminOrStaff(params: { id_club: number; userId: string }) {
  const { id_club, userId } = params;

  const { data, error } = await supabaseAdmin
    .from("club_usuarios")
    .select("id_usuario, id_club, roles!inner(nombre)")
    .eq("id_club", id_club)
    .eq("id_usuario", userId)
    .in("roles.nombre", ["admin", "cajero"])
    .limit(1);

  if (error)
    return {
      ok: false as const,
      status: 500,
      error: `Error validando rol: ${error.message}`,
    };
  if (!data || data.length === 0)
    return {
      ok: false as const,
      status: 403,
      error: "No tenés permisos en este club",
    };
  return { ok: true as const };
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const id_reserva = Number(id);
    if (!id_reserva || Number.isNaN(id_reserva)) {
      return NextResponse.json(
        { ok: false, error: "id_reserva inválido" },
        { status: 400 },
      );
    }

    const body = (await req.json()) as Body;

    const amount = Number(body.amount);
    const currency = (body.currency || "ARS").toUpperCase();
    const provider = body.provider;
    const status = body.status || "approved";

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { ok: false, error: "amount inválido" },
        { status: 400 },
      );
    }
    if (!provider) {
      return NextResponse.json(
        { ok: false, error: "provider requerido" },
        { status: 400 },
      );
    }
    if (!["approved", "pending", "rejected"].includes(status)) {
      return NextResponse.json(
        { ok: false, error: "status inválido" },
        { status: 400 },
      );
    }

    // Auth
    const supabase = await getSupabaseServerClient();
    const { data: authRes, error: aErr } = await supabase.auth.getUser();
    if (aErr)
      return NextResponse.json(
        { ok: false, error: "No se pudo validar la sesión" },
        { status: 401 },
      );
    const userId = authRes?.user?.id ?? null;
    if (!userId)
      return NextResponse.json(
        { ok: false, error: "LOGIN_REQUERIDO" },
        { status: 401 },
      );

    // Buscar reserva (y el club)
    const { data: reserva, error: rErr } = await supabaseAdmin
      .from("reservas")
      .select("id_reserva,id_club,precio_total,estado")
      .eq("id_reserva", id_reserva)
      .maybeSingle();

    if (rErr)
      return NextResponse.json(
        { ok: false, error: `Error leyendo reserva: ${rErr.message}` },
        { status: 500 },
      );
    if (!reserva)
      return NextResponse.json(
        { ok: false, error: "Reserva no encontrada" },
        { status: 404 },
      );

    const id_club = Number((reserva as any).id_club);

    // Permisos
    const perm = await assertAdminOrStaff({ id_club, userId });
    if (!perm.ok)
      return NextResponse.json(
        { ok: false, error: perm.error },
        { status: perm.status },
      );

    // Insertar pago
    const insertPayload: any = {
      id_reserva,
      id_club,
      provider,
      status,
      amount,
      currency,
      // campos opcionales:
      mp_payment_id: body.mp_payment_id ?? null,
      mp_preference_id: body.mp_preference_id ?? null,
      mp_status: body.mp_status ?? null,
      mp_status_detail: body.mp_status_detail ?? null,
      external_reference: body.external_reference ?? null,
      raw: body.raw ?? null,
      last_event_at: new Date().toISOString(),
    };

    // si tu tabla tiene columna "note" y querés guardarlo:
    // insertPayload.note = body.note ?? null;

    const { error: insErr } = await supabaseAdmin
      .from("reservas_pagos")
      .insert(insertPayload);
    if (insErr)
      return NextResponse.json(
        { ok: false, error: `Error insertando pago: ${insErr.message}` },
        { status: 500 },
      );

    // (Opcional recomendado) Si con este pago ya cubre todo, setear reserva confirmada
    // Calculamos total approved actual (incluyendo este pago recién insertado)
    const { data: pagosRaw, error: payErr } = await supabaseAdmin
      .from("reservas_pagos")
      .select("amount,status")
      .eq("id_reserva", id_reserva)
      .eq("status", "approved");

    if (payErr) {
      // no es fatal, pero informamos
      return NextResponse.json({
        ok: true,
        warning: `Pago registrado, pero no pude recalcular saldo: ${payErr.message}`,
      });
    }

    const pagado = (pagosRaw || []).reduce(
      (acc, row: any) => acc + Number(row.amount || 0),
      0,
    );
    const precio_total = Number((reserva as any).precio_total || 0);

    if (precio_total > 0 && pagado >= precio_total) {
      await supabaseAdmin
        .from("reservas")
        .update({
          estado: "confirmada",
          confirmed_at: new Date().toISOString(),
        })
        .eq("id_reserva", id_reserva);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[POST /api/admin/reservas/[id]/cobrar] ex:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error interno" },
      { status: 500 },
    );
  }
}
