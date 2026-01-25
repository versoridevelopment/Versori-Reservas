import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSubdomainFromHost } from "@/lib/ObetenerClubUtils/tenantUtils";
import { getClubBySubdomain } from "@/lib/ObetenerClubUtils/getClubBySubdomain";

export const runtime = "nodejs";

type RoleName = "admin" | "staff";

type CanchaRow = {
  id_cancha: number;
  id_club: number;
  id_tipo_cancha: number | null;
  id_tarifario: number | null;
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
  es_exterior: boolean | null;
  activa: boolean | null;
};

type ReservaRow = {
  id_reserva: number;
  id_club: number;
  id_cancha: number;
  id_usuario: string | null;
  fecha: string; // YYYY-MM-DD
  inicio: string; // HH:MM:SS
  fin: string; // HH:MM:SS
  fin_dia_offset: number;
  estado: string;
  precio_total: number;
  monto_anticipo: number | null;
  segmento: string | null;
  tipo_turno: string | null;
  notas: string | null;

  cliente_nombre: string | null;
  cliente_telefono: string | null;
  cliente_email: string | null;

  inicio_ts: string; // generated
  fin_ts: string; // generated
  created_at: string;
};

type ProfileRow = {
  id_usuario: string;
  nombre: string | null;
  apellido: string | null;
  telefono: string | null;
  email: string | null;
};

type ReglaRow = {
  hora_desde: string; // time
  hora_hasta: string; // time
  cruza_medianoche: boolean | null;
};

