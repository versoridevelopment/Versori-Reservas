"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ApiError = { error: string };

type Cancha = {
  id_cancha: number;
  id_club: number;
  nombre: string;
  descripcion: string | null;
  precio_hora: number;
  imagen_url: string | null;
  es_exterior: boolean;
  activa: boolean;
  estado: boolean;
  // si tu view trae más campos, no molesta
  tipo_nombre?: string;
  deporte_nombre?: string;
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

function Thumb({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="h-10 w-14 rounded-lg border border-gray-200 bg-gray-50" />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={alt}
      className="h-10 w-14 rounded-lg border border-gray-200 object-cover bg-white"
    />
  );
}

export default function CanchasClient({
  clubId,
  clubNombre,
}: {
  clubId: number;
  clubNombre: string;
}) {
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showInactive, setShowInactive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/canchas?id_club=${clubId}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        const e = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(e?.error || "Error al cargar canchas");
      }

      const data = (await res.json()) as Cancha[];
      setCanchas(data);
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

    return canchas
      .filter((c) => (showInactive ? true : c.estado === true))
      .filter((c) => {
        if (!term) return true;
        return (
          c.nombre.toLowerCase().includes(term) ||
          (c.descripcion ?? "").toLowerCase().includes(term) ||
          String(c.precio_hora).includes(term)
        );
      });
  }, [canchas, q, showInactive]);

  async function setEstado(id_cancha: number, estado: boolean) {
    try {
      const res = await fetch(`/api/admin/canchas/${id_cancha}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });

      if (!res.ok) {
        const e = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(e?.error || "No se pudo actualizar el estado");
      }

      setCanchas((prev) =>
        prev.map((c) => (c.id_cancha === id_cancha ? { ...c, estado } : c))
      );
    } catch (err: any) {
      alert(err?.message || "Error al actualizar estado");
    }
  }

  async function bajaLogica(id_cancha: number) {
    if (!confirm("¿Desactivar esta cancha? (baja lógica)")) return;

    try {
      const res = await fetch(`/api/admin/canchas/${id_cancha}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const e = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(e?.error || "No se pudo desactivar la cancha");
      }

      setCanchas((prev) =>
        prev.map((c) =>
          c.id_cancha === id_cancha ? { ...c, estado: false } : c
        )
      );
    } catch (err: any) {
      alert(err?.message || "Error al desactivar");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Administrar canchas
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {clubNombre} · Gestión de canchas, precios e imágenes (baja lógica).
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={load}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
          >
            Recargar
          </button>

          <Link
            href="/admin/personalizacion/canchas/nueva"
            className="rounded-xl bg-[#003366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00284f]"
          >
            Nueva cancha
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex-1">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, descripción o precio…"
            className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#003366]/20"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 select-none">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Mostrar inactivas
        </label>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-gray-600">Cargando canchas…</div>
        ) : error ? (
          <div className="p-6 text-sm text-rose-700">
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
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-gray-600">
            No hay canchas para mostrar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-600">
                  <th className="px-5 py-3 font-semibold">Cancha</th>
                  <th className="px-5 py-3 font-semibold">Precio</th>
                  <th className="px-5 py-3 font-semibold">Estado</th>
                  <th className="px-5 py-3 font-semibold text-right">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filtered.map((c) => (
                  <tr key={c.id_cancha} className="hover:bg-gray-50/50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Thumb src={c.imagen_url} alt={c.nombre} />

                        <div>
                          <div className="font-semibold text-gray-900">
                            {c.nombre}
                          </div>

                          <div className="text-xs text-gray-500">
                            ID: {c.id_cancha}
                            {c.descripcion ? ` · ${c.descripcion}` : ""}
                          </div>

                          {(c.tipo_nombre || c.deporte_nombre) && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              {c.deporte_nombre ? `🏷 ${c.deporte_nombre}` : ""}
                              {c.deporte_nombre && c.tipo_nombre ? " · " : ""}
                              {c.tipo_nombre ? `Tipo: ${c.tipo_nombre}` : ""}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      <div className="font-semibold">
                        ${Number(c.precio_hora).toLocaleString("es-AR")}
                      </div>
                      <div className="text-xs text-gray-500">por hora</div>
                    </td>

                    <td className="px-5 py-4">
                      <Badge ok={c.estado} label={c.estado ? "Activa" : "Inactiva"} />
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/personalizacion/canchas/${c.id_cancha}`}
                          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-gray-50"
                        >
                          Editar
                        </Link>

                        {c.estado ? (
                          <button
                            onClick={() => bajaLogica(c.id_cancha)}
                            className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                          >
                            Desactivar
                          </button>
                        ) : (
                          <button
                            onClick={() => setEstado(c.id_cancha, true)}
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
