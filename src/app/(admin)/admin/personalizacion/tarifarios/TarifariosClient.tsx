"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ApiError = { error: string };

type Tarifario = {
  id_tarifario: number;
  id_club: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
};

type TipoCancha = {
  id_tipo_cancha: number;
  nombre: string;
  id_deporte: number;
  deportes?: { nombre: string } | null;
};

type DefaultRow = {
  id_club: number;
  id_tipo_cancha: number;
  id_tarifario: number;
};

export default function TarifariosClient({ clubId, clubNombre }: { clubId: number; clubNombre: string }) {
  const [loading, setLoading] = useState(true);
  const [tarifarios, setTarifarios] = useState<Tarifario[]>([]);
  const [tipos, setTipos] = useState<TipoCancha[]>([]);
  const [defaults, setDefaults] = useState<DefaultRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [nuevo, setNuevo] = useState({ nombre: "", descripcion: "" });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tarifarios?id_club=${clubId}`, { cache: "no-store" });
      if (!res.ok) {
        const e = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(e?.error || "Error al cargar tarifarios");
      }
      const data = await res.json();
      setTarifarios(data.tarifarios ?? []);
      setTipos(data.tipos ?? []);
      setDefaults(data.defaults ?? []);
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

  const defaultByTipo = useMemo(() => {
    const map = new Map<number, number>();
    for (const d of defaults) map.set(d.id_tipo_cancha, d.id_tarifario);
    return map;
  }, [defaults]);

  async function crearTarifario() {
    try {
      const nombre = nuevo.nombre.trim();
      if (!nombre) return alert("Nombre requerido");

      const res = await fetch("/api/admin/tarifarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_club: clubId, nombre, descripcion: nuevo.descripcion.trim() || null }),
      });

      if (!res.ok) {
        const e = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(e?.error || "No se pudo crear tarifario");
      }

      setNuevo({ nombre: "", descripcion: "" });
      await load();
    } catch (err: any) {
      alert(err?.message || "Error al crear tarifario");
    }
  }

  async function desactivarTarifario(id_tarifario: number) {
    if (!confirm("¿Desactivar este tarifario?")) return;

    const res = await fetch(`/api/admin/tarifarios/${id_tarifario}`, { method: "DELETE" });
    if (!res.ok) {
      const e = (await res.json().catch(() => null)) as ApiError | null;
      return alert(e?.error || "No se pudo desactivar");
    }
    await load();
  }

  async function setDefault(id_tipo_cancha: number, id_tarifario: number | null) {
    const res = await fetch("/api/admin/tarifarios/defaults", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_club: clubId, id_tipo_cancha, id_tarifario }),
    });

    if (!res.ok) {
      const e = (await res.json().catch(() => null)) as ApiError | null;
      alert(e?.error || "No se pudo guardar default");
      return;
    }
    await load();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Tarifarios</h1>
          <p className="text-sm text-gray-600 mt-1">
            {clubNombre} · Tarifarios + defaults por tipo de cancha (pádel/fútbol).
          </p>
        </div>

        <button
          onClick={load}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
        >
          Recargar
        </button>
      </div>

      {/* Crear tarifario */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="text-sm font-semibold text-gray-800 mb-3">Nuevo tarifario</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="Nombre (ej: Padel estándar)"
            value={nuevo.nombre}
            onChange={(e) => setNuevo((p) => ({ ...p, nombre: e.target.value }))}
          />
          <input
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="Descripción (opcional)"
            value={nuevo.descripcion}
            onChange={(e) => setNuevo((p) => ({ ...p, descripcion: e.target.value }))}
          />
          <button
            onClick={crearTarifario}
            className="rounded-xl bg-[#0d1b2a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1b263b]"
          >
            Crear
          </button>
        </div>
      </div>

      {/* Tabla tarifarios */}
      <div className="bg-white shadow rounded-xl p-6">
        {loading ? (
          <div className="text-sm text-gray-600">Cargando…</div>
        ) : error ? (
          <div className="text-sm text-rose-700">{error}</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-sm text-gray-600">
                <th className="py-2">Nombre</th>
                <th className="py-2">Descripción</th>
                <th className="py-2">Estado</th>
                <th className="py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tarifarios.map((t) => (
                <tr key={t.id_tarifario} className="border-b hover:bg-gray-50 transition text-sm">
                  <td className="py-3 font-medium">{t.nombre}</td>
                  <td className="py-3 text-gray-600">{t.descripcion ?? "—"}</td>
                  <td className="py-3">{t.activo ? "Activo" : "Inactivo"}</td>
                  <td className="py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/personalizacion/tarifas`}
                        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-gray-50"
                      >
                        Reglas
                      </Link>
                      {t.activo && (
                        <button
                          onClick={() => desactivarTarifario(t.id_tarifario)}
                          className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                        >
                          Desactivar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {tarifarios.length === 0 && (
                <tr>
                  <td className="py-4 text-sm text-gray-600" colSpan={4}>
                    No hay tarifarios creados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Defaults por tipo */}
      <div className="bg-white shadow rounded-xl p-6">
        <div className="text-sm font-semibold text-gray-800 mb-4">
          Default por tipo de cancha
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tipos.map((tc) => {
            const deporte = tc.deportes?.nombre ?? `deporte_${tc.id_deporte}`;
            const current = defaultByTipo.get(tc.id_tipo_cancha) ?? null;

            return (
              <div key={tc.id_tipo_cancha} className="rounded-2xl border border-gray-200 p-4">
                <div className="text-sm font-semibold text-gray-900">
                  {tc.nombre}
                </div>
                <div className="text-xs text-gray-600 mt-1">Deporte: {deporte}</div>

                <div className="mt-3">
                  <select
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    value={current ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDefault(tc.id_tipo_cancha, v === "" ? null : Number(v));
                    }}
                  >
                    <option value="">(Sin default)</option>
                    {tarifarios
                      .filter((t) => t.activo)
                      .map((t) => (
                        <option key={t.id_tarifario} value={t.id_tarifario}>
                          {t.nombre}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  Si una cancha no tiene tarifario específico, usará este default.
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
