"use client";

import { useMemo, useState } from "react";
import type { Cancha } from "../lib/types";

export function useSelectedCanchas(canchas: Cancha[], maxCols: number) {
  const [selected, setSelected] = useState<number[]>(() =>
    canchas.slice(0, 1).map((c) => c.id_cancha),
  );

  const selectedCanchas = useMemo(
    () => canchas.filter((c) => selected.includes(c.id_cancha)),
    [canchas, selected],
  );

  const cols = Math.min(maxCols, Math.max(1, selectedCanchas.length));
  const disableAddMore = selectedCanchas.length >= maxCols;

  function toggleCancha(id: number) {
    setSelected((prev) => {
      const exists = prev.includes(id);

      if (exists) {
        const next = prev.filter((x) => x !== id);
        return next.length === 0 ? prev : next;
      }

      if (prev.length >= maxCols) return prev;
      return [...prev, id];
    });
  }

  return { selected, selectedCanchas, cols, disableAddMore, toggleCancha };
}
