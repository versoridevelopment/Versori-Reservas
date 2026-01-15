"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Plus,
  Search,
  Settings,
  ToggleLeft,
  ToggleRight,
  Save,
  CheckCircle,
  AlertCircle,
  FileText,
} from "lucide-react";

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
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
        ok
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-red-50 text-red-700 border-red-200",
      ].join(" ")}
    >
      {ok ? (
        <CheckCircle className="w-3 h-3" />
      ) : (
        <AlertCircle className="w-3 h-3" />
      )}
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
  const [defaults, setDefaults] = useState<Record<number, number | null>>({});

  // form crear
  const [newNombre, setNewNombre] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  async function loadTarifarios() {
    const res = await fetch(`/api/admin/tarifarios?id_club=${clubId}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      const e = (await res.json().catch(() => null)) as ApiError | null;
      throw new Error(e?.error || "Error al cargar tarifarios");
    }
    const data = await res.json();
    setTarifarios((data?.tarifarios ?? []) as Tarifario[]);
  }

  async function loadDefaults() {
    const res = await fetch(
      `/api/admin/tarifarios/defaults?id_club=${clubId}`,
      { cache: "no-store" }
    );
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

    setCreating(true);
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
    } finally {
      setCreating(false);
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
        prev.map((t) =>
          t.id_tarifario === id_tarifario ? { ...t, activo } : t
        )
      );
    } catch (err: any) {
      alert(err?.message || "Error al actualizar");
    }
  }

  async function saveDefaults() {
    setSavingDefaults(true);
    try {
      const items = Object.entries(defaults).map(
        ([id_tipo_cancha, id_tarifario]) => ({
          id_tipo_cancha: Number(id_tipo_cancha),
          id_tarifario: id_tarifario === null ? null : Number(id_tarifario),
        })
      );

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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 -m-6 md:-m-10">
      <div className="max-w-7xl mx-auto space-y-8 pb-32">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Gestión de Tarifarios
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
              Define los precios y reglas de cobro para {clubNombre}.
            </p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
          >
            <Loader2 className="w-4 h-4" /> Recargar
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center justify-between">
            <span className="text-sm font-medium">{error}</span>
            <button
              onClick={load}
              className="text-xs font-bold underline hover:text-red-900"
            >
              Reintentar
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* COLUMNA IZQUIERDA: CREAR Y DEFAULTS */}
          <div className="space-y-6 lg:col-span-1">
            {/* Crear Tarifario */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <Plus className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">
                  Nuevo Tarifario
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Nombre
                  </label>
                  <input
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                    placeholder="Ej: Pádel Estándar"
                    value={newNombre}
                    onChange={(e) => setNewNombre(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm resize-none"
                    placeholder="Opcional..."
                    rows={2}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />
                </div>
                <button
                  onClick={crearTarifario}
                  disabled={creating || !newNombre.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Crear Tarifario"
                  )}
                </button>
              </div>
            </section>

            {/* Defaults */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Asignación por Defecto
                  </h2>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-4 ml-1">
                Tarifario automático si la cancha no tiene uno específico.
              </p>

              <div className="space-y-3">
                {tipos.map((t) => {
                  const deporte = t.deportes?.nombre ?? "Deporte";
                  return (
                    <div
                      key={t.id_tipo_cancha}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100"
                    >
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        {deporte} · {t.nombre}
                      </div>
                      <select
                        className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-400"
                        value={defaults[t.id_tipo_cancha] ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setDefaults((prev) => ({
                            ...prev,
                            [t.id_tipo_cancha]: v === "" ? null : Number(v),
                          }));
                        }}
                      >
                        <option value="">(Sin default)</option>
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

              <button
                onClick={saveDefaults}
                disabled={savingDefaults}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                {savingDefaults ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Guardar Asignaciones
              </button>
            </section>
          </div>

          {/* COLUMNA DERECHA: LISTADO */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filtros */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </div>
                Mostrar inactivos
              </label>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {filtered.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No se encontraron tarifarios.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 font-bold text-slate-700">
                          Nombre
                        </th>
                        <th className="px-6 py-4 font-bold text-slate-700">
                          Descripción
                        </th>
                        <th className="px-6 py-4 font-bold text-slate-700 text-center">
                          Estado
                        </th>
                        <th className="px-6 py-4 font-bold text-slate-700 text-right">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map((t) => (
                        <tr
                          key={t.id_tarifario}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="px-6 py-4 font-medium text-slate-900">
                            {t.nombre}
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              ID: {t.id_tarifario}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-500 max-w-xs truncate">
                            {t.descripcion || "-"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge
                              ok={t.activo}
                              label={t.activo ? "Activo" : "Inactivo"}
                            />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/admin/personalizacion/tarifarios/${t.id_tarifario}/tarifas`}
                                className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 hover:border-slate-300 transition-all"
                              >
                                <Settings className="w-3 h-3" /> Configurar
                              </Link>

                              <button
                                onClick={() =>
                                  toggleActivo(t.id_tarifario, !t.activo)
                                }
                                className={`p-1.5 rounded-lg transition-colors ${
                                  t.activo
                                    ? "text-slate-400 hover:text-red-600 hover:bg-red-50"
                                    : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                                }`}
                                title={t.activo ? "Desactivar" : "Activar"}
                              >
                                {t.activo ? (
                                  <ToggleRight className="w-5 h-5 text-emerald-500" />
                                ) : (
                                  <ToggleLeft className="w-5 h-5" />
                                )}
                              </button>
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
        </div>
      </div>
    </div>
  );
}
