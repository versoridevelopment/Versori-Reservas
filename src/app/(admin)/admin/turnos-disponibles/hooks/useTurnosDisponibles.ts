"use client";

import { useState } from "react";
import type { ApiOk, ApiErr, ApiResp, Cancha } from "../lib/types";

export function useTurnosDisponibles(params: { idClub: number }) {
  const { idClub } = params;

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiOk | null>(null);
  const [error, setError] = useState("");

  async function generar(input: {
    fecha: string;
    duracion: number;
    selectedCanchas: Cancha[];
  }) {
    setError("");
    setData(null);

    if (input.selectedCanchas.length === 0) {
      setError("Elegí al menos 1 cancha.");
      return;
    }

    setLoading(true);
    try {
      const canchaIds = input.selectedCanchas.map((c) => c.id_cancha).join(",");

      const qs = new URLSearchParams();
      qs.set("fecha", input.fecha);
      qs.set("duracion", String(input.duracion));
      qs.set("cancha_ids", canchaIds);
      qs.set("id_club", String(idClub));

      const resp = await fetch(`/api/admin/turnos-disponibles?${qs.toString()}`);
      const json = (await resp.json()) as ApiResp;

      if (!("ok" in json) || !json.ok) {
        throw new Error((json as ApiErr).error || "Error");
      }

      setData(json);
    } catch (e: any) {
      setError(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return { loading, data, error, generar };
}
