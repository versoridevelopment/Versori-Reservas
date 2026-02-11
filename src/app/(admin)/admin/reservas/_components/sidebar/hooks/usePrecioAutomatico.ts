"use client";

import { useEffect } from "react";
import type { Segmento } from "../lib/types";
import { addMinutesHHMM } from "../lib/utils/time";
import { calcularPrecio } from "../lib/api/precio";

export function usePrecioAutomatico(params: {
  isOpen: boolean;
  isCreating: boolean;

  idClub: number;
  fechaISO: string;

  id_cancha: number;
  inicio: string;
  duracion: number;

  precioManual: boolean;
  tipoTurno: "normal" | "profesor" | "torneo" | "escuela" | "cumpleanos" | "abonado";

  setPrecio: (precio: number) => void;
  setPriceLoading: (v: boolean) => void;
  setPriceError: (v: string | null) => void;
}) {
  const {
    isOpen,
    isCreating,
    idClub,
    fechaISO,
    id_cancha,
    inicio,
    duracion,
    precioManual,
    tipoTurno,
    setPrecio,
    setPriceLoading,
    setPriceError,
  } = params;

  useEffect(() => {
    let alive = true;

    async function calc() {
      if (!isOpen || !isCreating) return;
      if (precioManual) return;

      if (!id_cancha || !inicio) return;
      if (!Number.isFinite(duracion) || duracion <= 0 || duracion % 30 !== 0) return;

      const fin = addMinutesHHMM(inicio, duracion);

      const segmento_override: Segmento =
        tipoTurno === "profesor" ? "profe" : "publico";

      setPriceLoading(true);
      setPriceError(null);

      try {
        const r = await calcularPrecio({
          id_club: idClub,
          id_cancha,
          fecha: fechaISO,
          inicio,
          fin,
          segmento_override,
        });

        if (!alive) return;

        if (!r.ok) {
          setPrecio(0);
          setPriceError(r.error);
        } else {
          setPrecio(r.precio_total);
        }
      } catch {
        if (alive) setPriceError("Error calc precio");
      } finally {
        if (alive) setPriceLoading(false);
      }
    }

    const t = setTimeout(calc, 400);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [
    isOpen,
    isCreating,
    idClub,
    fechaISO,
    id_cancha,
    inicio,
    duracion,
    precioManual,
    tipoTurno,
    setPrecio,
    setPriceLoading,
    setPriceError,
  ]);
}
