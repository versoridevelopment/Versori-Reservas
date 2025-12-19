"use client";

import { useEffect, useMemo, useState } from "react";

type ApiError = { error: string };

type Regla = {
  id_regla: number;
  id_tarifario: number;
  segmento: "publico" | "profe";
  dow: number | null; // 0..6 o null
  hora_desde: string; // "HH:MM:SS"
  hora_hasta: string;
  cruza_medianoche: boolean;
  duracion_min: 60 | 90 | 120;
  precio: number;
  prioridad: number;
  activo: boolean;
  vigente_desde: string;
  vigente_hasta: string | null;
  created_at: string;
};

const DOW_LABEL: Record<number, string> = {
  0: "Dom",
  1: "Lun",
  2: "Mar",
  3: "Mié",
  4: "Jue",
  5: "Vie",
  6: "Sáb",
};

function fmtHora(h: string) {
  // viene HH:MM:SS
  return h?.slice(0, 5);
}

export default function TarifasClient({ clubId, clubNombre }: { clubId: number; clubNombre: string }) {
  const [loading, setLoading] = useState(true);
  const [reglas, setReglas] = useState<Regla[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Form alta rápida (mínimo)
  const [draft, setDraft] = useState({
    segmento: "publico" as "publico" | "profe",
    dow: "" as "" | string, // "" => null
    hora_desde: "10:00",
    hora_hasta: "14:00",
    cruza_medianoche: false,
    duracion_min: 60 as 60 | 90 | 120,
    precio: 12000,
    prioridad: 10,
    activo: true,
  });

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/tarifas?id_club=${clubId}`, { cache: "no-store" });
      if (!res.ok) {
        const e = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(e?.error || "Error al cargar tarifas");
      }

      const data = await res.json();
      setReglas((data?.reglas ?? []) as Regla[]);
    } catch (err: any) {
      setError(err?.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId]);

  const grouped = useMemo(() => {
    // simple: orden ya viene del API, pero podemos filtrar/mostrar
    return reglas;
  }, [reglas]);

  async function crearRegla() {
    try {
      const body = {
        id_club: clubId,
        ...draft,
        dow: draft.dow === "" ? null : Number(draft.dow),
        hora_desde: `${draft.hora_desde}:00`,
        hora_hasta: `${draft.hora_hasta}:00`,
        precio: Number(draft.precio),
        prioridad: Number(draft.prioridad),
      };

      const res = await fetch("/api/admin/tarifas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const e = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(e?.error || "No se pudo crear la regla");
      }

      await load();
    } catch (err: any) {
      alert(err?.message || "Error al crear regla");
    }
  }

  async function toggleActivo(r: Regla) {
    const res = await fetch(`/api/admin/tarifas/${r.id_regla}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !r.activo }),
    });

    if (!res.ok) {
      const e = (await res.json().catch(() => null)) as ApiError | null;
      alert(e?.error || "No se pudo actualizar");
      return;
    }

    setReglas((prev) => prev.map((x) => (x.id_regla === r.id_regla ? { ...x, activo: !x.activo } : x)));
  }

  async function bajaLogica(r: Regla) {
    if (!confirm("¿Desactivar esta regla? (activo=false)")) return;

    const res = await fetch(`/api/admin/tarifas/${r.id_regla}`, { method: "DELETE" });
    if (!res.ok) {
      const e = (await res.json().catch(() => null)) as ApiError | null;
      alert(e?.error || "No se pudo desactivar");
      return;
    }

    setReglas((prev) => prev.map((x) => (x.id_regla === r.id_regla ? { ...x, activo: false } : x)));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Tarifas</h1>
          <p className="text-sm text-gray-600 mt-1">
            {clubNombre} · Reglas de precios por franja horaria (público / profe).
          </p>
        </div>

        <button
          onClick={load}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
        >
          Recargar
        </button>
      </div>

      {/* Alta rápida */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="text-sm font-semibold text-gray-800 mb-3">Crear regla</div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <select
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={draft.segmento}
            onChange={(e) => setDraft((p) => ({ ...p, segmento: e.target.value as any }))}
          >
            <option value="publico">Público</option>
            <option value="profe">Profe</option>
          </select>

          <select
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={draft.dow}
            onChange={(e) => setDraft((p) => ({ ...p, dow: e.target.value }))}
          >
            <option value="">Todos los días</option>
            <option value="1">Lun</option>
            <option value="2">Mar</option>
            <option value="3">Mié</option>
            <option value="4">Jue</option>
            <option value="5">Vie</option>
            <option value="6">Sáb</option>
            <option value="0">Dom</option>
          </select>

          <input
            type="time"
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={draft.hora_desde}
            onChange={(e) => setDraft((p) => ({ ...p, hora_desde: e.target.value }))}
          />

          <input
            type="time"
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={draft.hora_hasta}
            onChange={(e) => setDraft((p) => ({ ...p, hora_hasta: e.target.value }))}
          />

          <select
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={draft.duracion_min}
            onChange={(e) => setDraft((p) => ({ ...p, duracion_min: Number(e.target.value) as any }))}
          >
            <option value={60}>60 min</option>
            <option value={90}>90 min</option>
            <option value={120}>120 min</option>
          </select>

          <input
            type="number"
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={draft.precio}
            onChange={(e) => setDraft((p) => ({ ...p, precio: Number(e.target.value) }))}
            placeholder="Precio"
          />

          <label className="flex items-center gap-2 text-sm text-gray-700 md:col-span-2">
            <input
              type="checkbox"
              checked={draft.cruza_medianoche}
              onChange={(e) => setDraft((p) => ({ ...p, cruza_medianoche: e.target.checked }))}
            />
            Cruza medianoche
          </label>

          <input
            type="number"
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm md:col-span-2"
            value={draft.prioridad}
            onChange={(e) => setDraft((p) => ({ ...p, prioridad: Number(e.target.value) }))}
            placeholder="Prioridad"
          />

          <button
            onClick={crearRegla}
            className="rounded-xl bg-[#0d1b2a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1b263b] md:col-span-2"
          >
            Crear
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white shadow rounded-xl p-6">
        {loading ? (
          <div className="text-sm text-gray-600">Cargando tarifas…</div>
        ) : error ? (
          <div className="text-sm text-rose-700">
            {error}
            <div className="mt-3">
              <button
                onClick={load}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : grouped.length === 0 ? (
          <div className="text-sm text-gray-600">No hay reglas cargadas.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-sm text-gray-600">
                <th className="py-2">Segmento</th>
                <th className="py-2">Día</th>
                <th className="py-2">Horario</th>
                <th className="py-2">Duración</th>
                <th className="py-2">Precio</th>
                <th className="py-2">Prioridad</th>
                <th className="py-2 text-center">Activo</th>
                <th className="py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map((r) => (
                <tr key={r.id_regla} className="border-b hover:bg-gray-50 transition text-sm">
                  <td className="py-3">{r.segmento}</td>
                  <td className="py-3">{r.dow === null ? "Todos" : DOW_LABEL[r.dow]}</td>
                  <td className="py-3">
                    {fmtHora(r.hora_desde)}–{fmtHora(r.hora_hasta)} {r.cruza_medianoche ? "(+1)" : ""}
                  </td>
                  <td className="py-3">{r.duracion_min} min</td>
                  <td className="py-3">
                    ${Number(r.precio).toLocaleString("es-AR")}
                  </td>
                  <td className="py-3">{r.prioridad}</td>
                  <td className="py-3 text-center">
                    <button
                      onClick={() => toggleActivo(r)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        r.activo ? "bg-[#0d1b2a]" : "bg-gray-300"
                      }`}
                      title={r.activo ? "Activa" : "Inactiva"}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          r.activo ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => bajaLogica(r)}
                        className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                      >
                        Desactivar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