function arDateISO(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
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

function toMin(hhmmss: string) {
  const s = (hhmmss || "").slice(0, 5);
  const [h, m] = s.split(":").map((x) => Number(x));
  return h * 60 + (m || 0);
}

function weekday0Sun(fechaISO: string) {
  const d = new Date(`${fechaISO}T00:00:00`);
  return d.getDay(); // 0..6
}

function roundDownToHalfHour(min: number) {
  return Math.floor(min / 30) * 30;
}
function roundUpToHalfHour(min: number) {
  return Math.ceil(min / 30) * 30;
}
function minToHourDecimal(min: number) {
  return Math.round((min / 60) * 2) / 2;
}

function pickThemeByIndex(idx: number) {
  const themes = ["blue", "purple", "green", "orange", "rose"] as const;
  return themes[idx % themes.length];
}

async function assertAdminOrStaff(params: { id_club: number; userId: string }) {
  const { id_club, userId } = params;

  const { data, error } = await supabaseAdmin
    .from("club_usuarios")
    .select("id_usuario, id_club, roles!inner(nombre)")
    .eq("id_club", id_club)
    .eq("id_usuario", userId)
    .in("roles.nombre", ["admin", "staff"] satisfies RoleName[])
    .limit(1);

  if (error) {
    return { ok: false as const, status: 500, error: `Error validando rol: ${error.message}` };
  }
  if (!data || data.length === 0) {
    return { ok: false as const, status: 403, error: "No tenés permisos de admin/staff en este club" };
  }

  return { ok: true as const };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // =======================
    // 0) RESOLVER CLUB REAL POR SUBDOMINIO (NO VIENE DEL FRONT)
    // =======================
    const host = req.headers.get("host") || "";
    const subdomain = getSubdomainFromHost(host);

    if (!subdomain) {
      return NextResponse.json({ error: "No se pudo resolver el club (subdominio)" }, { status: 400 });
    }

    const club = await getClubBySubdomain(subdomain);
    if (!club) {
      return NextResponse.json({ error: "Club inexistente" }, { status: 404 });
    }

    const id_club = Number(club.id_club);
    if (!id_club || Number.isNaN(id_club)) {
      return NextResponse.json({ error: "Club inválido" }, { status: 500 });
    }

    const fecha = searchParams.get("fecha") || arDateISO(new Date());

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return NextResponse.json({ error: "fecha inválida (YYYY-MM-DD)" }, { status: 400 });
    }

    // =======================
    // 1) AUTH
    // =======================
    const supabase = await getSupabaseServerClient();
    const { data: authRes, error: aErr } = await supabase.auth.getUser();
    if (aErr) return NextResponse.json({ error: "No se pudo validar la sesión" }, { status: 401 });

    const userId = authRes?.user?.id ?? null;
    if (!userId) return NextResponse.json({ error: "LOGIN_REQUERIDO" }, { status: 401 });

    // =======================
    // 2) PERMISOS
    // =======================
    const perm = await assertAdminOrStaff({ id_club, userId });
    if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status });

    // =======================
    // 3) CANCHAS DEL CLUB
    // =======================
    const { data: canchasRaw, error: cErr } = await supabaseAdmin
      .from("canchas")
      .select("id_cancha,id_club,id_tipo_cancha,id_tarifario,nombre,descripcion,imagen_url,es_exterior,activa")
      .eq("id_club", id_club)
      .eq("activa", true)
      .order("id_cancha", { ascending: true });

    if (cErr) {
      return NextResponse.json({ error: `Error leyendo canchas: ${cErr.message}` }, { status: 500 });
    }

    const canchas = (canchasRaw ?? []) as unknown as CanchaRow[];

    // =======================
    // 4) TARIFARIOS DEFAULT POR TIPO (DEL MISMO CLUB)
    // =======================
    const { data: defaultsRaw, error: dErr } = await supabaseAdmin
      .from("club_tarifarios_default")
      .select("id_tipo_cancha,id_tarifario")
      .eq("id_club", id_club);

    if (dErr) {
      return NextResponse.json({ error: `Error leyendo tarifarios default: ${dErr.message}` }, { status: 500 });
    }

    const defaultMap = new Map<number, number>();
    for (const row of defaultsRaw || []) {
      const t = Number((row as any).id_tipo_cancha);
      const tf = Number((row as any).id_tarifario);
      if (Number.isFinite(t) && Number.isFinite(tf)) defaultMap.set(t, tf);
    }

    const canchaTarifario = new Map<number, number>(); // id_cancha -> id_tarifario
    const tarifariosSet = new Set<number>();

    for (const c of canchas) {
      const direct = c.id_tarifario != null ? Number(c.id_tarifario) : null;
      const fromDefault =
        direct == null && c.id_tipo_cancha != null ? defaultMap.get(Number(c.id_tipo_cancha)) ?? null : null;

      const eff = direct ?? fromDefault;
      if (eff != null && Number.isFinite(eff)) {
        canchaTarifario.set(c.id_cancha, eff);
        tarifariosSet.add(eff);
      }
    }

    // =======================
    // 5) RANGO HORARIO DINÁMICO SEGÚN REGLAS (SEGMENTO PUBLICO)
    // =======================
    const dow = weekday0Sun(fecha);

    let minStart = 8 * 60;
    let maxEnd = 26 * 60;

    if (tarifariosSet.size > 0) {
      const tarifarios = Array.from(tarifariosSet.values());

      const { data: reglasRaw, error: rErr } = await supabaseAdmin
        .from("canchas_tarifas_reglas")
        .select("hora_desde,hora_hasta,cruza_medianoche,dow,activo,segmento,vigente_desde,vigente_hasta,id_tarifario")
        .in("id_tarifario", tarifarios)
        .eq("activo", true)
        .eq("segmento", "publico")
        .or(`dow.is.null,dow.eq.${dow}`)
        .lte("vigente_desde", fecha)
        .or(`vigente_hasta.is.null,vigente_hasta.gte.${fecha}`);

      if (rErr) {
        return NextResponse.json({ error: `Error leyendo reglas: ${rErr.message}` }, { status: 500 });
      }

      const reglas = (reglasRaw || []) as unknown as Array<ReglaRow>;

      if (reglas.length > 0) {
        let localMin = Number.POSITIVE_INFINITY;
        let localMax = 0;

        for (const rr of reglas) {
          const from = toMin(rr.hora_desde);
          const toBase = toMin(rr.hora_hasta);

          const crosses = !!rr.cruza_medianoche || toBase <= from;
          const to = crosses ? toBase + 1440 : toBase;

          if (Number.isFinite(from)) localMin = Math.min(localMin, from);
          if (Number.isFinite(to)) localMax = Math.max(localMax, to);
        }

        if (Number.isFinite(localMin) && localMin !== Number.POSITIVE_INFINITY) minStart = localMin;
        if (Number.isFinite(localMax) && localMax > 0) maxEnd = localMax;

        minStart = roundDownToHalfHour(minStart);
        maxEnd = roundUpToHalfHour(maxEnd);

        if (maxEnd <= minStart) {
          minStart = 8 * 60;
          maxEnd = 26 * 60;
        }
      }
    }

    const startHour = minToHourDecimal(minStart);
    const endHour = minToHourDecimal(maxEnd);

    // =======================
    // 6) RESERVAS DEL RANGO (DEL MISMO CLUB)
    // =======================
    const windowStart = new Date(arMidnightISO(fecha)).toISOString();
    const windowEnd = new Date(arMidnightISO(addDaysISO(fecha, 2))).toISOString();

    const { data: reservasRaw, error: resErr } = await supabaseAdmin
      .from("reservas")
      .select(
        [
          "id_reserva",
          "id_club",
          "id_cancha",
          "id_usuario",
          "fecha",
          "inicio",
          "fin",
          "fin_dia_offset",
          "estado",
          "precio_total",
          "monto_anticipo",
          "segmento",
          "tipo_turno",
          "notas",
          "cliente_nombre",
          "cliente_telefono",
          "cliente_email",
          "inicio_ts",
          "fin_ts",
          "created_at",
        ].join(",")
      )
      .eq("id_club", id_club)
      .in("estado", ["confirmada", "pendiente_pago", "cancelada"])
      .lt("inicio_ts", windowEnd)
      .gt("fin_ts", windowStart)
      .order("inicio_ts", { ascending: true });

    if (resErr) {
      return NextResponse.json({ error: `Error leyendo reservas: ${resErr.message}` }, { status: 500 });
    }

    const reservas = (reservasRaw ?? []) as unknown as ReservaRow[];

    // =======================
    // 7) PROFILES DE USUARIOS INVOLUCRADOS
    // =======================
    const userIds = Array.from(new Set(reservas.map((r) => r.id_usuario).filter(Boolean) as string[]));
    const profilesMap = new Map<string, ProfileRow>();

    if (userIds.length > 0) {
      const { data: profRaw, error: pErr } = await supabaseAdmin
        .from("profiles")
        .select("id_usuario,nombre,apellido,telefono,email")
        .in("id_usuario", userIds);

      if (pErr) {
        return NextResponse.json({ error: `Error leyendo profiles: ${pErr.message}` }, { status: 500 });
      }

      for (const p of (profRaw ?? []) as unknown as ProfileRow[]) {
        profilesMap.set(p.id_usuario, p);
      }
    }

    // =======================
    // 8) PAGOS APROBADOS (SOLO DE ESTE CLUB)
    // =======================
    const reservaIds = reservas.map((r) => Number(r.id_reserva)).filter((n) => Number.isFinite(n));
    const paidMap = new Map<number, number>();

    if (reservaIds.length > 0) {
      const { data: pagosRaw, error: payErr } = await supabaseAdmin
        .from("reservas_pagos")
        .select("id_reserva,status,amount,id_club")
        .in("id_reserva", reservaIds)
        .eq("id_club", id_club)
        .eq("status", "approved");

      if (payErr) {
        return NextResponse.json({ error: `Error leyendo pagos: ${payErr.message}` }, { status: 500 });
      }

      for (const row of pagosRaw || []) {
        const rid = Number((row as any).id_reserva);
        const amt = Number((row as any).amount || 0);
        if (!Number.isFinite(rid) || !Number.isFinite(amt)) continue;
        paidMap.set(rid, (paidMap.get(rid) || 0) + amt);
      }
    }

    // =======================
    // 9) OUTPUT
    // =======================
    const canchasOut = canchas.map((c, idx) => ({
      id_cancha: c.id_cancha,
      nombre: c.nombre,
      descripcion: c.descripcion,
      imagen_url: c.imagen_url,
      es_exterior: !!c.es_exterior,
      theme: pickThemeByIndex(idx),
      id_tarifario: canchaTarifario.get(c.id_cancha) ?? null,
    }));

    const reservasOut = reservas.map((r) => {
      const prof = r.id_usuario ? profilesMap.get(r.id_usuario) : null;

      const nombreFromProfile = prof ? [prof.nombre, prof.apellido].filter(Boolean).join(" ").trim() : "";
      const cliente_nombre = (r.cliente_nombre || nombreFromProfile || "").trim() || "Sin nombre";
      const cliente_telefono = (r.cliente_telefono || prof?.telefono || "").trim();
      const cliente_email = (r.cliente_email || prof?.email || "").trim();

      const pagado = paidMap.get(Number(r.id_reserva)) || 0;
      const precio = Number(r.precio_total || 0);
      const saldo = Math.max(0, precio - pagado);

      return {
        id_reserva: r.id_reserva,
        id_cancha: r.id_cancha,
        fecha: r.fecha,
        horaInicio: String(r.inicio).slice(0, 5),
        horaFin: String(r.fin).slice(0, 5),
        fin_dia_offset: Number(r.fin_dia_offset || 0),
        estado: r.estado,
        precio_total: precio,
        monto_anticipo: Number(r.monto_anticipo || 0),
        segmento: r.segmento,
        tipo_turno: r.tipo_turno || "normal",
        notas: r.notas || null,
        cliente_nombre,
        cliente_telefono,
        cliente_email,
        pagos_aprobados_total: pagado,
        saldo_pendiente: saldo,
        inicio_ts: r.inicio_ts,
        fin_ts: r.fin_ts,
      };
    });

    return NextResponse.json({
      ok: true,
      id_club,
      fecha,
      startHour,
      endHour,
      canchas: canchasOut,
      reservas: reservasOut,
    });
  } catch (e: any) {
    console.error("[GET /api/admin/agenda] ex:", e);
    return NextResponse.json({ error: e?.message || "Error interno" }, { status: 500 });
  }
}
