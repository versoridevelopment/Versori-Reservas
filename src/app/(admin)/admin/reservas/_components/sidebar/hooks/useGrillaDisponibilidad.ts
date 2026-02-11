"use client";

import { useMemo } from "react";
import type { CanchaUI, ReservaUI } from "../../types";
import { hhmmToDecimal, diffMinutesHHMM } from "../lib/utils/time";
import {
  buildFreeBlocks,
  toUnits30,
  unitsToHHMM,
  type IntervalU,
} from "../lib/grid/units30";

export function useGrillaDisponibilidad(params: {
  isOpen: boolean;
  isCreating: boolean;
  reservas: ReservaUI[];
  canchas: CanchaUI[];
  canchaId: string;
  precioManual: boolean;
  duracion: number;
  horaInicioManual: string;
  horaFinManual: string;
  startHour: number;
  endHour: number;
}) {
  const {
    isOpen,
    isCreating,
    reservas,
    canchas,
    canchaId,
    precioManual,
    duracion,
    horaInicioManual,
    horaFinManual,
    startHour,
    endHour,
  } = params;

  // 1) Occupied intervals (reservas + cierres) para cancha seleccionada
  const occupiedIntervals = useMemo(() => {
    if (!isCreating) return [];
    const id_cancha = Number(canchaId);
    if (!id_cancha) return [];

    const fromReservas = reservas
      .filter((r) => Number(r.id_cancha) === id_cancha)
      .map((r) => {
        const s = hhmmToDecimal(r.horaInicio, startHour);
        let e = hhmmToDecimal(r.horaFin, startHour);
        const offset = Number((r as any).fin_dia_offset || 0);
        if (e <= s && offset !== 1) e += 24;
        return { start: s, end: e, id: r.id_reserva };
      });

    const cancha = canchas.find((c) => Number(c.id_cancha) === id_cancha);
    const fromCierres = (cancha?.cierres || []).map((c) => {
      const s = hhmmToDecimal(c.inicio, startHour);
      let e = hhmmToDecimal(c.fin, startHour);
      if (e <= s) e += 24;
      return { start: s, end: e, id: 0 };
    });

    return [...fromReservas, ...fromCierres];
  }, [isCreating, reservas, canchaId, startHour, canchas]);

  const dayStartU = useMemo(() => toUnits30(startHour), [startHour]);
  const dayEndU = useMemo(() => toUnits30(endHour), [endHour]);

  const occupiedU: IntervalU[] = useMemo(
    () =>
      occupiedIntervals.map((o) => ({
        startU: toUnits30(o.start),
        endU: toUnits30(o.end),
      })),
    [occupiedIntervals],
  );

  const freeBlocks = useMemo(
    () => buildFreeBlocks(dayStartU, dayEndU, occupiedU),
    [dayStartU, dayEndU, occupiedU],
  );

  // 2) Available times (AUTO)
  const availableTimes = useMemo(() => {
    if (!isOpen || !isCreating) return [];
    if (precioManual) return [];

    const durMin = Number(duracion);
    if (!Number.isFinite(durMin) || durMin <= 0) return [];
    if (durMin % 30 !== 0) return [];

    const durU = Math.round(durMin / 30);

    const out: {
      value: string;
      label: string;
      decimal: number;
      finLabel: string;
    }[] = [];

    for (let startU = dayStartU; startU + durU <= dayEndU; startU += 1) {
      const endU = startU + durU;
      const block = freeBlocks.find((b) => startU >= b.startU && endU <= b.endU);
      if (!block) continue;

      const inicioHHMM = unitsToHHMM(startU);
      const finHHMM = unitsToHHMM(endU);

      out.push({
        value: inicioHHMM,
        label: inicioHHMM,
        decimal: startU / 2,
        finLabel: finHHMM,
      });
    }

    const seen = new Set<string>();
    return out.filter((x) =>
      seen.has(x.value) ? false : (seen.add(x.value), true),
    );
  }, [isOpen, isCreating, precioManual, duracion, freeBlocks, dayStartU, dayEndU]);

  // 2B) Options MANUAL: "desde"
  const manualDesdeOptions = useMemo(() => {
    if (!isOpen || !isCreating) return [];
    if (!precioManual) return [];

    const out: { value: string; label: string }[] = [];
    for (const b of freeBlocks) {
      for (let startU = b.startU; startU + 1 <= b.endU; startU += 1) {
        const hhmm = unitsToHHMM(startU);
        out.push({ value: hhmm, label: hhmm });
      }
    }

    const seen = new Set<string>();
    return out.filter((x) =>
      seen.has(x.value) ? false : (seen.add(x.value), true),
    );
  }, [isOpen, isCreating, precioManual, freeBlocks]);

  // 2C) Options MANUAL: "hasta"
  const manualHastaOptions = useMemo(() => {
    if (!isOpen || !isCreating) return [];
    if (!precioManual) return [];

    const desde = String(horaInicioManual || "");
    if (!/^\d{2}:\d{2}$/.test(desde)) return [];

    const startDec = hhmmToDecimal(desde, startHour);
    const startU = toUnits30(startDec);

    const block = freeBlocks.find((b) => startU >= b.startU && startU < b.endU);
    if (!block) return [];

    const out: { value: string; label: string }[] = [];
    for (let endU = startU + 1; endU <= block.endU; endU += 1) {
      const hhmm = unitsToHHMM(endU);
      out.push({ value: hhmm, label: hhmm });
    }

    const seen = new Set<string>();
    return out.filter((x) =>
      seen.has(x.value) ? false : (seen.add(x.value), true),
    );
  }, [isOpen, isCreating, precioManual, horaInicioManual, freeBlocks, startHour]);

  const duracionManualCalculada = useMemo(() => {
    if (!precioManual) return 0;

    const desde = String(horaInicioManual || "");
    const hasta = String(horaFinManual || "");
    if (!/^\d{2}:\d{2}$/.test(desde) || !/^\d{2}:\d{2}$/.test(hasta)) return 0;

    const mins = diffMinutesHHMM(desde, hasta);
    if (!Number.isFinite(mins) || mins <= 0) return 0;
    if (mins % 30 !== 0) return 0;
    return mins;
  }, [precioManual, horaInicioManual, horaFinManual]);

  return {
    occupiedIntervals,
    freeBlocks,
    availableTimes,
    manualDesdeOptions,
    manualHastaOptions,
    duracionManualCalculada,
    dayStartU,
    dayEndU,
  };
}
