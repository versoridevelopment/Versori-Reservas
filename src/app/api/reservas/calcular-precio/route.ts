import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Segmento = "publico" | "profe";

type Body = {
  id_club: number;
  id_cancha: number;
  fecha: string; // YYYY-MM-DD (fecha REAL del request)
  inicio: string; // HH:MM
  fin: string; // HH:MM
  segmento_override?: Segmento; // ✅ (para admin)
};

type Regla = {
  id_regla: number;
  id_tarifario: number;
  segmento: Segmento;
  dow: number | null; // 0=Dom..6=Sáb
  vigente_desde: string;
  vigente_hasta: string | null;
  hora_desde: string; // HH:MM:SS
  hora_hasta: string; // HH:MM:SS
  cruza_medianoche: boolean;
  duracion_min: number;
  precio: number;
  prioridad: number;
  activo: boolean;
};

// ✅ Duraciones soportadas por el motor (pero NO vamos a exigir que existan todas en DB)
const SUPPORTED_DURS = [30, 60, 90, 120, 150, 180, 210, 240] as const;
type Dur = (typeof SUPPORTED_DURS)[number];

// ✅ Duración canónica para detectar cambios de tarifario (clave)
// (si un segmento no tiene 60, podés cambiar a 30, pero en padel normalmente existe 60)
const CANON_DUR: Dur = 60;

function emptyReglasMap(): Record<Dur, Regla[]> {
  return SUPPORTED_DURS.reduce((acc, d) => {
    acc[d] = [];
    return acc;
  }, {} as Record<Dur, Regla[]>);
}

function toMin(hhmm: string) {
  const [h, m] = (hhmm || "").slice(0, 5).split(":").map(Number);
  return h * 60 + (m || 0);
}

function timeToMinFromDB(hms: string) {
  return toMin((hms || "").slice(0, 5));
}

// ✅ AR timezone safe
function weekday0Sun(fechaISO: string) {
  const d = new Date(`${fechaISO}T00:00:00-03:00`);
  return d.getDay(); // 0..6
}

function addDaysISO(dateISO: string, add: number) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const dt = new Date(y, m - 1, d + add);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

// ¿inicio cae dentro de ventana?
function startInWindow(params: {
  startMin: number; // 0..1439
  fromMin: number; // 0..1439
  toMin: number; // 0..1439
  cruza_medianoche: boolean;
}) {
  const { startMin, fromMin, toMin, cruza_medianoche } = params;
  const crosses = cruza_medianoche || toMin <= fromMin;
  if (!crosses) return startMin >= fromMin && startMin < toMin;
  // cruza: [from..1440) U [0..to)
  return startMin >= fromMin || startMin < toMin;
}

function pickBestRuleForStart(params: {
  reglas: Regla[];
  startMinInDay: number; // 0..1439
  dow: number; // 0..6
}) {
  const { reglas, startMinInDay, dow } = params;

  const matches = reglas.filter((r) => {
    if (r.dow !== null && Number(r.dow) !== dow) return false;
    const from = timeToMinFromDB(r.hora_desde);
    const to = timeToMinFromDB(r.hora_hasta);
    return startInWindow({
      startMin: startMinInDay,
      fromMin: from,
      toMin: to,
      cruza_medianoche: !!r.cruza_medianoche,
    });
  });

  if (matches.length === 0) return null;

  matches.sort((a, b) => {
    if (Number(b.prioridad) !== Number(a.prioridad))
      return Number(b.prioridad) - Number(a.prioridad);
    // tie-break: dow específico > dow null
    const aSpec = a.dow === null ? 0 : 1;
    const bSpec = b.dow === null ? 0 : 1;
    return bSpec - aSpec;
  });

  return matches[0];
}

