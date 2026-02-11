import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// --- TIPOS INTERNOS ---
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
  theme?: string;
};

type HorarioDb = {
  id_club: number;
  dow: number;
  abre: string;
  cierra: string;
  cruza_medianoche: boolean;
  activo: boolean;
};

// --- HELPERS ---
function buildOpenInterval(h: HorarioDb): { start: number; end: number } {
  const start = toMin(h.abre);
  const endBase = toMin(h.cierra);
  const endBaseFixed =
    !h.cruza_medianoche && endBase === 0 && start > 0 ? 1440 : endBase;
  const crosses = !!h.cruza_medianoche || endBaseFixed <= start;
  const end = crosses ? endBaseFixed + 1440 : endBaseFixed;
  return { start, end };
}

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

function toMin(hhmmss: string) {
  const s = (hhmmss || "").slice(0, 5);
  const [h, m] = s.split(":").map((x) => Number(x));
  return h * 60 + (m || 0);
}

function weekday0Sun(fechaISO: string) {
  const d = new Date(`${fechaISO}T00:00:00`);
  return d.getDay();
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

function minToHHMM(min: number) {
  const m = ((min % 1440) + 1440) % 1440;
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function pickThemeByIndex(idx: number) {
  const themes = ["blue", "purple", "green", "orange", "rose"] as const;
  return themes[idx % themes.length];
}

function parseHost(req: Request) {
  const raw = (
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    ""
  ).toLowerCase();
  return raw.split(":")[0];
}

function getSubdomain(hostNoPort: string) {
  const parts = hostNoPort.split(".").filter(Boolean);
  if (parts.length < 2) return null;
  if (parts[parts.length - 1] === "localhost") return parts[0] ?? null;
  if (parts.length >= 3) return parts[0];
  return null;
}

async function resolveClubIdBySubdomain(sub: string): Promise<number | null> {
  if (!sub || sub === "www") return null;
  const { data } = await supabaseAdmin
    .from("clubes")
    .select("id_club")
    .eq("subdominio", sub)
    .maybeSingle();
  return data?.id_club ? Number(data.id_club) : null;
}

async function assertAdminOrStaff(params: { id_club: number; userId: string }) {
  const { id_club, userId } = params;
  const { data, error } = await supabaseAdmin
    .from("club_usuarios")
    .select("id_usuario, id_club, roles!inner(nombre)")
    .eq("id_club", id_club)
    .eq("id_usuario", userId)
    .in("roles.nombre", ["admin", "cajero"])
    .limit(1);
  if (error) return { ok: false as const, status: 500, error: `Error DB` };
  if (!data || data.length === 0)
    return { ok: false as const, status: 403, error: "Sin permisos" };
  return { ok: true as const };
}

function parseTsAR(ts: string) {
  const s = String(ts || "");
  if (/[zZ]$/.test(s) || /[+\-]\d{2}:\d{2}$/.test(s))
    return new Date(s).getTime();
  return new Date(`${s}-03:00`).getTime();
}

// --- MAIN HANDLER ---
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fecha = searchParams.get("fecha") || arDateISO(new Date());

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha))
      return NextResponse.json({ error: "fecha inválida" }, { status: 400 });

    const hostNoPort = parseHost(req);
    const sub = getSubdomain(hostNoPort);
    const clubFromSub = sub ? await resolveClubIdBySubdomain(sub) : null;
    const idClubFromQuery = Number(searchParams.get("id_club"));
    const id_club =
      clubFromSub ??
      (Number.isFinite(idClubFromQuery) && idClubFromQuery > 0
        ? idClubFromQuery
        : null);

    if (!id_club)
      return NextResponse.json(
        { error: "No se pudo resolver el club" },
        { status: 400 },
      );

    const supabase = await getSupabaseServerClient();
    const { data: authRes, error: aErr } = await supabase.auth.getUser();
    if (aErr || !authRes?.user?.id)
      return NextResponse.json({ error: "LOGIN_REQUERIDO" }, { status: 401 });
    const userId = authRes.user.id;

    const perm = await assertAdminOrStaff({ id_club, userId });
    if (!perm.ok)
      return NextResponse.json({ error: perm.error }, { status: perm.status });

    // 1. Obtener datos base (Canchas, Cierres y Reservas Planas)
    const [canchasRes, cierresRes, reservasRes] = await Promise.all([
      supabaseAdmin
        .from("canchas")
        .select("*")
        .eq("id_club", id_club)
        .eq("activa", true)
        .order("id_cancha"),
      supabaseAdmin
        .from("club_cierres")
        .select("id_cierre, id_cancha, inicio, fin, motivo")
        .eq("id_club", id_club)
        .eq("fecha", fecha)
        .eq("activo", true),
      supabaseAdmin
        .from("reservas")
        .select(
          `
          id_reserva, id_cancha, id_usuario, id_cliente_manual, 
          fecha, inicio, fin, fin_dia_offset, estado, precio_total, notas, origen, inicio_ts, fin_ts,
          reservas_pagos ( amount, status )
        `,
        )
        .eq("id_club", id_club)
        .in("estado", ["confirmada", "pendiente_pago"])
        .eq("fecha", fecha),
    ]);

    const canchas = canchasRes.data || [];
    const cierres = cierresRes.data || [];
    const reservasRaw = reservasRes.data || [];

    // 2. Resolver Identidades de Clientes (Consultas paralelas para evitar error PGRST200)
    const idsUsuarios = Array.from(
      new Set(reservasRaw.map((r) => r.id_usuario).filter(Boolean)),
    );
    const idsManuales = Array.from(
      new Set(reservasRaw.map((r) => r.id_cliente_manual).filter(Boolean)),
    );

    const [profilesRes, manualesRes] = await Promise.all([
      idsUsuarios.length > 0
        ? supabaseAdmin
            .from("profiles")
            .select("id_usuario, nombre, apellido, telefono, email")
            .in("id_usuario", idsUsuarios)
        : Promise.resolve({ data: [] }),
      idsManuales.length > 0
        ? supabaseAdmin
            .from("clientes_manuales")
            .select("id_cliente, nombre, telefono, email")
            .in("id_cliente", idsManuales)
        : Promise.resolve({ data: [] }),
    ]);

    const profilesMap = new Map(
      profilesRes.data?.map((p) => [p.id_usuario, p]),
    );
    const manualesMap = new Map(
      manualesRes.data?.map((m) => [m.id_cliente, m]),
    );

    // 3. Lógica de Horarios para la grilla
    const dow = weekday0Sun(fecha);
    const { data: horariosRaw } = await supabaseAdmin
      .from("club_horarios")
      .select("*")
      .eq("id_club", id_club)
      .eq("activo", true);
    const horarioDelDia = (horariosRaw || []).find(
      (h: any) => Number(h.dow) === dow,
    );

    let minStart = 8 * 60,
      maxEnd = 26 * 60;
    if (horarioDelDia) {
      const open = buildOpenInterval(horarioDelDia as any);
      minStart = roundDownToHalfHour(open.start);
      maxEnd = roundUpToHalfHour(open.end);
    }

    // 4. Formatear Canchas y Cierres
    const canchasOut = canchas.map((c, idx) => ({
      ...c,
      es_exterior: !!c.es_exterior,
      theme: pickThemeByIndex(idx),
      cierres: cierres
        .filter(
          (cie: any) => cie.id_cancha === c.id_cancha || cie.id_cancha === null,
        )
        .map((cie: any) => ({
          id_cierre: cie.id_cierre,
          inicio: cie.inicio
            ? String(cie.inicio).slice(0, 5)
            : minToHHMM(minStart),
          fin: cie.fin ? String(cie.fin).slice(0, 5) : minToHHMM(maxEnd),
          motivo: cie.motivo?.trim() || null,
        })),
    }));

    // 5. Formatear Reservas con Identidades Limpias
    const reservasOut = reservasRaw.map((r: any) => {
      let clienteNombre = "Invitado";
      let clienteTel = "";
      let clienteEmail = "";

      if (r.id_usuario) {
        const p = profilesMap.get(r.id_usuario);
        if (p) {
          clienteNombre = `${p.nombre || ""} ${p.apellido || ""}`.trim();
          clienteTel = p.telefono || "";
          clienteEmail = p.email || "";
        }
      } else if (r.id_cliente_manual) {
        const m = manualesMap.get(r.id_cliente_manual);
        if (m) {
          clienteNombre = m.nombre || "Cliente";
          clienteTel = m.telefono || "";
          clienteEmail = m.email || "";
        }
      }

      const totalPagado =
        r.reservas_pagos
          ?.filter((p: any) => p.status === "approved")
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;

      return {
        id_reserva: r.id_reserva,
        id_cancha: r.id_cancha,
        fecha: r.fecha,
        horaInicio: String(r.inicio).slice(0, 5),
        horaFin: String(r.fin).slice(0, 5),
        estado: r.estado,
        precio_total: Number(r.precio_total || 0),
        saldo_pendiente: Math.max(0, Number(r.precio_total || 0) - totalPagado),
        cliente_nombre: clienteNombre, // ✅ Nombres limpios sin etiquetas
        cliente_telefono: clienteTel,
        cliente_email: clienteEmail,
        notas: r.notas || "",
        origen: r.origen || "web",
      };
    });

    const res = NextResponse.json({
      ok: true,
      id_club,
      fecha,
      startHour: minToHourDecimal(minStart),
      endHour: minToHourDecimal(maxEnd),
      canchas: canchasOut,
      reservas: reservasOut,
    });
    res.headers.set("Cache-Control", "no-store, no-cache, max-age=0");
    return res;
  } catch (e: any) {
    console.error("[GET /api/admin/agenda] ex:", e);
    return NextResponse.json(
      { error: e?.message || "Error interno" },
      { status: 500 },
    );
  }
}
