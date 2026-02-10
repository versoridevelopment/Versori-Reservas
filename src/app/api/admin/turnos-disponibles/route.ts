import { NextResponse } from "next/server";
import { DateTime } from "luxon";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// =====================
// Helpers (copiados del endpoint agenda, mismos criterios)
// =====================
type HorarioDb = {
  id_club: number;
  dow: number; // 0..6 (getDay)
  abre: string;
  cierra: string;
  cruza_medianoche: boolean;
  activo: boolean;
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
function toMin(hhmmss: string) {
  const s = (hhmmss || "").slice(0, 5);
  const [h, m] = s.split(":").map((x) => Number(x));
  return h * 60 + (m || 0);
}
function weekday0Sun(fechaISO: string) {
  const d = new Date(`${fechaISO}T00:00:00`);
  return d.getDay(); // 0=dom..6=sab
}
function roundDownToHalfHour(min: number) {
  return Math.floor(min / 30) * 30;
}
function roundUpToHalfHour(min: number) {
  return Math.ceil(min / 30) * 30;
}
function buildOpenInterval(h: HorarioDb): { start: number; end: number } {
  const start = toMin(h.abre);
  const endBase = toMin(h.cierra);
  const endBaseFixed =
    !h.cruza_medianoche && endBase === 0 && start > 0 ? 1440 : endBase;
  const crosses = !!h.cruza_medianoche || endBaseFixed <= start;
  const end = crosses ? endBaseFixed + 1440 : endBaseFixed;
  return { start, end };
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
  const { data, error } = await supabaseAdmin
    .from("clubes")
    .select("id_club")
    .eq("subdominio", sub)
    .maybeSingle();
  if (error) return null;
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

// solape half-open
function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && aEnd > bStart;
}
function labelSlot(dtStart: DateTime, dtEnd: DateTime) {
  const aMm = dtStart.toFormat("mm");
  const bMm = dtEnd.toFormat("mm");

  // ✅ Si ambos son en punto, mostrar HH (2 dígitos) sin ":00"
  if (aMm === "00" && bMm === "00") {
    const aH = dtStart.toFormat("HH"); // 👈 2 dígitos
    const bH = dtEnd.toFormat("HH");   // 👈 2 dígitos
    return `${aH} - ${bH}`;
  }

  // Caso general
  return `${dtStart.toFormat("HH:mm")} - ${dtEnd.toFormat("HH:mm")}`;
}


// =====================
// GET /api/admin/turnos-disponibles?fecha=YYYY-MM-DD&duracion=60&cancha_ids=1,2,3
// (id_club se resuelve igual que agenda)
// =====================
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const fecha = searchParams.get("fecha") || arDateISO(new Date());
    const duracion = Number(searchParams.get("duracion") || "60");
    const canchaIdsParam = (searchParams.get("cancha_ids") || "").trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha))
      return NextResponse.json({ error: "fecha inválida" }, { status: 400 });
    if (!Number.isFinite(duracion) || duracion < 30 || duracion > 240)
      return NextResponse.json({ error: "duracion inválida (30..240)" }, { status: 400 });
    if (!canchaIdsParam)
      return NextResponse.json({ error: "cancha_ids requerido" }, { status: 400 });

    const cancha_ids = canchaIdsParam
      .split(",")
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n) && n > 0);

    if (cancha_ids.length === 0)
      return NextResponse.json({ error: "cancha_ids vacío" }, { status: 400 });

    // 1) Resolver club (igual que agenda)
    const hostNoPort = parseHost(req);
    const sub = getSubdomain(hostNoPort);
    const clubFromSub = sub ? await resolveClubIdBySubdomain(sub) : null;
    const idClubFromQuery = Number(searchParams.get("id_club"));
    const id_club =
      clubFromSub ??
      (Number.isFinite(idClubFromQuery) && idClubFromQuery > 0 ? idClubFromQuery : null);

    if (!id_club)
      return NextResponse.json({ error: "No se pudo resolver el club" }, { status: 400 });

    // 2) Auth (igual que agenda)
    const supabase = await getSupabaseServerClient();
    const { data: authRes, error: aErr } = await supabase.auth.getUser();
    if (aErr || !authRes?.user?.id)
      return NextResponse.json({ error: "LOGIN_REQUERIDO" }, { status: 401 });
    const userId = authRes.user.id;

    // 3) Permisos (igual que agenda)
    const perm = await assertAdminOrStaff({ id_club, userId });
    if (!perm.ok)
      return NextResponse.json({ error: perm.error }, { status: perm.status });

    const dow = DateTime.fromISO(fecha, {
    zone: "America/Argentina/Buenos_Aires",
    }).weekday % 7;

    const { data: horariosRaw, error: hErr } = await supabaseAdmin
      .from("club_horarios")
      .select("id_club,dow,abre,cierra,cruza_medianoche,activo")
      .eq("id_club", id_club)
      .eq("activo", true);

    if (hErr) return NextResponse.json({ error: hErr.message }, { status: 500 });

    const horarios = (horariosRaw || []) as HorarioDb[];
    const horarioDelDia = horarios.find((h) => Number(h.dow) === dow);

    // fallback razonable si no hay horario configurado
    let minStart = 8 * 60;
    let maxEnd = 26 * 60;

    if (horarioDelDia) {
      const open = buildOpenInterval(horarioDelDia);
      minStart = roundDownToHalfHour(open.start);
      maxEnd = roundUpToHalfHour(open.end);
      if (maxEnd <= minStart) {
        minStart = 8 * 60;
        maxEnd = 26 * 60;
      }
    }

    // 5) Ventana real para buscar reservas (igual criterio que agenda)
    const dayStartMs = new Date(arMidnightISO(fecha)).getTime();
    const windowStartMs = dayStartMs;
    const windowEndMs = dayStartMs + maxEnd * 60_000;

    const windowStartISO = new Date(windowStartMs).toISOString();
    const windowEndISO = new Date(windowEndMs).toISOString();

    // 6) Leer reservas activas (estado TEXT, como agenda)
    const { data: reservasRaw, error: rErr } = await supabaseAdmin
      .from("reservas")
      .select("id_cancha,inicio_ts,fin_ts,estado")
      .eq("id_club", id_club)
      .in("estado", ["confirmada", "pendiente_pago"])
      .in("id_cancha", cancha_ids)
      .lt("inicio_ts", windowEndISO)
      .gt("fin_ts", windowStartISO);

    if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });

    // 7) Generar slots por cancha (duración fija)
    const zone = "America/Argentina/Buenos_Aires";
    const base = DateTime.fromISO(`${fecha}T00:00:00`, { zone });

    const rangeStart = base.plus({ minutes: minStart });
    const rangeEnd = base.plus({ minutes: maxEnd });

    const reservas = (reservasRaw || []).map((r: any) => ({
      id_cancha: Number(r.id_cancha),
      inicio_ms: DateTime.fromISO(String(r.inicio_ts)).toMillis(),
      fin_ms: DateTime.fromISO(String(r.fin_ts)).toMillis(),
    }));

    const slots: Record<number, string[]> = {};
    for (const cid of cancha_ids) slots[cid] = [];

    for (const cid of cancha_ids) {
      let cursor = rangeStart;

      const rs = reservas.filter((x) => x.id_cancha === cid);

      while (cursor.plus({ minutes: duracion }) <= rangeEnd) {
        const s = cursor;
        const e = cursor.plus({ minutes: duracion });

        const sMs = s.toUTC().toMillis();
        const eMs = e.toUTC().toMillis();

        const ocupado = rs.some((r) => overlaps(sMs, eMs, r.inicio_ms, r.fin_ms));
        if (!ocupado) slots[cid].push(labelSlot(s, e));

        cursor = cursor.plus({ minutes: duracion });
      }
    }

    const dayTitle = base.setLocale("es").toFormat("cccc").toUpperCase();

    const res = NextResponse.json({
      ok: true,
      id_club,
      fecha,
      duracion_min: duracion,
      minStart,
      maxEnd,
      dayTitle,
      slots,
    });
    res.headers.set("Cache-Control", "no-store, no-cache, max-age=0");
    return res;
  } catch (e: any) {
    console.error("[GET /api/admin/turnos-disponibles] ex:", e);
    return NextResponse.json(
      { error: e?.message || "Error interno" },
      { status: 500 }
    );
  }
}
