// src/app/(admin)/admin/personalizacion/club/ClubForm.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/supabaseClient";
import {
  Loader2,
  UploadCloud,
  Save,
  LayoutTemplate,
  Palette,
  ImageIcon,
} from "lucide-react";
// Importamos el tipo correcto
import type { Club } from "@/lib/ObetenerClubUtils/getClubBySubdomain";
import {
  buildLogoPath,
  buildHeroPath,
  PUBLIC_MEDIA_BUCKET,
} from "@/lib/storage/paths";

interface ClubFormProps {
  initialData: Club;
}

export default function ClubForm({ initialData }: ClubFormProps) {
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [selectedHero, setSelectedHero] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    nombre: initialData.nombre || "",
    subdominio: initialData.subdominio || "",
    logo_url: initialData.logo_url || "",
    imagen_hero_url: initialData.imagen_hero_url || "",

    color_primario: initialData.color_primario || "#000000",
    color_secundario: initialData.color_secundario || "#ffffff",
    color_texto: initialData.color_texto || "#333333",

    texto_bienvenida_titulo: initialData.texto_bienvenida_titulo || "",
    texto_bienvenida_subtitulo: initialData.texto_bienvenida_subtitulo || "",
  });

  const handleChange = (campo: keyof typeof formData, valor: string) => {
    setFormData((prev) => ({ ...prev, [campo]: valor }));
    if (statusMessage) setStatusMessage(null);
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedLogo(file);
      handleChange("logo_url", URL.createObjectURL(file));
    }
  };

  const handleHeroSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedHero(file);
      handleChange("imagen_hero_url", URL.createObjectURL(file));
    }
  };

  const uploadImage = async (
    file: File,
    pathBuilder: (id: number, f: File) => string
  ) => {
    const path = pathBuilder(initialData.id_club, file);
    const { error } = await supabase.storage
      .from(PUBLIC_MEDIA_BUCKET)
      .upload(path, file, { upsert: true, cacheControl: "3600" });

    if (error) throw error;
    const { data } = supabase.storage
      .from(PUBLIC_MEDIA_BUCKET)
      .getPublicUrl(path);

    return data.publicUrl;
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMessage(null);

    try {
      let finalLogoUrl = formData.logo_url;
      let finalHeroUrl = formData.imagen_hero_url;

      if (selectedLogo) {
        finalLogoUrl = await uploadImage(selectedLogo, buildLogoPath);
      }
      if (selectedHero) {
        finalHeroUrl = await uploadImage(selectedHero, buildHeroPath);
      }

      const { error } = await supabase
        .from("clubes")
        .update({
          nombre: formData.nombre,
          logo_url: finalLogoUrl,
          imagen_hero_url: finalHeroUrl,
          color_primario: formData.color_primario,
          color_secundario: formData.color_secundario,
          color_texto: formData.color_texto,
          texto_bienvenida_titulo: formData.texto_bienvenida_titulo,
          texto_bienvenida_subtitulo: formData.texto_bienvenida_subtitulo,
        })
        .eq("id_club", initialData.id_club);

      if (error) throw error;

      setStatusMessage({
        type: "success",
        text: "Identidad del club actualizada correctamente.",
      });
      setSelectedLogo(null);
      setSelectedHero(null);
    } catch (error) {
      console.error("Error guardando:", error);
      setStatusMessage({
        type: "error",
        text: "Ocurrió un error al guardar los cambios.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    // ✅ 1. CONTENEDOR PRINCIPAL CON FONDO GRIS CLARO (Override del fondo negro global)
    // "min-h-screen" asegura que cubra toda la altura, "bg-slate-50" es el color claro.
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10 -m-6 md:-m-10">
      <div className="max-w-7xl mx-auto space-y-8 pb-32">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Identidad Visual
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Personaliza la apariencia pública de{" "}
            <span className="font-semibold text-slate-700">
              {formData.subdominio}.versori.com
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* COLUMNA IZQUIERDA: FORMULARIOS */}
          <div className="lg:col-span-2 space-y-6">
            {/* SECCIÓN 1: MARCA Y LOGO */}
            <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <LayoutTemplate className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">
                  Información General
                </h2>
              </div>

              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                {/* Logo Upload */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-36 h-36 bg-slate-50 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden hover:border-blue-500 transition-colors group shadow-inner">
                    {formData.logo_url ? (
                      <Image
                        src={formData.logo_url}
                        alt="Logo"
                        fill
                        className="object-contain p-4"
                      />
                    ) : (
                      <UploadCloud className="w-10 h-10 text-slate-400" />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <UploadCloud className="w-8 h-8 text-white" />
                    </div>
                    <input
                      id="logo-input"
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleLogoSelect}
                      title="Cambiar Logo"
                    />
                  </div>
                  <label
                    htmlFor="logo-input"
                    className="text-sm font-semibold text-blue-600 cursor-pointer hover:underline"
                  >
                    Cambiar Logo
                  </label>
                </div>

                <div className="flex-1 space-y-5 w-full">
                  <div>
                    <label
                      htmlFor="nombre-club"
                      className="block text-sm font-semibold text-slate-700 mb-2"
                    >
                      Nombre del Club
                    </label>
                    <input
                      id="nombre-club"
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => handleChange("nombre", e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900 bg-white"
                      placeholder="Ej: Versori Padel Club"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="subdominio"
                      className="block text-sm font-semibold text-slate-700 mb-2"
                    >
                      Subdominio (URL)
                    </label>
                    <div className="flex items-center">
                      <span className="bg-slate-100 border border-r-0 border-slate-300 px-4 py-3 rounded-l-xl text-slate-500 font-medium">
                        https://
                      </span>
                      <input
                        id="subdominio"
                        type="text"
                        value={formData.subdominio}
                        disabled
                        className="w-full px-4 py-3 border border-slate-300 bg-slate-50 text-slate-600 font-semibold rounded-r-xl cursor-not-allowed"
                      />
                      <span className="bg-slate-100 border border-l-0 border-slate-300 px-4 py-3 rounded-r-xl text-slate-500 font-medium">
                        .versori.com
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECCIÓN 2: PALETA DE COLORES */}
            <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Palette className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">
                  Paleta de Colores
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label
                    htmlFor="color-primario"
                    className="block text-sm font-semibold text-slate-700 mb-3"
                  >
                    Color Primario
                  </label>
                  <div className="flex items-center gap-3 p-2 border border-slate-300 rounded-xl bg-slate-50 hover:border-slate-400 transition-colors">
                    <input
                      id="color-primario"
                      type="color"
                      value={formData.color_primario}
                      onChange={(e) =>
                        handleChange("color_primario", e.target.value)
                      }
                      className="w-12 h-12 rounded-lg cursor-pointer border-2 border-white shadow-sm p-0 bg-transparent"
                      title="Seleccionar color primario"
                    />
                    <span className="text-base font-mono font-medium text-slate-700 uppercase flex-1">
                      {formData.color_primario}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    Botones y destacados.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="color-secundario"
                    className="block text-sm font-semibold text-slate-700 mb-3"
                  >
                    Color Secundario
                  </label>
                  <div className="flex items-center gap-3 p-2 border border-slate-300 rounded-xl bg-slate-50 hover:border-slate-400 transition-colors">
                    <input
                      id="color-secundario"
                      type="color"
                      value={formData.color_secundario}
                      onChange={(e) =>
                        handleChange("color_secundario", e.target.value)
                      }
                      className="w-12 h-12 rounded-lg cursor-pointer border-2 border-white shadow-sm p-0 bg-transparent"
                      title="Seleccionar color secundario"
                    />
                    <span className="text-base font-mono font-medium text-slate-700 uppercase flex-1">
                      {formData.color_secundario}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    Detalles y fondos.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="color-texto"
                    className="block text-sm font-semibold text-slate-700 mb-3"
                  >
                    Color de Texto
                  </label>
                  <div className="flex items-center gap-3 p-2 border border-slate-300 rounded-xl bg-slate-50 hover:border-slate-400 transition-colors">
                    <input
                      id="color-texto"
                      type="color"
                      value={formData.color_texto}
                      onChange={(e) =>
                        handleChange("color_texto", e.target.value)
                      }
                      className="w-12 h-12 rounded-lg cursor-pointer border-2 border-white shadow-sm p-0 bg-transparent"
                      title="Seleccionar color de texto"
                    />
                    <span className="text-base font-mono font-medium text-slate-700 uppercase flex-1">
                      {formData.color_texto}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    Títulos y párrafos.
                  </p>
                </div>
              </div>
            </section>

            {/* SECCIÓN 3: HERO / PORTADA */}
            <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <ImageIcon className="w-6 h-6 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">
                  Portada de Inicio (Hero)
                </h2>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Imagen de Fondo Grande
                  </label>
                  <div className="relative w-full h-64 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center overflow-hidden group hover:border-emerald-500 transition-all shadow-inner">
                    {formData.imagen_hero_url ? (
                      <Image
                        src={formData.imagen_hero_url}
                        alt="Hero Preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="text-center p-6">
                        <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <span className="text-base text-slate-500 font-medium">
                          Haz click para subir una imagen de portada
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white font-semibold flex items-center gap-3 px-6 py-3 bg-black/50 rounded-full backdrop-blur-sm">
                        <UploadCloud className="w-6 h-6" /> Cambiar Imagen
                      </span>
                    </div>
                    <input
                      id="hero-input"
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleHeroSelect}
                      title="Subir imagen de portada"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="hero-titulo"
                      className="block text-sm font-semibold text-slate-700 mb-2"
                    >
                      Título de Bienvenida
                    </label>
                    <input
                      id="hero-titulo"
                      type="text"
                      value={formData.texto_bienvenida_titulo}
                      onChange={(e) =>
                        handleChange("texto_bienvenida_titulo", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900"
                      placeholder="Ej: Bienvenido a Versori"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="hero-subtitulo"
                      className="block text-sm font-semibold text-slate-700 mb-2"
                    >
                      Subtítulo Promocional
                    </label>
                    <input
                      id="hero-subtitulo"
                      type="text"
                      value={formData.texto_bienvenida_subtitulo}
                      onChange={(e) =>
                        handleChange(
                          "texto_bienvenida_subtitulo",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900"
                      placeholder="Ej: El mejor club de pádel..."
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ✅ 2. BOTÓN GUARDAR AL FINAL (VERDE) */}
            <div className="hidden md:flex justify-end pt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white text-lg font-bold px-10 py-4 rounded-xl transition-all shadow-lg hover:shadow-green-600/30 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
              >
                {saving ? (
                  <Loader2 className="animate-spin w-6 h-6" />
                ) : (
                  <Save className="w-6 h-6" />
                )}
                {saving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>

          {/* COLUMNA DERECHA: PREVIEW */}
          <div className="lg:col-span-1 lg:sticky lg:top-6">
            <div className="bg-slate-900 rounded-[2.5rem] border-[10px] border-slate-800 shadow-2xl overflow-hidden h-[700px] flex flex-col">
              {/* Browser Bar */}
              <div className="bg-slate-800 px-5 py-4 flex items-center justify-center relative shrink-0">
                <div className="absolute left-4 flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="bg-slate-700 text-slate-300 text-xs font-medium px-4 py-1.5 rounded-full flex items-center gap-2 truncate max-w-[180px]">
                  🔒 {formData.subdominio || "club"}.versori.com
                </div>
              </div>

              {/* Preview iframe simulator */}
              <div className="flex-1 bg-white flex flex-col overflow-y-auto custom-scrollbar relative">
                {/* Navbar */}
                <div
                  className="px-5 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10 transition-colors"
                  style={{ backgroundColor: formData.color_primario }}
                >
                  <div className="w-10 h-10 relative bg-white rounded-xl overflow-hidden flex items-center justify-center shadow-sm">
                    {formData.logo_url ? (
                      <Image
                        src={formData.logo_url}
                        alt="Logo"
                        fill
                        className="object-contain p-1"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="h-0.5 w-6 bg-white/80 rounded-full" />
                    <div className="h-0.5 w-6 bg-white/80 rounded-full" />
                  </div>
                </div>

                {/* Hero */}
                <div className="relative h-80 w-full bg-slate-100 flex items-end justify-start text-left p-6">
                  {formData.imagen_hero_url && (
                    <Image
                      src={formData.imagen_hero_url}
                      alt="Hero"
                      fill
                      className="object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="relative z-10 max-w-md">
                    <h3
                      className="text-3xl font-extrabold mb-3 drop-shadow-lg leading-tight"
                      style={{ color: formData.color_texto || "#ffffff" }}
                    >
                      {formData.texto_bienvenida_titulo || "Título"}
                    </h3>
                    <p
                      className="text-lg font-medium opacity-95 drop-shadow-md mb-6"
                      style={{ color: formData.color_texto || "#ffffff" }}
                    >
                      {formData.texto_bienvenida_subtitulo || "Subtítulo"}
                    </p>
                    <button
                      className="px-6 py-3 rounded-full text-sm font-bold shadow-lg"
                      style={{
                        backgroundColor: formData.color_secundario,
                        color: "#fff",
                      }}
                    >
                      Reservar
                    </button>
                  </div>
                </div>

                {/* Body Dummy */}
                <div className="p-6 space-y-8 bg-slate-50 flex-1">
                  <div className="space-y-3">
                    <div className="h-5 w-1/3 bg-slate-200 rounded-md" />
                    <div className="h-3 w-full bg-slate-200 rounded-md" />
                    <div className="h-3 w-5/6 bg-slate-200 rounded-md" />
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-slate-500 mt-4 font-medium">
              Vista previa aproximada
            </p>
          </div>
        </div>

        {/* Botón Flotante Móvil */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 md:hidden z-50 flex flex-col gap-3 shadow-lg">
          {statusMessage && (
            <div
              className={`text-sm p-3 rounded-lg text-center font-medium ${
                statusMessage.type === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {statusMessage.text}
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-sm active:bg-green-800 transition-colors"
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>

        {/* Notificación Flotante Desktop */}
        {statusMessage && (
          <div
            className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl border-2 animate-in slide-in-from-bottom-5 duration-300 z-50 hidden md:block ${
              statusMessage.type === "success"
                ? "bg-white border-green-500 text-green-800"
                : "bg-white border-red-500 text-red-800"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-2 rounded-full ${
                  statusMessage.type === "success"
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {statusMessage.type === "success" ? (
                  <Save className="w-5 h-5" />
                ) : (
                  <LayoutTemplate className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="font-bold text-lg">
                  {statusMessage.type === "success" ? "¡Éxito!" : "Error"}
                </p>
                <p className="font-medium">{statusMessage.text}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
