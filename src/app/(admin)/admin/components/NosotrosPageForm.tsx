"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Loader2,
  Save,
  ToggleLeft,
  ToggleRight,
  X,
  Plus,
  ImageIcon,
  BookOpen,
  FileText,
  Trash2,
  Heart,
  Users,
  Phone,
} from "lucide-react";

interface Valor {
  titulo: string;
  contenido: string;
}

interface Props {
  clubId: number;
  initialData: any;
}

export default function NosotrosPageForm({ clubId, initialData }: Props) {
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "general" | "galeria" | "valores" | "equipo"
  >("general");

  // Estados para archivos
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
  const [newGalleryPreviews, setNewGalleryPreviews] = useState<string[]>([]);

  const [teamImageFile, setTeamImageFile] = useState<File | null>(null);
  const [teamImagePreview, setTeamImagePreview] = useState<string | null>(null);

  // Estado Principal
  const [data, setData] = useState({
    activo_nosotros: initialData?.activo_nosotros ?? true,
    historia_titulo: initialData?.historia_titulo || "Nuestra Historia",
    hero_descripcion: initialData?.hero_descripcion || "",
    historia_contenido: initialData?.historia_contenido || "",
    frase_cierre: initialData?.frase_cierre || "",
    galeria_pagina: (initialData?.galeria_pagina as string[]) || [],
    valores: (initialData?.valores as Valor[]) || [],
    equipo_imagen_url: initialData?.equipo_imagen_url || null,
    recruitment_phone: initialData?.recruitment_phone || "",
    recruitment_message: initialData?.recruitment_message || "",
  });

  // --- HANDLERS GALERÍA ---
  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArr = Array.from(e.target.files);
      setNewGalleryFiles((prev) => [...prev, ...filesArr]);
      const newUrls = filesArr.map((f) => URL.createObjectURL(f));
      setNewGalleryPreviews((prev) => [...prev, ...newUrls]);
    }
  };
  const removeExistingImage = (index: number) => {
    setData((prev) => ({
      ...prev,
      galeria_pagina: prev.galeria_pagina.filter((_, i) => i !== index),
    }));
  };
  const removeNewImage = (index: number) => {
    setNewGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setNewGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // --- HANDLERS EQUIPO (IMAGEN) ---
  const handleTeamImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTeamImageFile(file);
      setTeamImagePreview(URL.createObjectURL(file));
    }
  };

  // --- HANDLERS VALORES ---
  const addValor = () => {
    setData((prev) => ({
      ...prev,
      valores: [
        ...prev.valores,
        { titulo: "Nuevo Valor", contenido: "Descripción corta..." },
      ],
    }));
  };
  const updateValor = (index: number, field: keyof Valor, value: string) => {
    const updatedValores = [...data.valores];
    updatedValores[index] = { ...updatedValores[index], [field]: value };
    setData((prev) => ({ ...prev, valores: updatedValores }));
  };
  const removeValor = (index: number) => {
    setData((prev) => ({
      ...prev,
      valores: prev.valores.filter((_, i) => i !== index),
    }));
  };

  // --- GUARDAR ---
  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("clubId", clubId.toString());
      formData.append("settings", JSON.stringify(data));

      newGalleryFiles.forEach((f) => formData.append("galleryFiles", f));

      if (teamImageFile) {
        formData.append("teamImageFile", teamImageFile);
      }

      const res = await fetch("/api/admin/nosotros/update", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Error al guardar");

      alert("Página actualizada correctamente");
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* HEADER & VISIBILIDAD */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" /> Configuración
            &quot;Nosotros&quot;
          </h2>
          <p className="text-sm text-slate-500">
            Administra el contenido institucional.
          </p>
        </div>
        <button
          onClick={() =>
            setData((prev) => ({
              ...prev,
              activo_nosotros: !prev.activo_nosotros,
            }))
          }
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
            data.activo_nosotros
              ? "bg-green-100 text-green-700"
              : "bg-slate-100 text-slate-500"
          }`}
          title={data.activo_nosotros ? "Desactivar página" : "Activar página"}
          aria-label={
            data.activo_nosotros ? "Desactivar página" : "Activar página"
          }
        >
          {data.activo_nosotros ? (
            <ToggleRight className="w-6 h-6" />
          ) : (
            <ToggleLeft className="w-6 h-6" />
          )}
          {data.activo_nosotros ? "Visible" : "Oculto"}
        </button>
      </section>

      {/* TABS DE NAVEGACIÓN */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-fit overflow-x-auto">
        {[
          { id: "general", label: "Contenido", icon: FileText },
          { id: "galeria", label: "Galería", icon: ImageIcon },
          { id: "valores", label: "Valores", icon: Heart },
          { id: "equipo", label: "Equipo", icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
            aria-label={`Ir a pestaña ${tab.label}`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {data.activo_nosotros && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[400px]">
          {/* --- TAB GENERAL --- */}
          {activeTab === "general" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Título Principal (Hero)
                  </label>
                  <input
                    type="text"
                    value={data.historia_titulo}
                    onChange={(e) =>
                      setData({ ...data, historia_titulo: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                    aria-label="Título principal del hero"
                    title="Título principal del hero"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Descripción Corta (Hero)
                  </label>
                  <input
                    type="text"
                    value={data.hero_descripcion}
                    onChange={(e) =>
                      setData({ ...data, hero_descripcion: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                    placeholder="Subtítulo impactante..."
                    aria-label="Descripción corta del hero"
                    title="Descripción corta del hero"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Historia Completa
                </label>
                <textarea
                  rows={10}
                  value={data.historia_contenido}
                  onChange={(e) =>
                    setData({ ...data, historia_contenido: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl resize-none"
                  aria-label="Contenido completo de la historia"
                  title="Contenido completo de la historia"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Frase de Cierre (Cita)
                </label>
                <input
                  type="text"
                  value={data.frase_cierre}
                  onChange={(e) =>
                    setData({ ...data, frase_cierre: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl italic"
                  placeholder="Una frase inspiradora..."
                  aria-label="Frase de cierre o cita"
                  title="Frase de cierre o cita"
                />
              </div>
            </div>
          )}

          {/* --- TAB GALERÍA --- */}
          {activeTab === "galeria" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800">
                  Imágenes del Slider
                </h3>
                <label className="cursor-pointer bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-blue-100 flex gap-2 items-center">
                  <Plus className="w-4 h-4" /> Agregar
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleGallerySelect}
                    title="Seleccionar imágenes para la galería"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {data.galeria_pagina.map((url, i) => (
                  <div
                    key={`saved-${i}`}
                    className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group"
                  >
                    <Image
                      src={url}
                      alt="Saved"
                      fill
                      className="object-cover"
                    />
                    <button
                      onClick={() => removeExistingImage(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Eliminar imagen"
                      title="Eliminar imagen"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {newGalleryPreviews.map((url, i) => (
                  <div
                    key={`new-${i}`}
                    className="relative aspect-square rounded-xl overflow-hidden border-2 border-green-400 group"
                  >
                    <Image src={url} alt="New" fill className="object-cover" />
                    <div className="absolute top-0 left-0 bg-green-500 text-white text-[10px] px-2 py-0.5 font-bold">
                      NUEVA
                    </div>
                    <button
                      onClick={() => removeNewImage(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Cancelar subida"
                      title="Cancelar subida"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {data.galeria_pagina.length === 0 &&
                  newGalleryPreviews.length === 0 && (
                    <div className="col-span-full py-8 text-center text-slate-400 text-sm border-2 border-dashed rounded-xl bg-slate-50">
                      Sin imágenes en el slider.
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* --- TAB VALORES --- */}
          {activeTab === "valores" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Nuestros Valores</h3>
                <button
                  onClick={addValor}
                  className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-blue-100 flex gap-2 items-center"
                  aria-label="Agregar nuevo valor"
                >
                  <Plus className="w-4 h-4" /> Nuevo Valor
                </button>
              </div>
              <div className="grid gap-4">
                {data.valores.map((valor, i) => (
                  <div
                    key={i}
                    className="flex gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50 items-start"
                  >
                    <div className="mt-2 bg-white p-2 rounded-lg border border-slate-200 text-slate-400">
                      <Heart className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={valor.titulo}
                        onChange={(e) =>
                          updateValor(i, "titulo", e.target.value)
                        }
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-bold text-sm"
                        placeholder="Título (Ej: Pasión)"
                        aria-label="Título del valor"
                        title="Título del valor"
                      />
                      <textarea
                        rows={2}
                        value={valor.contenido}
                        onChange={(e) =>
                          updateValor(i, "contenido", e.target.value)
                        }
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm resize-none"
                        placeholder="Descripción..."
                        aria-label="Descripción del valor"
                        title="Descripción del valor"
                      />
                    </div>
                    <button
                      onClick={() => removeValor(i)}
                      className="text-slate-400 hover:text-red-500 p-1"
                      aria-label="Eliminar valor"
                      title="Eliminar valor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {data.valores.length === 0 && (
                  <p className="text-center text-slate-400 text-sm py-4">
                    No has agregado valores aún.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* --- TAB EQUIPO --- */}
          {activeTab === "equipo" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-slate-800 mb-4">
                    Fondo de la Sección
                  </h3>
                  <div className="relative w-full aspect-video bg-slate-100 rounded-xl overflow-hidden border-2 border-dashed border-slate-300 flex flex-col items-center justify-center group hover:border-blue-400 transition-colors">
                    {teamImagePreview || data.equipo_imagen_url ? (
                      <Image
                        src={teamImagePreview || data.equipo_imagen_url || ""}
                        alt="Team BG"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="text-slate-400 flex flex-col items-center">
                        <ImageIcon className="w-8 h-8 mb-2" />
                        <span className="text-xs">Sin imagen</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer bg-white text-slate-800 px-4 py-2 rounded-lg font-bold text-sm hover:scale-105 transition-transform">
                        Cambiar Imagen
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleTeamImageSelect}
                          title="Seleccionar imagen de fondo del equipo"
                        />
                      </label>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 mb-2">
                    Contacto Reclutamiento
                  </h3>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Teléfono WhatsApp
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={data.recruitment_phone}
                        onChange={(e) =>
                          setData({
                            ...data,
                            recruitment_phone: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl"
                        placeholder="Ej: 54911..."
                        aria-label="Teléfono para reclutamiento"
                        title="Teléfono para reclutamiento"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Mensaje Automático
                    </label>
                    <textarea
                      rows={3}
                      value={data.recruitment_message}
                      onChange={(e) =>
                        setData({
                          ...data,
                          recruitment_message: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl resize-none"
                      placeholder="Hola, quiero trabajar con ustedes..."
                      aria-label="Mensaje automático de WhatsApp"
                      title="Mensaje automático de WhatsApp"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BOTÓN GUARDAR FLOTANTE/FIJO */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 shadow-lg hover:-translate-y-1 transition-all"
          aria-label="Guardar todos los cambios"
          title="Guardar todos los cambios"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}{" "}
          Guardar Cambios
        </button>
      </div>
    </div>
  );
}
