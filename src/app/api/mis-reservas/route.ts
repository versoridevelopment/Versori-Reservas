import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSubdomainFromHost } from "@/lib/ObetenerClubUtils/tenantUtils";
import { getClubBySubdomain } from "@/lib/ObetenerClubUtils/getClubBySubdomain";

export const runtime = "nodejs";

function num(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: Request) {
  try {
    // 1) Validar sesión
    const supabase = await getSupabaseServerClient();
    const { data: userRes, error: uErr } = await supabase.auth.getUser();

    if (uErr) return NextResponse.json({ error: "No se pudo validar la sesión" }, { status: 401 });
    const userId = userRes?.user?.id ?? null;
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    // 2) Resolver club por subdominio (multi-tenant)
    const url = new URL(req.url);
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
    const sub = getSubdomainFromHost(host);

    if (!sub) {
      return NextResponse.json(
        { error: "No se pudo determinar el club (subdominio vacío)" },
        { status: 400 }
      );
    }

    const club = await getClubBySubdomain(sub);
    if (!club?.id_club) {
      return NextResponse.json({ error: "Club no encontrado" }, { status: 404 });
    }

    const id_club = num(club.id_club);
    if (!id_club) return NextResponse.json({ error: "Club inválido" }, { status: 400 });

    // 3) Filtros opcionales
    const sp = url.searchParams;
    const estado = sp.get("estado"); // confirmada|pendiente_pago|rechazada|expirada|null
    const desde = sp.get("desde"); // YYYY-MM-DD
    const hasta = sp.get("hasta"); // YYYY-MM-DD
    const limit = Math.min(100, Math.max(1, num(sp.get("limit")) ?? 50));

    // 4) Query
    let q = supabaseAdmin
      .from("reservas")
      .select(
        `
        id_reserva,
        id_club,
        id_cancha,
        fecha,
        inicio,
        fin,
        fin_dia_offset,
        estado,
        precio_total,
        monto_anticipo,
        confirmed_at,
        created_at,
        canchas:canchas ( nombre )
      `
      )
      .eq("id_club", id_club)
      .eq("id_usuario", userId)
      .order("fecha", { ascending: false })
      .order("inicio", { ascending: false })
      .limit(limit);

    if (estado) q = q.eq("estado", estado);
    if (desde) q = q.gte("fecha", desde);
    if (hasta) q = q.lte("fecha", hasta);

    const { data, error } = await q;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data || []).map((r: any) => ({
      id_reserva: r.id_reserva,
      fecha: r.fecha,
      inicio: r.inicio,
      fin: r.fin,
      fin_dia_offset: r.fin_dia_offset,
      estado: r.estado,
      precio_total: r.precio_total,
      monto_anticipo: r.monto_anticipo,
      confirmed_at: r.confirmed_at,
      created_at: r.created_at,
      cancha_nombre: r.canchas?.nombre ?? null,
    }));

    return NextResponse.json({
      ok: true,
      id_club,
      subdominio: sub,
      reservas: rows,
    });
  } catch (e: any) {
    console.error("[GET /api/mis-reservas] ex:", e);
    return NextResponse.json({ error: e?.message || "Error interno" }, { status: 500 });
  }
}
