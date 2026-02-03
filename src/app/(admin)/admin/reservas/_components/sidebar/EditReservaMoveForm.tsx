"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import type { CanchaUI, ReservaUI } from "../types";
import { formatMoney } from "../hooks/useReservaSidebar";

// ===== Helpers (copiados de tu hook) =====
function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toISODateLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// "HH:MM" -> decimal, respetando ventana startHour..endHour
function hhmmToDecimal(hhmm: string, startHour: number) {
  const [h, m] = (hhmm || "").slice(0, 5).split(":").map(Number);
  let dec = (h || 0) + (m || 0) / 60;
  if (dec < startHour) dec += 24; // pertenece al día+1 dentro de la ventana
  return dec;
}

function addMinutesHHMM(hhmm: string, addMin: number) {
  const [h, m] = (hhmm || "").slice(0, 5).split(":").map(Number);
  let total = (h || 0) * 60 + (m || 0) + (addMin || 0);
  total = ((total % 1440) + 1440) % 1440;
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

type IntervalU = { startU: number; endU: number };
type FreeBlockU = { startU: number; endU: number };

function toUnits30(hours: number) {
  return Math.round(hours * 2);
}

function unitsToHHMM(u: number) {
  const mins = u * 30;
  const total = ((mins % 1440) + 1440) % 1440;
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${pad2(hh)}:${pad2(mm)}`;
}

function buildFreeBlocks(dayStartU: number, dayEndU: number, occupiedU: IntervalU[]): FreeBlockU[] {
  if (dayEndU <= dayStartU) return [];

  const occ = occupiedU
    .map((x) => ({
      startU: Math.max(dayStartU, x.startU),
      endU: Math.min(dayEndU, x.endU),
    }))
    .filter((x) => x.endU > x.startU)
    .sort((a, b) => a.startU - b.startU);

  const merged: IntervalU[] = [];
  for (const it of occ) {
    const last = merged[merged.length - 1];
    if (!last || it.startU > last.endU) merged.push({ ...it });
    else last.endU = Math.max(last.endU, it.endU);
  }

  const free: FreeBlockU[] = [];
  let cursor = dayStartU;

  for (const it of merged) {
    if (it.startU > cursor) free.push({ startU: cursor, endU: it.startU });
    cursor = Math.max(cursor, it.endU);
  }
  if (cursor < dayEndU) free.push({ startU: cursor, endU: dayEndU });

  return free;
}

// ✅ regla “no dejar 30 colgados”
function noDangling30(block: FreeBlockU, startU: number, endU: number) {
  const leftU = startU - block.startU;
  const rightU = block.endU - endU;
  if (leftU === 1) return false;
  if (rightU === 1) return false;
  return true;
}

// ===== Props =====
type Props = {
  reserva: ReservaUI;
  idClub: number;
  canchas: CanchaUI[];
  reservas: ReservaUI[];
  startHour?: number;
  endHour?: number;
  onCancel: () => void;
  onSaved: () => void; // refresca agenda y/o cierra
};

export default function EditReservaMoveForm({
  reserva,
  idClub,
  canchas,
  reservas,
  startHour = 8,
  endHour = 26,
  onCancel,
  onSaved,
}: Props) {
  const fechaInit = reserva.fecha || toISODateLocal(new Date());

  const [idCancha, setIdCancha] = useState<number>(Number(reserva.id_cancha));
  const [fecha, setFecha] = useState<string>(fechaInit);

  // duración fija: se calcula con datos de la reserva (incluye fin_dia_offset)
  const duracionMin = useMemo(() => {
    const toMin = (hhmm: string) => {
      const [h, m] = (hhmm || "").slice(0, 5).split(":").map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const s = toMin(reserva.horaInicio || "00:00");
    let e = toMin(reserva.horaFin || "00:00");
    const off = Number((reserva as any).fin_dia_offset || 0);
    if (off === 1 || e <= s) e += 1440;
    return e - s;
  }, [reserva]);

  const [inicio, setInicio] = useState<string>(reserva.horaInicio || "08:00");
  const finCalculado = useMemo(() => addMinutesHHMM(inicio, duracionMin), [inicio, duracionMin]);

  // ---- occupiedIntervals (excluye la reserva actual) ----
  const occupiedIntervals = useMemo(() => {
    if (!idCancha) return [];

    const relevant = (reservas || []).filter((r) => {
      if (Number(r.id_cancha) !== Number(idCancha)) return false;
      if (Number(r.id_reserva) === Number(reserva.id_reserva)) return false; // ✅ excluir la actual
      return true;
    });

    return relevant
      .map((r) => {
        const s = hhmmToDecimal(r.horaInicio, startHour);
        let e = hhmmToDecimal(r.horaFin, startHour);

        const offset = Number((r as any).fin_dia_offset || 0);
        // Solo sumar 24 cuando fin < inicio (cruce sin offset). Con offset=1, e ya está en escala extendida (24=00:00, 25=01:00…)
        if (e <= s && offset !== 1) e += 24;

        return { start: s, end: e, id: r.id_reserva };
      })
      .filter((x) => Number.isFinite(x.start) && Number.isFinite(x.end));
  }, [reservas, idCancha, reserva.id_reserva, startHour]);

  // ---- availableTimes (copiado) ----
  const availableTimes = useMemo(() => {
    if (!idCancha) return [];

    const STEP = 30;
    const dayStartU = toUnits30(startHour);
    const dayEndU = toUnits30(endHour);
    const durU = Math.round(duracionMin / STEP);

    const occupiedU: IntervalU[] = occupiedIntervals.map((o) => ({
      startU: toUnits30(o.start),
      endU: toUnits30(o.end),
    }));

    const freeBlocks = buildFreeBlocks(dayStartU, dayEndU, occupiedU);

    const out: { value: string; label: string; decimal: number; finLabel: string }[] = [];

    for (let startU = dayStartU; startU + durU <= dayEndU; startU += 1) {
      const endU = startU + durU;

      const block = freeBlocks.find((b) => startU >= b.startU && endU <= b.endU);
      if (!block) continue;

      if (!noDangling30(block, startU, endU)) continue;

      const inicioHHMM = unitsToHHMM(startU);
      const finHHMM = unitsToHHMM(endU);

      out.push({
        value: inicioHHMM,
        label: inicioHHMM,
        decimal: startU / 2,
        finLabel: finHHMM,
      });
    }

    return out;
  }, [idCancha, startHour, endHour, duracionMin, occupiedIntervals]);

  // asegurar inicio válido
  useEffect(() => {
    if (availableTimes.length === 0) return;
    const stillValid = availableTimes.some((t) => t.value === inicio);
    if (stillValid) return;
    setInicio(availableTimes[0].value);
  }, [availableTimes, inicio]);

  // ---- precio (usa tu API) ----
  const [precio, setPrecio] = useState<number>(0);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function calc() {
      setPriceError(null);

      if (!idCancha || !fecha || !inicio) return;

      setPriceLoading(true);
      try {
        const res = await fetch("/api/reservas/calcular-precio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            id_club: idClub,
            id_cancha: idCancha,
            fecha,
            inicio,
            fin: finCalculado,
            // para admin mantenemos segmento de la reserva si existe
            segmento_override:
              (reserva as any).segmento === "profe" || (reserva as any).segmento === "publico"
                ? (reserva as any).segmento
                : "publico",
          }),
        });

        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.ok) throw new Error(json?.error || "No se pudo calcular el precio");

        if (!alive) return;
        setPrecio(Number(json.precio_total || 0));
      } catch (e: any) {
        if (!alive) return;
        setPrecio(0);
        setPriceError(e?.message || "Error calculando precio");
      } finally {
        if (!alive) return;
        setPriceLoading(false);
      }
    }

    calc();
    return () => {
      alive = false;
    };
  }, [idClub, idCancha, fecha, inicio, finCalculado, reserva]);

  // ---- guardar ----
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave() {
    setSaveError(null);

    if (!idCancha) return setSaveError("Seleccioná una cancha");
    if (!fecha) return setSaveError("Seleccioná una fecha");
    if (!inicio) return setSaveError("Seleccioná un horario disponible");
    if (!availableTimes.some((t) => t.value === inicio)) {
      return setSaveError("Ese horario ya no está disponible. Elegí otro.");
    }
    if (!precio || precio <= 0) return setSaveError("No hay precio válido para ese horario");

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/reservas/${reserva.id_reserva}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_cancha: idCancha,
          fecha,
          inicio,
          // NO mandamos fin_dia_offset ni fin: el backend lo calcula + recalcula precio
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        const code = json?.error || "Error";
        if (code === "SOLAPAMIENTO") throw new Error("Ese horario está ocupado en esa cancha.");
        throw new Error(code);
      }

      onSaved();
    } catch (e: any) {
      setSaveError(e?.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold text-gray-800">Mover reserva</div>

      {/* Cancha */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-gray-500 uppercase">Cancha</label>
        <select
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
          value={idCancha}
          onChange={(e) => setIdCancha(Number(e.target.value))}
          disabled={saving}
        >
          {canchas.map((c) => (
            <option key={c.id_cancha} value={c.id_cancha}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Fecha */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-gray-500 uppercase">Fecha</label>
        <input
          type="date"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          disabled={saving}
        />
      </div>

      {/* Inicio (available) */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-gray-500 uppercase">Hora inicio</label>
        <select
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm disabled:opacity-60"
          value={inicio}
          onChange={(e) => setInicio(e.target.value)}
          disabled={saving || availableTimes.length === 0}
        >
          {availableTimes.length === 0 && <option value="">No hay horarios disponibles</option>}
          {availableTimes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label} inicio ({t.finLabel} fin)
            </option>
          ))}
        </select>

        <div className="text-xs text-slate-500">
          Fin estimado: <span className="font-bold">{finCalculado}</span>
        </div>
      </div>

      {/* Precio */}
      <div>
        <div className="text-xs font-bold text-gray-500 uppercase mb-1">Precio</div>
        <div className="flex items-center gap-2">
          <div className="text-sm font-bold text-gray-800">{formatMoney(precio)}</div>
          {priceLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
        </div>

        {priceError && (
          <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" /> {priceError}
          </div>
        )}
      </div>

      {saveError && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl p-3">
          {saveError}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-full text-sm font-bold hover:bg-gray-50"
          disabled={saving}
        >
          Cancelar
        </button>

        <button
          onClick={handleSave}
          className="flex-1 py-2.5 bg-green-500 text-white rounded-full text-sm font-bold hover:bg-green-600 shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
          disabled={saving || priceLoading || !inicio || availableTimes.length === 0 || precio <= 0}
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Guardar
        </button>
      </div>
    </div>
  );
}