async function resolveSegmentoForUser(params: {
  userId: string | null;
  id_club: number;
}): Promise<Segmento> {
  const { userId, id_club } = params;
  if (!userId) return "publico";

  const { data, error } = await supabaseAdmin
    .from("club_usuarios")
    .select("id_usuario,id_club,roles!inner(nombre)")
    .eq("id_usuario", userId)
    .eq("id_club", id_club)
    .eq("roles.nombre", "profe")
    .limit(1);

  if (error) {
    console.error("[resolveSegmentoForUser] error:", error);
    return "publico";
  }

  return (data || []).length > 0 ? "profe" : "publico";
}

async function resolveTarifarioId(id_club: number, id_cancha: number) {
  const { data: cancha, error: cErr } = await supabaseAdmin
    .from("canchas")
    .select("id_cancha,id_club,id_tipo_cancha,id_tarifario")
    .eq("id_cancha", id_cancha)
    .eq("id_club", id_club)
    .maybeSingle();

  if (cErr) throw cErr;
  if (!cancha) return { error: "Cancha no encontrada para este club" as const };

  if (cancha.id_tarifario) {
    return {
      id_tarifario: Number(cancha.id_tarifario),
      id_tipo_cancha: Number(cancha.id_tipo_cancha),
    };
  }

  const { data: def, error: dErr } = await supabaseAdmin
    .from("club_tarifarios_default")
    .select("id_tarifario")
    .eq("id_club", id_club)
    .eq("id_tipo_cancha", cancha.id_tipo_cancha)
    .maybeSingle();

  if (dErr) throw dErr;

  if (def?.id_tarifario) {
    return {
      id_tarifario: Number(def.id_tarifario),
      id_tipo_cancha: Number(cancha.id_tipo_cancha),
    };
  }

  return { error: "No hay tarifario asignado (cancha ni default por tipo)" as const };
}

/**
 * Devuelve qué duraciones existen en DB para ese (tarifario, segmento) y fecha (vigencia).
 * Importante: no asumimos que existan todas.
 */
async function fetchAvailableDurs(params: {
  id_tarifario: number;
  segmento: Segmento;
  fechaISO: string;
}): Promise<Dur[]> {
  const { id_tarifario, segmento, fechaISO } = params;

  const { data, error } = await supabaseAdmin
    .from("canchas_tarifas_reglas")
    .select("duracion_min")
    .eq("id_tarifario", id_tarifario)
    .eq("segmento", segmento)
    .eq("activo", true)
    .lte("vigente_desde", fechaISO)
    .or(`vigente_hasta.is.null,vigente_hasta.gte.${fechaISO}`);

  if (error) throw error;

  const set = new Set<number>();
  for (const r of data || []) set.add(Number((r as any).duracion_min));

  const out = SUPPORTED_DURS.filter((d) => set.has(d)) as Dur[];
  return out;
}

/**
 * Trae reglas activas de ese día para un subconjunto de duraciones.
 */
async function fetchReglasByDur(params: {
  id_tarifario: number;
  segmento: Segmento;
  fechaISO: string;
  dursToFetch: Dur[];
}) {
  const { id_tarifario, segmento, fechaISO, dursToFetch } = params;

  const out = emptyReglasMap();
  if (dursToFetch.length === 0) return out;

  const { data, error } = await supabaseAdmin
    .from("canchas_tarifas_reglas")
    .select("*")
    .eq("id_tarifario", id_tarifario)
    .eq("segmento", segmento)
    .in("duracion_min", dursToFetch)
    .eq("activo", true)
    .lte("vigente_desde", fechaISO)
    .or(`vigente_hasta.is.null,vigente_hasta.gte.${fechaISO}`)
    .order("prioridad", { ascending: false });

  if (error) throw error;

  for (const r of (data || []) as Regla[]) {
    const d = Number(r.duracion_min) as Dur;
    if (SUPPORTED_DURS.includes(d)) out[d].push(r);
  }

  return out;
}

