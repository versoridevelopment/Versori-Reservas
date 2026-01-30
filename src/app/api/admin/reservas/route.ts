import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type TipoTurno =
  | "normal"
  | "profesor"
  | "torneo"
  | "escuela"
  | "cumpleanos"
  | "abonado";

type Segmento = "publico" | "profe";

type Body = {
  id_club: number;
  id_cancha: number;
  fecha: string; // YYYY-MM-DD
  inicio: string; // HH:MM
  duracion_min?: 60 | 90 | 120;
  fin?: string; // HH:MM
  tipo_turno?: TipoTurno;
  notas?: string | null;
  cliente_nombre?: string | null;
  cliente_telefono?: string | null;
  cliente_email?: string | null;
  segmento_override?: Segmento;
};

// HELPERS
function toMin(hhmm: string) {
  const [h, m] = (hhmm || "").slice(0, 5).split(":").map(Number);
  return h * 60 + (m || 0);
}
function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function minToHHMM(minAbs: number) {
  // Manejo circular del reloj (1440 min = 24h)
  const m = ((minAbs % 1440) + 1440) % 1440;
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${pad2(hh)}:${pad2(mm)}`;
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function arMidnightISO(dateISO: string) {
  return `${dateISO}T00:00:00-03:00`;
}
function addDaysISO(dateISO: string, add: number) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const dt = new Date(y, m - 1, d + add);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

// VALIDAR ADMIN O STAFF
async function assertAdminOrStaff(params: { id_club: number; userId: string }) {
  const { id_club, userId } = params;
  const { data, error } = await supabaseAdmin
    .from("club_usuarios")
    .select("id_usuario, id_club, roles!inner(nombre)")
    .eq("id_club", id_club)
    .eq("id_usuario", userId)
    .in("roles.nombre", ["admin", "cajero", "staff"]) // Agregado "staff"
    .limit(1);

  if (error)
    return {
      ok: false as const,
      status: 500,
      error: `Error DB: ${error.message}`,
    };
  if (!data || data.length === 0)
    return { ok: false as const, status: 403, error: "Sin permisos" };
  return { ok: true as const };
}

// --- POST HANDLER ---
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Body | null;

    const id_club = Number(body?.id_club);
    const id_cancha = Number(body?.id_cancha);
    const fecha = String(body?.fecha || "");
    const inicio = String(body?.inicio || "");
    // Si viene fin manual (drag/resize en calendario), lo usamos
    const finFromBody = body?.fin ? String(body.fin) : "";

    const tipo_turno = String(body?.tipo_turno || "normal") as TipoTurno;
    const notas = body?.notas ?? null;
    const cliente_nombre = String(body?.cliente_nombre ?? "");
    const cliente_telefono = String(body?.cliente_telefono ?? "");
    const cliente_email = String(body?.cliente_email ?? "");

    // 1. Validaciones básicas
    if (!id_club || Number.isNaN(id_club))
      return NextResponse.json({ error: "Falta id_club" }, { status: 400 });
    if (!id_cancha || Number.isNaN(id_cancha))
      return NextResponse.json({ error: "Falta id_cancha" }, { status: 400 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha))
      return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
    if (!/^\d{2}:\d{2}$/.test(inicio))
      return NextResponse.json(
        { error: "Hora inicio inválida" },
        { status: 400 },
      );

    // 2. Lógica Duración y Fin
    let duracion_min = Number(body?.duracion_min || 0);

    // Si no viene duración explícita (ej. 60/90), intentamos calcularla usando 'fin'
    if (!duracion_min && /^\d{2}:\d{2}$/.test(finFromBody)) {
      const startMin = toMin(inicio);
      let endMin = toMin(finFromBody);
      // Si fin es menor a inicio (ej 23:00 -> 00:30), asumimos día siguiente (+1440)
      if (endMin <= startMin) endMin += 1440;
      duracion_min = endMin - startMin;
    }

    // Validación final de duración (permitimos múltiplos de 30 para flexibilidad)
    if (duracion_min <= 0 || duracion_min % 30 !== 0) {
      // Fallback si falló todo: 90 min por defecto
      if (duracion_min === 0) duracion_min = 90;
      else
        return NextResponse.json(
          { error: "Duración inválida (debe ser múltiplo de 30 min)" },
          { status: 400 },
        );
    }

    // 3. Calcular Hora Fin Real y Offset de Día
    const startMin = toMin(inicio);
    const endMinAbs = startMin + duracion_min;

    // fin_dia_offset = 1 si termina a las 00:00 o después del día siguiente
    const fin_dia_offset: 0 | 1 = endMinAbs >= 1440 ? 1 : 0;
    const fin = minToHHMM(endMinAbs);

    // 4. Auth y Permisos
    const supabase = await getSupabaseServerClient();
    const { data: authRes, error: aErr } = await supabase.auth.getUser();
    if (aErr || !authRes?.user?.id)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const adminUserId = authRes.user.id;
    const perm = await assertAdminOrStaff({ id_club, userId: adminUserId });
    if (!perm.ok)
      return NextResponse.json({ error: perm.error }, { status: perm.status });

    if (!cliente_nombre && !cliente_telefono) {
      return NextResponse.json(
        { error: "Ingresa al menos un nombre o teléfono" },
        { status: 400 },
      );
    }

    // 5. Validar Solapamientos (Ventana de seguridad)
    const windowStart = new Date(arMidnightISO(fecha)).toISOString();
    const windowEnd = new Date(
      arMidnightISO(addDaysISO(fecha, 2)),
    ).toISOString(); // Miramos hasta 48hs adelante por seguridad

    const { error: ovErr } = await supabaseAdmin
      .from("reservas")
      .select("id_reserva")
      .eq("id_club", id_club)
      .eq("id_cancha", id_cancha)
      .in("estado", ["confirmada", "pendiente_pago"])
      // Logica de overlap: (NewStart < OldEnd) AND (NewEnd > OldStart)
      // En SQL Supabase range types es mejor, pero aquí usamos timestamps string
      .lt("inicio_ts", windowEnd)
      .gt("fin_ts", windowStart)
      .limit(100); // Traemos candidatos y filtramos en memoria si es complejo, o confiamos en RPC

    // NOTA: Para solapamiento exacto lo ideal es usar la RPC 'reservas_check_overlap' si la tienes,
    // o confiar en el constraint de la DB (Postgres EXCLUDE).
    // Aquí asumimos que si insert falla, es por overlap.

    // 6. Calcular Precio
    const segmento_override: Segmento =
      body?.segmento_override ||
      (tipo_turno === "profesor" ? "profe" : "publico");

    const calcRes = await fetch(
      new URL("/api/reservas/calcular-precio", req.url),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: req.headers.get("cookie") || "",
        },
        body: JSON.stringify({
          id_club,
          id_cancha,
          fecha,
          inicio,
          fin,
          segmento_override,
        }),
        cache: "no-store",
      },
    );

    const calcJson = await calcRes.json().catch(() => null);
    if (!calcRes.ok || !calcJson?.ok) {
      return NextResponse.json(
        { error: calcJson?.error || "Error calculando precio" },
        { status: 409 },
      );
    }

    const precio_total = Number(calcJson.precio_total || 0);
    const id_tarifario = Number(calcJson.id_tarifario) || null;
    const id_regla = Number(calcJson.id_regla) || null;
    const segmento = (calcJson.segmento || segmento_override) as Segmento;

    // 7. Calcular Seña/Anticipo
    const { data: clubData } = await supabaseAdmin
      .from("clubes")
      .select("anticipo_porcentaje")
      .eq("id_club", id_club)
      .single();

    const pct = Number(clubData?.anticipo_porcentaje ?? 50);
    const monto_anticipo = round2(precio_total * (pct / 100));

    // 8. INSERT FINAL
    const { data: inserted, error: insErr } = await supabaseAdmin
      .from("reservas")
      .insert({
        id_club,
        id_cancha,
        id_usuario: null, // Reserva manual admin
        fecha,
        inicio,
        fin,
        fin_dia_offset,
        estado: "confirmada", // Admin crea confirmado directo generalmente
        precio_total,
        anticipo_porcentaje: pct,
        monto_anticipo,
        segmento,
        id_tarifario,
        id_regla,
        tipo_turno,
        notas: notas || null,
        cliente_nombre: cliente_nombre.trim() || null,
        cliente_telefono: cliente_telefono.trim() || null,
        cliente_email: cliente_email.trim() || null,
        origen: "admin",
        creado_por: adminUserId,
      })
      .select("id_reserva")
      .single();

    if (insErr) {
      if (insErr.code === "23P01")
        return NextResponse.json(
          { error: "Ya existe un turno en ese horario" },
          { status: 409 },
        );
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      id_reserva: inserted.id_reserva,
      fecha,
      inicio,
      fin,
      precio_total,
      cliente_nombre,
    });
  } catch (e: any) {
    console.error("[POST /api/admin/reservas] Error:", e);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
