"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
  deportes?: { id_deporte: number; nombre: string } | null;
};

type DefaultItem = {
  id_tipo_cancha: number;
  id_tarifario: number;
};

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        ok ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800",
      ].join(" ")}
    >
      {label}
    </span>
  );
}

export default function TarifariosClient({
  clubId,
  clubNombre,
}: {
  clubId: number;
  clubNombre: string;
}) {
  const [loading, setLoading] = useState(true);
  const [savingDefaults, setSavingDefaults] = useState(false);

  const [tarifarios, setTarifarios] = useState<Tarifario[]>([]);
  const [q, setQ] = useState("");
  const [showInactive, setShowInactive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // defaults
  const [tipos, setTipos] = useState<TipoCancha[]>([]);
  const [defaults, setDefaults] = useState<Record<number, number | null>>({}); // id_tipo_cancha -> id_tarifario|null

  // form crear
  const [newNombre, setNewNombre] = useState("");
  const [newDesc, setNewDesc] = useState("");

  async function loadTarifarios() {
    const res = await fetch(`/api/admin/tarifarios?id_club=${clubId}`, { cache: "no-store" });
    if (!res.ok) {
      const e = (await res.json().catch(() => null)) as ApiError | null;
      throw new Error(e?.error || "Error al cargar tarifarios");
    }
    const data = await res.json();
    setTarifarios((data?.tarifarios ?? []) as Tarifario[]);
  }

  async function loadDefaults() {
    const res = await fetch(`/api/admin/tarifarios/defaults?id_club=${clubId}`, { cache: "no-store" });
    if (!res.ok) {
      const e = (await res.json().catch(() => null)) as ApiError | null;
      throw new Error(e?.error || "Error al cargar defaults");
    }
    const data = await res.json();

    const tiposDb = (data?.tipos ?? []) as TipoCancha[];
    const defaultsDb = (data?.defaults ?? []) as DefaultItem[];

    setTipos(tiposDb);

    const map: Record<number, number | null> = {};
    for (const t of tiposDb) map[t.id_tipo_cancha] = null;
    for (const d of defaultsDb) map[d.id_tipo_cancha] = d.id_tarifario;

    setDefaults(map);
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadTarifarios(), loadDefaults()]);
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

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return tarifarios
      .filter((t) => (showInactive ? true : t.activo === true))
      .filter((t) => {
        if (!term) return true;
        return (
          t.nombre.toLowerCase().includes(term) ||
          (t.descripcion ?? "").toLowerCase().includes(term) ||
          String(t.id_tarifario).includes(term)
        );
      });
  }, [tarifarios, q, showInactive]);

  async function crearTarifario() {
    const nombre = newNombre.trim();
    if (!nombre) return alert("Ingresá un nombre");

    try {
      const res = await fetch("/api/admin/tarifarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_club: clubId,
          nombre,
          descripcion: newDesc.trim() ? newDesc.trim() : null,
          activo: true,
        }),
      });

      if (!res.ok) {
        const e = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(e?.error || "No se pudo crear el tarifario");
      }

      setNewNombre("");
      setNewDesc("");
      await loadTarifarios();
    } catch (err: any) {
      alert(err?.message || "Error al crear tarifario");
    }
  }

  async function toggleActivo(id_tarifario: number, activo: boolean) {
    try {
      const res = await fetch(`/api/admin/tarifarios/${id_tarifario}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo }),
      });

      if (!res.ok) {
        const e = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(e?.error || "No se pudo actualizar el tarifario");
      }

      setTarifarios((prev) =>
        prev.map((t) => (t.id_tarifario === id_tarifario ? { ...t, activo } : t))
      );
    } catch (err: any) {
      alert(err?.message || "Error al actualizar");
    }
  }

  async function saveDefaults() {
    setSavingDefaults(true);
    try {
      const items = Object.entries(defaults).map(([id_tipo_cancha, id_tarifario]) => ({
        id_tipo_cancha: Number(id_tipo_cancha),
        id_tarifario: id_tarifario === null ? null : Number(id_tarifario),
      }));

      const res = await fetch("/api/admin/tarifarios/defaults", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_club: clubId, items }),
      });

      if (!res.ok) {
        const e = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(e?.error || "No se pudieron guardar los defaults");
      }

      await loadDefaults();
      alert("Defaults guardados.");
    } catch (err: any) {
      alert(err?.message || "Error al guardar defaults");
    } finally {
      setSavingDefaults(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
        Cargando tarifarios…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Tarifarios</h1>
          <p className="text-sm text-gray-600 mt-1">
            {clubNombre} · Agrupación de reglas (tarifas) + defaults por tipo de cancha.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={load}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
          >
            Recargar
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
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
      )}

      {/* Crear tarifario */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
        <div className="text-sm font-extrabold text-gray-900">Crear tarifario</div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm"
            placeholder="Nombre (ej: Pádel estándar)"
            value={newNombre}
            onChange={(e) => setNewNombre(e.target.value)}
          />
          <input
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm md:col-span-2"
            placeholder="Descripción (opcional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={crearTarifario}
            className="rounded-xl bg-[#003366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00284f]"
          >
            Crear
          </button>
        </div>
      </div>

      {/* Defaults por tipo */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <div className="text-sm font-extrabold text-gray-900">Defaults por tipo de cancha</div>
          <div className="text-xs text-gray-500 mt-1">
            Si una cancha no tiene tarifario asignado, usa el default del tipo.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tipos.map((t) => {
            const deporte = t.deportes?.nombre ?? "deporte";
            const label = `${deporte} · ${t.nombre}`;

            return (
              <div
                key={t.id_tipo_cancha}
                className="rounded-xl border border-gray-200 p-3 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-sm font-semibold text-gray-900">{label}</div>
                  <div className="text-xs text-gray-500">id_tipo_cancha: {t.id_tipo_cancha}</div>
                </div>

                <select
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white"
                  value={defaults[t.id_tipo_cancha] ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDefaults((prev) => ({
                      ...prev,
                      [t.id_tipo_cancha]: v === "" ? null : Number(v),
                    }));
                  }}
                >
                  <option value="">(sin default)</option>
                  {tarifarios
                    .filter((x) => x.activo)
                    .map((x) => (
                      <option key={x.id_tarifario} value={x.id_tarifario}>
                        {x.nombre}
                      </option>
                    ))}
                </select>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <button
            onClick={saveDefaults}
            disabled={savingDefaults}
            className="rounded-xl bg-[#003366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00284f] disabled:opacity-60"
          >
            {savingDefaults ? "Guardando..." : "Guardar defaults"}
          </button>
        </div>
      </div>

      {/* Listado tarifarios */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 border-b border-gray-100">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, descripción o id…"
            className="w-full sm:max-w-lg rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#003366]/20"
          />

          <label className="flex items-center gap-2 text-sm text-gray-700 select-none">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            Mostrar inactivos
          </label>
        </div>

        {filtered.length === 0 ? (
          <div className="p-6 text-sm text-gray-600">No hay tarifarios para mostrar.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-600">
                  <th className="px-5 py-3 font-semibold">Tarifario</th>
                  <th className="px-5 py-3 font-semibold">Estado</th>
                  <th className="px-5 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filtered.map((t) => (
                  <tr key={t.id_tarifario} className="hover:bg-gray-50/50">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-900">{t.nombre}</div>
                      <div className="text-xs text-gray-500">
                        ID: {t.id_tarifario}
                        {t.descripcion ? ` · ${t.descripcion}` : ""}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <Badge ok={t.activo} label={t.activo ? "Activo" : "Inactivo"} />
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/personalizacion/tarifarios/${t.id_tarifario}/tarifas`}
                          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-gray-50"
                        >
                          Administrar tarifas
                        </Link>

                        {t.activo ? (
                          <button
                            onClick={() => toggleActivo(t.id_tarifario, false)}
                            className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                          >
                            Desactivar
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleActivo(t.id_tarifario, true)}
                            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            Activar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
