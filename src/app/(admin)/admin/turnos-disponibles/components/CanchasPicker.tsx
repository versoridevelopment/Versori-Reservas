"use client";

import React from "react";
import type { Cancha } from "../lib/types";

export function CanchasPicker(props: {
  canchas: Cancha[];
  selected: number[];
  disableAddMore: boolean;
  maxCols: number;
  onToggle: (id: number) => void;
}) {
  const { canchas, selected, disableAddMore, maxCols, onToggle } = props;

  return (
    <div className="rounded-2xl border bg-white shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">Canchas</div>
        <div className="text-xs text-gray-500">
          Seleccioná hasta {maxCols} (mínimo 1)
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {canchas.map((c) => {
          const on = selected.includes(c.id_cancha);
          const disabled = !on && disableAddMore;
          return (
            <button
              key={c.id_cancha}
              onClick={() => !disabled && onToggle(c.id_cancha)}
              className={[
                "text-left border rounded-xl px-3 py-2 transition shadow-sm",
                on ? "bg-black text-white border-black" : "bg-white hover:bg-gray-50",
                disabled ? "opacity-40 cursor-not-allowed" : "",
              ].join(" ")}
            >
              <div className="text-sm font-semibold">{c.nombre}</div>
              <div className="text-[11px] opacity-70">ID #{c.id_cancha}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