function fmtHHMM(minInDay: number) {
  const hh = String(Math.floor(minInDay / 60)).padStart(2, "0");
  const mm = String(minInDay % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * ✅ Detecta “día lógico anterior” para la madrugada.
 * Usa CANON_DUR (60) para detectar carry.
 */
function findPrevCarryWindow(params: {
  startMin: number; // 0..1439
  reglasBase_prev: Regla[];
  dowPrev: number;
}) {
  const { startMin, reglasBase_prev, dowPrev } = params;

  const candidates = reglasBase_prev.filter((r) => {
    if (r.dow !== null && Number(r.dow) !== dowPrev) return false;

    const from = timeToMinFromDB(r.hora_desde);
    const to = timeToMinFromDB(r.hora_hasta);
    const crosses = !!r.cruza_medianoche || to <= from;
    if (!crosses) return false;

    return startInWindow({
      startMin,
      fromMin: from,
      toMin: to,
      cruza_medianoche: true,
    });
  });

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => Number(b.prioridad) - Number(a.prioridad));
  const best = candidates[0];

  const cutoffEnd = timeToMinFromDB(best.hora_hasta); // ej 03:00 => 180
  return {
    ruleBase: best,
    cutoffEnd, // 0..1439
  };
}

/**
 * DP exacto para minutos múltiplos de 30 usando SOLO las duraciones disponibles (pieces).
 */
function dpComposeCost(params: {
  minutes: number;
  pricesByDur: Partial<Record<Dur, number>>;
  allowedPieces: Dur[];
}) {
  const { minutes, pricesByDur, allowedPieces } = params;

  if (minutes % 30 !== 0)
    return { ok: false as const, cost: 0, composition: [] as number[] };

  const steps = minutes / 30;
  const INF = 1e18;
  const dp = new Array<number>(steps + 1).fill(INF);
  const prev = new Array<{ i: number; dur: number } | null>(steps + 1).fill(null);
  dp[0] = 0;

  const pieces: Array<{ take: number; cost: number; dur: Dur }> = [];

  for (const d of allowedPieces) {
    const take = d / 30;
    const cost = pricesByDur[d];
    if (!Number.isInteger(take) || typeof cost !== "number") continue;
    pieces.push({ take, cost, dur: d });
  }

  for (let i = 0; i <= steps; i++) {
    if (dp[i] >= INF) continue;
    for (const p of pieces) {
      const j = i + p.take;
      if (j > steps) continue;
      const v = dp[i] + p.cost;
      if (v < dp[j]) {
        dp[j] = v;
        prev[j] = { i, dur: p.dur };
      }
    }
  }

  if (dp[steps] >= INF)
    return { ok: false as const, cost: 0, composition: [] as number[] };

  const comp: number[] = [];
  let cur = steps;
  while (cur > 0) {
    const p = prev[cur];
    if (!p) break;
    comp.push(p.dur);
    cur = p.i;
  }
  comp.reverse();

  return { ok: true as const, cost: dp[steps], composition: comp };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Body | null;

    const id_club = Number(body?.id_club);
    const id_cancha = Number(body?.id_cancha);
    const fecha = String(body?.fecha || "");
    const inicio = String(body?.inicio || "");
    const fin = String(body?.fin || "");

    if (!id_club || Number.isNaN(id_club))
      return NextResponse.json({ error: "id_club es requerido y numérico" }, { status: 400 });
    if (!id_cancha || Number.isNaN(id_cancha))
      return NextResponse.json({ error: "id_cancha es requerido y numérico" }, { status: 400 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha))
      return NextResponse.json({ error: "fecha debe ser YYYY-MM-DD" }, { status: 400 });
    if (!/^\d{2}:\d{2}$/.test(inicio) || !/^\d{2}:\d{2}$/.test(fin))
      return NextResponse.json({ error: "inicio/fin deben ser HH:MM" }, { status: 400 });

    const startMin = toMin(inicio);
    let endMin = toMin(fin);
    if (endMin <= startMin) endMin += 1440;

    const duracion_min = endMin - startMin;

    // ✅ auth + segmento (con override)
    const sb = await getSupabaseServerClient();
    const { data: auth } = await sb.auth.getUser();
    const userId = auth?.user?.id ?? null;

    const segOverride = body?.segmento_override;
    const segmento: Segmento =
      segOverride === "publico" || segOverride === "profe"
        ? segOverride
        : await resolveSegmentoForUser({ userId, id_club });

    // tarifario
    const resolved = await resolveTarifarioId(id_club, id_cancha);
    if ("error" in resolved) return NextResponse.json({ error: resolved.error }, { status: 409 });
    const id_tarifario = resolved.id_tarifario;

    // ====== FECHAS/DOW ======
    const fecha0 = fecha;
    const dow0 = weekday0Sun(fecha0);

    const fechaPrev = addDaysISO(fecha0, -1);
    const dowPrev = (dow0 + 6) % 7;

    const needsNextDay = endMin > 1440;
    const fecha1 = needsNextDay ? addDaysISO(fecha0, 1) : null;
    const dow1 = needsNextDay ? (dow0 + 1) % 7 : null;

    // ====== Duraciones disponibles (por vigencia) ======
    // Unimos durs de prev/day0/day1 para no romper en cruces de medianoche
    const dursPrev = await fetchAvailableDurs({ id_tarifario, segmento, fechaISO: fechaPrev });
    const durs0 = await fetchAvailableDurs({ id_tarifario, segmento, fechaISO: fecha0 });
    const durs1 =
      needsNextDay && fecha1
        ? await fetchAvailableDurs({ id_tarifario, segmento, fechaISO: fecha1 })
        : [];

    const availableSet = new Set<Dur>([...dursPrev, ...durs0, ...durs1]);

    // ✅ Duraciones mínimas que SI o SI necesitamos:
    // - CANON_DUR para detectar cambios
    // - la duración solicitada (si está soportada por el motor)
    if (!availableSet.has(CANON_DUR)) {
      return NextResponse.json(
        {
          error: `No hay reglas de ${CANON_DUR} min para segmento=${segmento}. Necesaria para detectar cambios de franja.`,
          segmento,
          id_tarifario,
        },
        { status: 409 }
      );
    }

    const durReq = duracion_min as Dur;
    if (!SUPPORTED_DURS.includes(durReq)) {
      return NextResponse.json(
        { error: `Duración no soportada (${SUPPORTED_DURS.join("/")})`, duracion_min },
        { status: 400 }
      );
    }

    if (!availableSet.has(durReq)) {
      return NextResponse.json(
        {
          error: `No hay tarifario para ${durReq} min en segmento=${segmento}.`,
          segmento,
          duracion_min,
          sugerencia: "Cargá reglas para esa duración en el tarifario (mismo horario/prioridad) o limita reservas a duraciones existentes.",
        },
        { status: 409 }
      );
    }

    // Para DP fallback: solo usamos piezas disponibles
    const availablePieces = Array.from(availableSet).sort((a, b) => a - b);

    // ====== REGLAS: prev / day0 / day1 (solo duraciones disponibles) ======
    const reglas_prev = await fetchReglasByDur({
      id_tarifario,
      segmento,
      fechaISO: fechaPrev,
      dursToFetch: availablePieces,
    });
    const reglas_0 = await fetchReglasByDur({
      id_tarifario,
      segmento,
      fechaISO: fecha0,
      dursToFetch: availablePieces,
    });

    const reglas_1 =
      needsNextDay && fecha1
        ? await fetchReglasByDur({
            id_tarifario,
            segmento,
            fechaISO: fecha1,
            dursToFetch: availablePieces,
          })
        : emptyReglasMap();

    // ✅ Detectar si este turno debería pertenecer al “día anterior” en madrugada (CANON_DUR)
    const prevCarry = findPrevCarryWindow({
      startMin: startMin % 1440,
      reglasBase_prev: reglas_prev[CANON_DUR],
      dowPrev,
    });

    const STEP_MIN = 30;

    // ====== selector de reglas por tiempo absoluto (por duración) ======
    function getRuleAt(tAbs: number, dur: Dur) {
      const dayIndex = tAbs >= 1440 ? 1 : 0;
      const minInDay = ((tAbs % 1440) + 1440) % 1440;

      // Caso A) day0 y cae en “madrugada del día anterior”
      if (dayIndex === 0 && prevCarry) {
        if (minInDay < prevCarry.cutoffEnd) {
          return pickBestRuleForStart({
            reglas: reglas_prev[dur],
            startMinInDay: minInDay,
            dow: dowPrev,
          });
        }
        return pickBestRuleForStart({
          reglas: reglas_0[dur],
          startMinInDay: minInDay,
          dow: dow0,
        });
      }

      // Caso B) day1 (tAbs>=1440): puede seguir perteneciendo al day0 si day0 tiene regla cruzando (CANON_DUR)
      if (dayIndex === 1) {
        if (dow1 === null) return null;

        const carryFrom0 = (() => {
          const rCanon_0 = pickBestRuleForStart({
            reglas: reglas_0[CANON_DUR],
            startMinInDay: minInDay,
            dow: dow0,
          });
          if (!rCanon_0) return null;
          const from = timeToMinFromDB(rCanon_0.hora_desde);
          const to = timeToMinFromDB(rCanon_0.hora_hasta);
          const crosses = !!rCanon_0.cruza_medianoche || to <= from;
          if (!crosses) return null;
          return minInDay < to ? true : null;
        })();

        if (carryFrom0) {
          return pickBestRuleForStart({
            reglas: reglas_0[dur],
            startMinInDay: minInDay,
            dow: dow0,
          });
        }

        return pickBestRuleForStart({
          reglas: reglas_1[dur],
          startMinInDay: minInDay,
          dow: dow1,
        });
      }

      // Default: day0 normal
      return pickBestRuleForStart({
        reglas: reglas_0[dur],
        startMinInDay: minInDay,
        dow: dow0,
      });
    }

    /**
     * ✅ Clave de franja: SOLO depende de la regla CANON_DUR.
     * Esto evita exigir 30/90/120/etc para segmento profe.
     */
    const tariffKeyAt = (tAbs: number) => {
      const rCanon = getRuleAt(tAbs, CANON_DUR);
      if (!rCanon) return { ok: false as const, missingDur: CANON_DUR };

      // En el grupo guardamos reglas solo para las duraciones disponibles (para cotizar)
      const rules: Partial<Record<Dur, Regla>> = {};
      for (const d of availablePieces) {
        const r = getRuleAt(tAbs, d);
        if (!r) return { ok: false as const, missingDur: d };
        rules[d] = r;
      }

      const key = String(rCanon.id_regla);
      return { ok: true as const, rules, key };
    };

    // ====== grupos homogéneos por key ======
    type Group = {
      startAbs: number;
      endAbs: number;
      rules: Partial<Record<Dur, Regla>>;
      key: string;
    };

    const groups: Group[] = [];
    let t = startMin;

    const first = tariffKeyAt(t);
    if (!first.ok) {
      return NextResponse.json(
        {
          error: "Faltan reglas para cubrir el inicio",
          segmento,
          missing_duracion: first.missingDur,
        },
        { status: 409 }
      );
    }

    let curStart = t;
    let curKey = first.key;
    let curRules = first.rules;

    for (; t < endMin; t += STEP_MIN) {
      const cur = tariffKeyAt(t);
      if (!cur.ok) {
        return NextResponse.json(
          {
            error: "Faltan reglas para cubrir un tramo del turno",
            segmento,
            tramo_abs: t,
            missing_duracion: cur.missingDur,
          },
          { status: 409 }
        );
      }

      if (cur.key !== curKey) {
        groups.push({ startAbs: curStart, endAbs: t, rules: curRules, key: curKey });
        curStart = t;
        curKey = cur.key;
        curRules = cur.rules;
      }
    }
    groups.push({ startAbs: curStart, endAbs: endMin, rules: curRules, key: curKey });

    // ====== si es 1 grupo: directo (exacto por duracion_min) ======
    if (groups.length === 1) {
      const direct = getRuleAt(startMin, durReq);
      if (!direct) {
        return NextResponse.json(
          {
            error: "No hay regla directa para esa duración que cubra el inicio",
            segmento,
            duracion_min,
          },
          { status: 409 }
        );
      }

      return NextResponse.json({
        ok: true,
        id_club,
        id_cancha,
        id_tarifario,
        id_regla: direct.id_regla,
        user_id: userId,
        segmento,
        fecha,
        inicio,
        fin,
        duracion_min,
        precio_total: Number(direct.precio),
        prorrateado: false,
        regla: direct,
      });
    }

    // ====== híbrido: suma por grupos ======
    let total = 0;

    const breakdown: Array<{
      desde: string;
      hasta: string;
      minutos: number;
      dayOffset: 0 | 1;
      id_regla_aplicada: number | null;
      duracion_usada: number;
      subtotal: number;
      composition?: number[];
    }> = [];

    for (const g of groups) {
      const minutes = g.endAbs - g.startAbs;

      const pricesByDur: Partial<Record<Dur, number>> = {};
      for (const d of availablePieces) {
        const rule = g.rules[d];
        if (rule) pricesByDur[d] = Number(rule.precio);
      }

      let subtotal: number;
      let id_regla_aplicada: number | null = null;
      let duracion_usada = minutes;
      let composition: number[] | undefined;

      // Caso exacto: el largo del grupo coincide con una duración disponible
      if (SUPPORTED_DURS.includes(minutes as Dur) && availableSet.has(minutes as Dur)) {
        const d = minutes as Dur;
        subtotal = pricesByDur[d] as number;
        id_regla_aplicada = (g.rules[d] as Regla).id_regla;
      } else {
        // Fallback DP: componer con piezas disponibles (si se puede)
        const dp = dpComposeCost({
          minutes,
          pricesByDur,
          allowedPieces: availablePieces,
        });

        if (!dp.ok) {
          return NextResponse.json(
            {
              error: "No se pudo componer el precio del grupo con las duraciones disponibles del segmento",
              segmento,
              minutes,
              availablePieces,
              sugerencia:
                "Cargá reglas para más duraciones (ej: 30/90/120) en el segmento o evita cortes de franja en el medio de la reserva.",
            },
            { status: 409 }
          );
        }

        subtotal = dp.cost;
        composition = dp.composition;
        id_regla_aplicada = null;
        duracion_usada = minutes;
      }

      total += subtotal;

      const dayOffset = g.startAbs >= 1440 ? 1 : 0;
      const sDay = dayOffset ? g.startAbs - 1440 : g.startAbs;
      const eDay = dayOffset ? g.endAbs - 1440 : g.endAbs;

      breakdown.push({
        desde: `${fmtHHMM(sDay)}${dayOffset ? " (+1)" : ""}`,
        hasta: `${fmtHHMM(eDay)}${dayOffset ? " (+1)" : ""}`,
        minutos: minutes,
        dayOffset: dayOffset as 0 | 1,
        id_regla_aplicada,
        duracion_usada,
        subtotal,
        ...(composition ? { composition } : {}),
      });
    }

    const precio_total = Math.round(total);

    return NextResponse.json({
      ok: true,
      id_club,
      id_cancha,
      id_tarifario,
      id_regla: null,
      user_id: userId,
      segmento,
      fecha,
      inicio,
      fin,
      duracion_min,
      precio_total,
      prorrateado: true,
      modo: "hibrido",
      breakdown,
      debug: {
        availablePieces,
        prevCarry: prevCarry
          ? {
              fechaPrev,
              dowPrev,
              cutoffEnd: prevCarry.cutoffEnd,
              id_regla_base_prev: prevCarry.ruleBase.id_regla,
            }
          : null,
        fecha0,
        dow0,
        fecha1,
        dow1,
        groups_count: groups.length,
        canon_dur: CANON_DUR,
      },
    });
  } catch (err: any) {
    console.error("[calcular-precio] ex:", err);
    return NextResponse.json({ error: err?.message || "Error interno" }, { status: 500 });
  }
}
