"use client";

import React from "react";

export function Controls(props: {
  fecha: string;
  setFecha: (v: string) => void;
  duracion: number;
  setDuracion: (v: number) => void;
  cols: number;
  maxCols: number;
  loading: boolean;
  onGenerar: () => void;
  onDescargar: () => void;
  canDownload: boolean;
  error: string;
}) {
  const {
    fecha,
    setFecha,
    duracion,
    setDuracion,
    cols,
    maxCols,
    loading,
    onGenerar,
    onDescargar,
    canDownload,
    error,
  } = props;

  return (
    <div className="rounded-2xl border bg-white shadow-sm p-4 flex flex-wrap items-end gap-4">
      <div className="space-y-1">
        <div className="text-xs font-semibold text-gray-600">Día</div>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="border rounded-lg px-3 py-2 bg-white"
        />
      </div>

      <div className="space-y-1">
        <div className="text-xs font-semibold text-gray-600">Duración</div>
        <select
          value={duracion}
          onChange={(e) => setDuracion(Number(e.target.value))}
          className="border rounded-lg px-3 py-2 bg-white"
        >
          {[30, 60, 90, 120, 150, 180].map((m) => (
            <option key={m} value={m}>
              {m} min
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={onGenerar}
        disabled={loading}
        className="rounded-lg px-4 py-2 font-semibold text-white disabled:opacity-50 shadow-sm"
        style={{ background: "#0b0f19" }}
      >
        {loading ? "Generando..." : "Generar"}
      </button>

      <button
        onClick={onDescargar}
        disabled={!canDownload}
        className="rounded-lg border px-4 py-2 font-semibold disabled:opacity-50 bg-white hover:bg-gray-50"
      >
        Descargar imagen
      </button>

      <div className="ml-auto text-sm text-gray-600">
        Columnas: <b>{cols}</b>{" "}
        <span className="text-gray-400">(máx {maxCols})</span>
      </div>

      {error ? (
        <div className="w-full text-sm text-red-600 font-medium">{error}</div>
      ) : null}
    </div>
  );
}
