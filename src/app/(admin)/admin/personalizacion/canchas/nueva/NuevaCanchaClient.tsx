"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ApiError = { error: string };

function PreviewCanchaCard(props: {
  nombre: string;
  descripcion: string;
  precio: string;
  imgPreview?: string | null;
}) {
  const { nombre, descripcion, precio, imgPreview } = props;

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
      <div
        className="p-5"
        style={{
          background: "linear-gradient(135deg, #003366, #00284f)",
          color: "#ffffff",
        }}
      >
        <div className="text-sm opacity-90">Preview (Cancha)</div>
        <div className="mt-2 text-2xl font-extrabold tracking-tight">
          {nombre || "Nombre de la cancha"}
        </div>
        <div className="mt-1 text-sm opacity-90">
          {descripcion || "Descripción"}
        </div>
        <div className="mt-4 text-xs opacity-90">
          Precio:{" "}
          <span className="font-semibold">
            {precio ? `$${Number(precio).toLocaleString("es-AR")}` : "$0"}
          </span>{" "}
          / hora
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
            ) : (
              <div className="h-28 w-full rounded-lg border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-xs text-gray-500">
                Sin imagen seleccionada
              </div>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500">
          La imagen se sube al guardar. No se ingresa URL manual.
        </div>
      </div>
    </div>
  );
}

export default function NuevaCanchaClient({
  clubId,
  clubNombre,
}: {
  clubId: number;
  clubNombre: string;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");

  const [idTipoCancha, setIdTipoCancha] = useState("1"); // podés poblarlo luego desde DB
  const [esExterior, setEsExterior] = useState(true);
  const [activa, setActiva] = useState(true);

  const [file, setFile] = useState<File | null>(null);

  const imgPreview = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file]
  );

  const canSubmit = useMemo(() => {
    return (
      nombre.trim().length > 0 &&
      precio.trim().length > 0 &&
      !Number.isNaN(Number(precio)) &&
      Number(precio) > 0 &&
      idTipoCancha.trim().length > 0
    );
  }, [nombre, precio, idTipoCancha]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || isSaving) return;

    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append("id_club", String(clubId));
      fd.append("id_tipo_cancha", String(idTipoCancha));
      fd.append("nombre", nombre);
      fd.append("descripcion", descripcion);
      fd.append("precio_hora", precio);
      fd.append("es_exterior", String(esExterior));
      fd.append("activa", String(activa));
      if (file) fd.append("imagen", file);

      const res = await fetch("/api/admin/canchas", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(err?.error || "No se pudo crear la cancha");
      }

      alert("Cancha creada.");
      router.push("/admin/personalizacion/canchas");
    } catch (err: any) {
      alert(err?.message || "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Crear nueva cancha
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {clubNombre} · Alta de cancha con imagen y precio.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/personalizacion/canchas"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
          >
            Volver
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={onSave}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">
                Nombre
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">
                Descripción
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Precio por hora
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm"
                value={precio}
                onChange={(e) =>
                  setPrecio(e.target.value.replace(/[^\d]/g, ""))
                }
                placeholder="Ej: 12000"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Tipo de cancha (id_tipo_cancha)
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm font-mono"
                value={idTipoCancha}
                onChange={(e) =>
                  setIdTipoCancha(e.target.value.replace(/[^\d]/g, ""))
                }
              />
              <div className="mt-1 text-xs text-gray-500">
                Placeholder por ahora. Luego lo conectamos a catálogo.
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">
                Imagen (archivo)
              </label>
              <input
                type="file"
                accept="image/*"
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm bg-white"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <div className="mt-1 text-xs text-gray-500">
                Opcional. Si no subís imagen, queda null (o la que manejes por defecto).
              </div>
            </div>

            <div className="md:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={esExterior}
                onChange={(e) => setEsExterior(e.target.checked)}
              />
              <span className="text-sm text-gray-700">Es exterior</span>
            </div>

            <div className="md:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={activa}
                onChange={(e) => setActiva(e.target.checked)}
              />
              <span className="text-sm text-gray-700">
                Operativa (activa = 1)
              </span>
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
              {isSaving ? "Guardando..." : "Crear cancha"}
            </button>
          </div>
        </form>

        <PreviewCanchaCard
          nombre={nombre}
          descripcion={descripcion}
          precio={precio}
          imgPreview={imgPreview}
        />
      </div>
    </div>
  );
}
