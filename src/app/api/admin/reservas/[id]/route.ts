import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

// Helper de permisos (standalone)
async function assertAdminOrStaff(id_club: number, userId: string) {
  const { data, error } = await supabaseAdmin
    .from("club_usuarios")
    .select("roles!inner(nombre)")
    .eq("id_club", id_club)
    .eq("id_usuario", userId)
    .in("roles.nombre", ["admin", "cajero"])
    .limit(1);

  if (error || !data || data.length === 0) return false;
  return true;
}

// ===============================
// GET (tu full de reserva)
// ===============================
export async function GET(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const id_reserva = Number(id);

    if (!id_reserva || Number.isNaN(id_reserva)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // 1) Auth
    const supabase = await getSupabaseServerClient();
    const { data: authRes } = await supabase.auth.getUser();
    if (!authRes?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = authRes.user.id;

    // 2) Fetch full
    const { data: reserva, error } = await supabaseAdmin
      .from("reservas")
      .select(
        `
        *,
        cancha:canchas(nombre),
        profile:profiles(id_usuario, nombre, apellido, telefono, email),
        pagos:reservas_pagos(*)
      `
      )
      .eq("id_reserva", id_reserva)
      .single();

    if (error || !reserva) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    // 3) Permisos
    const hasAccess = await assertAdminOrStaff(reserva.id_club, userId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    // 4) Normalizar
    const cliente_nombre =
      (
        reserva.cliente_nombre ||
        (reserva.profile
          ? `${reserva.profile.nombre} ${reserva.profile.apellido}`
          : "")
      ).trim() || "Sin nombre";

    const cliente_telefono =
      reserva.cliente_telefono || reserva.profile?.telefono || "";
    const cliente_email = reserva.cliente_email || reserva.profile?.email || "";

    const pagosAprobados = (reserva.pagos || [])
      .filter((p: any) => p.status === "approved")
      .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

    const precio_total = Number(reserva.precio_total) || 0;
    const saldo = Math.max(0, precio_total - pagosAprobados);
    const pagado_total = saldo === 0 && precio_total > 0;

    return NextResponse.json({
      ok: true,
      data: {
        ...reserva,
        cliente_nombre,
        cliente_telefono,
        cliente_email,
        pagos_aprobados_total: pagosAprobados,
        saldo_pendiente: saldo,
        pagado_total,
        pagos_historial: reserva.pagos,
      },
    });
  } catch (e: any) {
    console.error("[GET /api/admin/reservas/[id]]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ===============================
// PATCH (mover reserva)
// ===============================
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const id_reserva = Number(id);
    if (!id_reserva || Number.isNaN(id_reserva)) {
      return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
    }

    const body = (await req.json().catch(() => null)) as any;

    const id_cancha = Number(body?.id_cancha);
    const fecha = String(body?.fecha || "");
    const inicio = String(body?.inicio || "");

    if (!Number.isFinite(id_cancha) || id_cancha <= 0) {
      return NextResponse.json({ ok: false, error: "id_cancha inválido" }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return NextResponse.json({ ok: false, error: "fecha inválida (YYYY-MM-DD)" }, { status: 400 });
    }
    if (!/^\d{2}:\d{2}$/.test(inicio)) {
      return NextResponse.json({ ok: false, error: "inicio inválido (HH:MM)" }, { status: 400 });
    }

    // Auth
    const supabase = await getSupabaseServerClient();
    const { data: authRes, error: aErr } = await supabase.auth.getUser();
    if (aErr || !authRes?.user?.id) {
      return NextResponse.json({ ok: false, error: "LOGIN_REQUERIDO" }, { status: 401 });
    }
    const userId = authRes.user.id;

    // Traer reserva actual (para permisos + duración + segmento)
    const { data: r0, error: r0Err } = await supabaseAdmin
      .from("reservas")
      .select("id_reserva,id_club,id_cancha,fecha,inicio,fin,fin_dia_offset,segmento,estado")
      .eq("id_reserva", id_reserva)
      .maybeSingle();

    if (r0Err) {
      return NextResponse.json({ ok: false, error: r0Err.message }, { status: 500 });
    }
    if (!r0?.id_club) {
      return NextResponse.json({ ok: false, error: "Reserva no encontrada" }, { status: 404 });
    }

    const okPerm = await assertAdminOrStaff(r0.id_club, userId);
    if (!okPerm) {
      return NextResponse.json({ ok: false, error: "Sin permisos" }, { status: 403 });
    }

    // ----- duración snapshot -----
    const oldInicio = String(r0.inicio || "").slice(0, 5);
    const oldFin = String(r0.fin || "").slice(0, 5);
    const oldOffset = Number(r0.fin_dia_offset || 0);

    const toMin = (hhmm: string) => {
      const [h, m] = hhmm.slice(0, 5).split(":").map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const addMinutesHHMM = (hhmm: string, addMin: number) => {
      const [h, m] = hhmm.slice(0, 5).split(":").map(Number);
      let total = (h || 0) * 60 + (m || 0) + addMin;
      total = ((total % 1440) + 1440) % 1440;
      const hh = String(Math.floor(total / 60)).padStart(2, "0");
      const mm = String(total % 60).padStart(2, "0");
      return `${hh}:${mm}`;
    };

    let oldEndMin = toMin(oldFin);
    const oldStartMin = toMin(oldInicio);
    if (oldOffset === 1 || oldEndMin <= oldStartMin) oldEndMin += 1440;
    const duracion_min = oldEndMin - oldStartMin;

    // fin nuevo + fin_dia_offset auto
    const startMin = toMin(inicio);
    const endMin = startMin + duracion_min;

    const fin = addMinutesHHMM(inicio, duracion_min);
    const fin_dia_offset = endMin > 1440 ? 1 : 0;

    // ----- recalcular precio usando TU API -----
    const segmento_override =
      r0.segmento === "profe" || r0.segmento === "publico" ? r0.segmento : "publico";

    // ✅ CLAVE: reenviar cookies del request original
    const cookie = req.headers.get("cookie") ?? "";

    const priceRes = await fetch(new URL("/api/reservas/calcular-precio", req.url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie, // ✅
      },
      cache: "no-store",
      body: JSON.stringify({
        id_club: r0.id_club,
        id_cancha,
        fecha,
        inicio,
        fin,
        segmento_override,
      }),
    });

    if (priceRes.status === 401) {
      return NextResponse.json(
        { ok: false, error: "SESSION_NO_ENVIADA_AL_CALCULO" },
        { status: 401 }
      );
    }

    const priceJson = await priceRes.json().catch(() => null);
    if (!priceRes.ok || !priceJson?.ok) {
      return NextResponse.json(
        { ok: false, error: priceJson?.error || "No se pudo calcular el precio" },
        { status: 409 }
      );
    }

    const precio_total = Number(priceJson.precio_total || 0);
    const id_tarifario = Number(priceJson.id_tarifario || 0) || null;
    const id_regla = Number(priceJson.id_regla || 0) || null;

    if (!precio_total || precio_total <= 0) {
      return NextResponse.json({ ok: false, error: "PRECIO_INVALIDO" }, { status: 409 });
    }

    // ----- move atómico (solape + timestamps + precio) -----
    const { data, error } = await supabaseAdmin.rpc("reservas_move", {
      p_id_reserva: id_reserva,
      p_id_cancha: id_cancha,
      p_fecha: fecha,
      p_inicio: `${inicio}:00`,
      p_fin: `${fin}:00`,
      p_fin_dia_offset: fin_dia_offset,
      p_precio_total: precio_total,
      p_id_tarifario: id_tarifario,
      p_id_regla: id_regla,
    });

    if (error) {
      const msg = error.message || "Error moviendo reserva";
      if (msg.includes("SOLAPAMIENTO")) {
        return NextResponse.json({ ok: false, error: "SOLAPAMIENTO" }, { status: 409 });
      }
      return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      data: Array.isArray(data) ? data[0] : data,
    });
  } catch (e: any) {
    console.error("[PATCH /api/admin/reservas/[id]]", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error interno" },
      { status: 500 }
    );
  }
}
