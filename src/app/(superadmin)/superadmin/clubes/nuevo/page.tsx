"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ApiError = { error: string };

async function uploadClubImages(
  idClub: number,
  logoFile: File,
  heroFile: File
) {
  const fd = new FormData();
  fd.append("logo", logoFile);
  fd.append("hero", heroFile);

  const res = await fetch(`/api/superadmin/clubes/${idClub}/upload`, {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    const e = await res.json().catch(() => null);
    throw new Error(e?.error || "Error subiendo imágenes");
  }

  return res.json() as Promise<{
    ok: boolean;
    id_club: number;
    logo_url: string | null;
    imagen_hero_url: string | null;
  }>;
}

function PreviewCard(props: {
  nombre: string;
  subdominio: string;
  color_primario: string;
  color_secundario: string;
  color_texto: string;
  texto_bienvenida_titulo: string;
  texto_bienvenida_subtitulo: string;
  logoPreview?: string | null;
  heroPreview?: string | null;
}) {
  const {
    nombre,
    subdominio,
    color_primario,
    color_secundario,
    color_texto,
    texto_bienvenida_titulo,
    texto_bienvenida_subtitulo,
    logoPreview,
    heroPreview,
  } = props;

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
      <div
        className="p-5"
        style={{
          background: `linear-gradient(135deg, ${color_primario}, ${color_secundario})`,
          color: color_texto,
        }}
      >
        <div className="text-sm opacity-90">Preview (Branding)</div>
        <div className="mt-2 text-2xl font-extrabold tracking-tight">
          {texto_bienvenida_titulo || "Título de bienvenida"}
        </div>
        <div className="mt-1 text-sm opacity-90">
          {texto_bienvenida_subtitulo || "Subtítulo de bienvenida"}
        </div>
        <div className="mt-4 text-xs opacity-90">
          {nombre || "Nombre del club"} · {subdominio || "subdominio"}
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-gray-200 p-3">
            <div className="text-xs font-semibold text-gray-700">Logo</div>
            <div className="mt-2">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoPreview}
                  alt="logo preview"
                  className="h-20 w-20 object-cover rounded-lg border"
                />
              ) : (
                <div className="text-xs text-gray-500">No seleccionado</div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-3">
            <div className="text-xs font-semibold text-gray-700">Hero</div>
            <div className="mt-2">
              {heroPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroPreview}
                  alt="hero preview"
                  className="h-20 w-full object-cover rounded-lg border"
                />
              ) : (
                <div className="text-xs text-gray-500">No seleccionado</div>
              )}
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          En este flujo no se pegan URLs manualmente: se suben archivos y se
          actualiza la DB automáticamente.
        </div>
      </div>
    </div>
  );
}

export default function NuevoClubPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [heroFile, setHeroFile] = useState<File | null>(null);

  const logoPreview = useMemo(
    () => (logoFile ? URL.createObjectURL(logoFile) : null),
    [logoFile]
  );
  const heroPreview = useMemo(
    () => (heroFile ? URL.createObjectURL(heroFile) : null),
    [heroFile]
  );

  const [form, setForm] = useState({
    nombre: "",
    subdominio: "",
    color_primario: "#003366",
    color_secundario: "#001a33",
    color_texto: "#ffffff",
    texto_bienvenida_titulo: "Bienvenido",
    texto_bienvenida_subtitulo: "Reservá tu cancha en segundos",
  });

  const canSubmit = useMemo(() => {
    return (
      form.nombre.trim() &&
      form.subdominio.trim() &&
      form.color_primario.trim() &&
      form.color_secundario.trim() &&
      form.color_texto.trim() &&
      form.texto_bienvenida_titulo.trim() &&
      form.texto_bienvenida_subtitulo.trim() &&
      !!logoFile &&
      !!heroFile
    );
  }, [form, logoFile, heroFile]);

  function setField<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || isSaving || !logoFile || !heroFile) return;

    setIsSaving(true);
    try {
      // 1) Crear club (DB usa placeholders NOT NULL)
      const res = await fetch("/api/superadmin/clubes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(err?.error || "No se pudo crear el club");
      }

      const created = await res.json(); // { id_club, ... }

      // 2) Subir imágenes obligatorias y actualizar URLs reales
      await uploadClubImages(created.id_club, logoFile, heroFile);

      // 3) Ir a edición
      router.push(`/superadmin/clubes/${created.id_club}`);
    } catch (err: any) {
      alert(err?.message || "Error al crear club");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Crear nuevo club
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Subí logo y hero (obligatorio). No se ingresan URLs manuales.
          </p>
        </div>

        <Link
          href="/superadmin/clubes"
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
        >
          Volver
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Nombre
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm"
                value={form.nombre}
                onChange={(e) => setField("nombre", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Subdominio
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm font-mono"
                value={form.subdominio}
                onChange={(e) =>
                  setField(
                    "subdominio",
                    e.target.value
                      .toLowerCase()
                      .replace(/\s+/g, "")
                      .replace(/[^a-z0-9-]/g, "")
                  )
                }
              />
              <div className="mt-1 text-xs text-gray-500">
                Solo minúsculas, números y guiones.
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Logo (archivo) *
              </label>
              <input
                type="file"
                accept="image/*"
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm bg-white"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Hero (archivo) *
              </label>
              <input
                type="file"
                accept="image/*"
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm bg-white"
                onChange={(e) => setHeroFile(e.target.files?.[0] || null)}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Color primario
              </label>
              <input
                type="color"
                className="mt-1 h-10 w-full rounded-xl border border-gray-200 p-1"
                value={form.color_primario}
                onChange={(e) => setField("color_primario", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Color secundario
              </label>
              <input
                type="color"
                className="mt-1 h-10 w-full rounded-xl border border-gray-200 p-1"
                value={form.color_secundario}
                onChange={(e) => setField("color_secundario", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Color texto
              </label>
              <input
                type="color"
                className="mt-1 h-10 w-full rounded-xl border border-gray-200 p-1"
                value={form.color_texto}
                onChange={(e) => setField("color_texto", e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">
                Texto bienvenida (título)
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm"
                value={form.texto_bienvenida_titulo}
                onChange={(e) =>
                  setField("texto_bienvenida_titulo", e.target.value)
                }
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">
                Texto bienvenida (subtítulo)
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm"
                value={form.texto_bienvenida_subtitulo}
                onChange={(e) =>
                  setField("texto_bienvenida_subtitulo", e.target.value)
                }
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Link
              href="/superadmin/clubes"
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              className="rounded-xl bg-[#003366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00284f] disabled:opacity-60"
              disabled={!canSubmit || isSaving}
            >
              {isSaving ? "Creando..." : "Crear club"}
            </button>
          </div>
        </form>

        <PreviewCard {...form} logoPreview={logoPreview} heroPreview={heroPreview} />
      </div>
    </div>
  );
}
