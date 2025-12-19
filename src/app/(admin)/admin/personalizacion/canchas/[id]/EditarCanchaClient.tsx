"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ApiError = { error: string };

type Tarifario = {
  id_tarifario: number;
  nombre: string;
  activo: boolean;
};

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

  // NUEVO
  id_tarifario: number | null;
  tarifario_nombre?: string | null;

  tipo_nombre?: string;
  deporte_nombre?: string;
};

function PreviewCanchaCard(props: { cancha: Cancha; imgPreview?: string | null }) {
  const { cancha, imgPreview } = props;

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
      <div
        className="p-5"
        style={{
          background: "linear-gradient(135deg, #003366, #00284f)",
          color: "#ffffff",
        }}
      >
        <div className="text-sm opacity-90">
          Preview (Cancha) · {cancha.estado ? "Activa" : "Inactiva"}
        </div>

        <div className="mt-2 text-2xl font-extrabold tracking-tight">
          {cancha.nombre || "Nombre de la cancha"}
        </div>

        <div className="mt-1 text-sm opacity-90">
          {cancha.descripcion || "Descripción"}
        </div>

        <div className="mt-4 text-xs opacity-90">
          Precio:{" "}
          <span className="font-semibold">
            ${Number(cancha.precio_hora || 0).toLocaleString("es-AR")}
          </span>{" "}
          / hora
        </div>

        {(cancha.deporte_nombre || cancha.tipo_nombre) && (
          <div className="mt-2 text-xs opacity-90">
            {cancha.deporte_nombre ? `Deporte: ${cancha.deporte_nombre}` : ""}
            {cancha.deporte_nombre && cancha.tipo_nombre ? " · " : ""}
            {cancha.tipo_nombre ? `Tipo: ${cancha.tipo_nombre}` : ""}
          </div>
        )}

        <div className="mt-2 text-xs opacity-90">
          Tarifario:{" "}
          <span className="font-semibold">
            {cancha.id_tarifario ? `#${cancha.id_tarifario}` : "Default del tipo"}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-3">
        <div className="rounded-xl border border-gray-200 p-3">
          <div className="text-xs font-semibold text-gray-700">Imagen</div>
          <div className="mt-2">
            {imgPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imgPreview}
                alt="preview"
                className="h-28 w-full object-cover rounded-lg border"
              />
            ) : cancha.imagen_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cancha.imagen_url}
                alt="actual"
                className="h-28 w-full object-cover rounded-lg border"
              />
            ) : (
              <div className="h-28 w-full rounded-lg border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-xs text-gray-500">
                Sin imagen
              </div>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500">
          Para cambiarla, seleccioná un archivo y guardá. Se sube al Storage y se
          actualiza la DB automáticamente.
        </div>
      </div>
    </div>
  );
}

