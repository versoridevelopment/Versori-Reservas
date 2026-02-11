import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- HELPERS (Se mantienen igual) ---
function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function toMin(hhmm: string) {
  const [h, m] = (hhmm || "").slice(0, 5).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}
function minToHHMM(minAbs: number) {
  const m = ((minAbs % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
}
function computeEnd(inicioHHMM: string, duracion_min: number) {
  const startMin = toMin(inicioHHMM);
  const endMinAbs = startMin + duracion_min;
  return {
    fin: minToHHMM(endMinAbs),
    fin_dia_offset: endMinAbs >= 1440 ? 1 : 0,
  };
}
function addDaysISO(dateISO: string, add: number) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const dt = new Date(y, m - 1, d + add);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

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

// --- POST: CREAR TURNO FIJO ---
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id_club = Number(body.id_club);
    const id_cliente_manual = Number(body.id_cliente_manual);

    if (!id_cliente_manual)
      return NextResponse.json(
        { error: "Se requiere un ID de cliente manual" },
        { status: 400 },
      );

    const supabase = await getSupabaseServerClient();
    const { data: authRes } = await supabase.auth.getUser();
    if (!authRes.user)
      return NextResponse.json({ error: "LOGIN_REQUERIDO" }, { status: 401 });

    const perm = await assertAdminOrStaff({ id_club, userId: authRes.user.id });
    if (!perm.ok)
      return NextResponse.json({ error: perm.error }, { status: perm.status });

    const { fin, fin_dia_offset } = computeEnd(body.inicio, body.duracion_min);
    const dow = new Date(`${body.start_date}T00:00:00-03:00`).getDay();

    // 1. Insertar Template
    const { data: tf, error: tfErr } = await supabaseAdmin
      .from("turnos_fijos")
      .insert({
        id_club,
        id_cancha: body.id_cancha,
        id_cliente_manual, // ✅ NUEVO: Relación por ID
        dow,
        inicio: body.inicio,
        duracion_min: body.duracion_min,
        fin,
        fin_dia_offset,
        activo: true,
        segmento: body.segmento_override || "publico",
        tipo_turno: body.tipo_turno || "normal",
        notas: body.notas || null,
        start_date: body.start_date,
        creado_por: authRes.user.id,
      })
      .select("id_turno_fijo")
      .single();

    if (tfErr) throw tfErr;

    // 2. Generar Instancias de Reserva
    const weeks = Math.min(52, body.weeks_ahead || 8);
    const inserts = [];
    for (let i = 0; i <= weeks; i++) {
      inserts.push({
        id_club,
        id_cancha: body.id_cancha,
        id_cliente_manual, // ✅ Heredado a la reserva
        fecha: addDaysISO(body.start_date, i * 7),
        inicio: body.inicio,
        fin,
        fin_dia_offset,
        estado: "confirmada",
        precio_total: 0, // Cálculo de precio según tu lógica
        tipo_turno: body.tipo_turno || "normal",
        origen: "turno_fijo",
        id_turno_fijo: tf.id_turno_fijo,
        creado_por: authRes.user.id,
      });
    }

    const { error: insErr } = await supabaseAdmin
      .from("reservas")
      .insert(inserts);
    if (insErr) throw insErr;

    return NextResponse.json({
      ok: true,
      id_turno_fijo: tf.id_turno_fijo,
      created_count: inserts.length,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// --- GET: LISTAR TURNOS FIJOS ---
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id_club = Number(searchParams.get("id_club"));

    // 1. Traer templates planos
    const { data: templates, error } = await supabaseAdmin
      .from("turnos_fijos")
      .select("*")
      .eq("id_club", id_club)
      .order("activo", { ascending: false })
      .order("inicio", { ascending: true });

    if (error) throw error;

    // 2. Resolver Clientes Manuales por separado (Consultas paralelas)
    const manualIds = Array.from(
      new Set(templates?.map((t) => t.id_cliente_manual).filter(Boolean)),
    );

    let manualesMap = new Map();
    if (manualIds.length > 0) {
      const { data: manRes } = await supabaseAdmin
        .from("clientes_manuales")
        .select("id_cliente, nombre, telefono")
        .in("id_cliente", manualIds);
      manRes?.forEach((m) => manualesMap.set(m.id_cliente, m));
    }

    // 3. Ensamblar datos limpios
    const data = (templates || []).map((tf) => ({
      ...tf,
      cliente_nombre:
        manualesMap.get(tf.id_cliente_manual)?.nombre || "Invitado",
      cliente_telefono: manualesMap.get(tf.id_cliente_manual)?.telefono || "",
    }));

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
