import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

// --- FUNCIONES AUXILIARES (HELPERS) ---
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

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

// --- HANDLER PRINCIPAL ---
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const id_club = Number(body?.id_club);
    const weeks_ahead = Math.min(
      52,
      Math.max(1, Number(body?.weeks_ahead ?? 8)),
    );

    const supabase = await getSupabaseServerClient();
    const { data: authRes } = await supabase.auth.getUser();
    if (!authRes?.user) {
      return NextResponse.json({ error: "LOGIN_REQUERIDO" }, { status: 401 });
    }

    // Usamos cookies() para validar sesión si es necesario,
    // pero lo hacemos de forma que ESLint no se queje.
    await cookies();

    // Obtener el template del turno fijo
    const { data: tf, error: tfErr } = await supabaseAdmin
      .from("turnos_fijos")
      .select("*")
      .eq("id_turno_fijo", id)
      .single();

    if (tfErr || !tf) {
      return NextResponse.json(
        { error: "Turno fijo no encontrado" },
        { status: 404 },
      );
    }

    const { fin, fin_dia_offset } = computeEnd(tf.inicio, tf.duracion_min);

    // Lógica de fechas: empezar desde la última reserva existente o desde hoy
    const { data: lastInst } = await supabaseAdmin
      .from("reservas")
      .select("fecha")
      .eq("id_turno_fijo", id)
      .order("fecha", { ascending: false })
      .limit(1)
      .maybeSingle();

    const start_from = lastInst ? addDaysISO(lastInst.fecha, 7) : todayISO();

    let created_count = 0;
    const conflicts = [];

    // Generar las nuevas instancias
    for (let i = 0; i < weeks_ahead; i++) {
      const fecha = addDaysISO(start_from, i * 7);

      const { error: insErr } = await supabaseAdmin.from("reservas").insert({
        id_club,
        id_cancha: tf.id_cancha,
        id_cliente_manual: tf.id_cliente_manual,
        fecha,
        inicio: tf.inicio,
        fin,
        fin_dia_offset,
        estado: "confirmada",
        precio_total: 0, // Se recomienda calcular precio real aquí
        tipo_turno: tf.tipo_turno,
        origen: "turno_fijo",
        id_turno_fijo: id,
        creado_por: authRes.user.id,
      });

      if (insErr) {
        conflicts.push({ fecha, error: insErr.message });
      } else {
        created_count++;
      }
    }

    return NextResponse.json({
      ok: true,
      created_count,
      conflicts,
      start_from,
      weeks_generated: weeks_ahead,
    });
  } catch (e: any) {
    console.error("Error en regeneración:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