export default function EditarCanchaClient({
  clubId,
  clubNombre,
  idCancha,
}: {
  clubId: number;
  clubNombre: string;
  idCancha: number;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [cancha, setCancha] = useState<Cancha | null>(null);

  const [tarifarios, setTarifarios] = useState<Tarifario[]>([]);

  const [file, setFile] = useState<File | null>(null);
  const imgPreview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/canchas/${idCancha}`, { cache: "no-store" });

      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(err?.error || "No se pudo cargar la cancha");
      }

      const data = (await res.json()) as Cancha;

      // seguridad multi-tenant (no editar canchas de otro club)
      if (data.id_club !== clubId) {
        throw new Error("La cancha no pertenece al club actual.");
      }

      // Por si la vista vieja no trae id_tarifario, aseguramos defaults en front
      const safe: Cancha = {
        ...data,
        id_tarifario: (data as any).id_tarifario ?? null,
      };

      setCancha(safe);
      setFile(null);
    } catch (err: any) {
      alert(err?.message || "Error al cargar cancha");
      router.push("/admin/personalizacion/canchas");
    } finally {
      setLoading(false);
    }
  }

  async function loadTarifarios() {
    try {
      const res = await fetch(`/api/admin/tarifarios?id_club=${clubId}`, { cache: "no-store" });
      if (!res.ok) return;

      const payload = await res.json();
      const items = (payload?.tarifarios ?? []) as any[];

      setTarifarios(
        items
          .filter((t) => t.activo === true)
          .map((t) => ({
            id_tarifario: t.id_tarifario,
            nombre: t.nombre,
            activo: t.activo,
          }))
      );
    } catch {
      // best-effort
    }
  }

  useEffect(() => {
    load();
    loadTarifarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idCancha]);

  const canSubmit = useMemo(() => {
    if (!cancha) return false;
    return (
      cancha.nombre.trim().length > 0 &&
      String(cancha.precio_hora).trim().length > 0 &&
      !Number.isNaN(Number(cancha.precio_hora))
    );
  }, [cancha]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!cancha || !canSubmit || isSaving) return;

    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append("nombre", cancha.nombre);
      fd.append("descripcion", cancha.descripcion ?? "");
      fd.append("precio_hora", String(cancha.precio_hora));
      fd.append("es_exterior", String(cancha.es_exterior));
      fd.append("activa", String(cancha.activa));
      fd.append("estado", String(cancha.estado));

      // NUEVO: id_tarifario
      // "" => null (default del tipo)
      fd.append("id_tarifario", cancha.id_tarifario === null ? "" : String(cancha.id_tarifario));

      // Si hay archivo, tu API lo sube y además borra el anterior (cleanup)
      if (file) fd.append("imagen", file);

      const res = await fetch(`/api/admin/canchas/${idCancha}`, {
        method: "PATCH",
        body: fd,
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(err?.error || "No se pudo guardar la cancha");
      }

      await load();
      alert("Cambios guardados.");
    } catch (err: any) {
      alert(err?.message || "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  }

  async function onDesactivar() {
    if (!confirm("¿Desactivar esta cancha? (baja lógica)")) return;

    try {
      const res = await fetch(`/api/admin/canchas/${idCancha}`, { method: "DELETE" });

      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(err?.error || "No se pudo desactivar");
      }

      await load();
    } catch (err: any) {
      alert(err?.message || "Error al desactivar");
    }
  }

  async function onActivar() {
    try {
      const res = await fetch(`/api/admin/canchas/${idCancha}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: true }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(err?.error || "No se pudo activar");
      }

      await load();
    } catch (err: any) {
      alert(err?.message || "Error al activar");
    }
  }

  if (loading || !cancha) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
        Cargando cancha…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Editar cancha #{cancha.id_cancha}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {clubNombre} · {cancha.nombre}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/personalizacion/canchas"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
          >
            Volver
          </Link>

          {cancha.estado ? (
            <button
              onClick={onDesactivar}
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            >
              Desactivar
            </button>
          ) : (
            <button
              onClick={onActivar}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Activar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={onSave}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Nombre</label>
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm"
                value={cancha.nombre}
                onChange={(e) =>
                  setCancha((prev) => (prev ? { ...prev, nombre: e.target.value } : prev))
                }
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Descripción</label>
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm"
                value={cancha.descripcion ?? ""}
                onChange={(e) =>
                  setCancha((prev) => (prev ? { ...prev, descripcion: e.target.value } : prev))
                }
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">Precio por hora</label>
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm"
                value={String(cancha.precio_hora)}
                onChange={(e) =>
                  setCancha((prev) =>
                    prev
                      ? { ...prev, precio_hora: Number(e.target.value.replace(/[^\d]/g, "")) || 0 }
                      : prev
                  )
                }
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">Imagen (reemplazar)</label>
              <input
                type="file"
                accept="image/*"
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm bg-white"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <div className="mt-1 text-xs text-gray-500">
                Opcional. Se sube al guardar y se elimina la anterior.
              </div>
            </div>

            {/* NUEVO: Tarifario */}
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">
                Tarifario (opcional)
              </label>

              <select
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm bg-white"
                value={cancha.id_tarifario ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setCancha((prev) =>
                    prev ? { ...prev, id_tarifario: v === "" ? null : Number(v) } : prev
                  );
                }}
              >
                <option value="">Usar default del tipo de cancha</option>
                {tarifarios.map((t) => (
                  <option key={t.id_tarifario} value={t.id_tarifario}>
                    {t.nombre}
                  </option>
                ))}
              </select>

              <div className="mt-1 text-xs text-gray-500">
                Si dejás “Default”, la cancha toma el tarifario definido en Personalización → Tarifarios (default por tipo).
              </div>
            </div>

            <div className="md:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!cancha.es_exterior}
                onChange={(e) =>
                  setCancha((prev) => (prev ? { ...prev, es_exterior: e.target.checked } : prev))
                }
              />
              <span className="text-sm text-gray-700">Es exterior</span>
            </div>

            <div className="md:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!cancha.activa}
                onChange={(e) =>
                  setCancha((prev) => (prev ? { ...prev, activa: e.target.checked } : prev))
                }
              />
              <span className="text-sm text-gray-700">Operativa (activa = 1)</span>
            </div>

            <div className="md:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!cancha.estado}
                onChange={(e) =>
                  setCancha((prev) => (prev ? { ...prev, estado: e.target.checked } : prev))
                }
              />
              <span className="text-sm text-gray-700">Cancha activa (estado = 1)</span>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Link
              href="/admin/personalizacion/canchas"
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              className="rounded-xl bg-[#003366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00284f] disabled:opacity-60"
              disabled={!canSubmit || isSaving}
            >
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>

        <PreviewCanchaCard cancha={cancha} imgPreview={imgPreview} />
      </div>
    </div>
  );
}
