"use client";

import { useEffect, useState } from "react";
import type { ReservaUI } from "../../types";
import { fetchReservaFull } from "../lib/api/reservas";

export function useReservaFullLoader(params: {
  isOpen: boolean;
  isCreating: boolean;
  reservaId?: number | null;
  initialData?: Partial<ReservaUI>;
}) {
  const { isOpen, isCreating, reservaId, initialData } = params;

  const [reservaFull, setReservaFull] = useState<ReservaUI | null>(null);

  // Seed desde initialData (cuando abrís sidebar en modo ver)
  useEffect(() => {
    if (!isOpen || isCreating) return;

    if (initialData) {
      setReservaFull((prev) =>
        prev?.id_reserva === initialData.id_reserva ? prev : (initialData as any),
      );
    } else {
      setReservaFull(null);
    }
  }, [isOpen, isCreating, initialData]);

  // Fetch full por id (modo ver/editar)
  useEffect(() => {
    let alive = true;

    async function loadFull() {
      if (!isOpen || isCreating || !reservaId) return;
      try {
        const full = await fetchReservaFull(reservaId);
        if (!alive) return;
        if (full) setReservaFull(full);
      } catch (err) {
        console.error(err);
      }
    }

    loadFull();
    return () => {
      alive = false;
    };
  }, [isOpen, isCreating, reservaId]);

  async function reloadFull() {
    if (!isOpen || isCreating || !reservaId) return;
    try {
      const full = await fetchReservaFull(reservaId);
      if (full) setReservaFull(full);
    } catch (err) {
      console.error(err);
    }
  }

  return { reservaFull, setReservaFull, reloadFull };
}
