"use client";

import { useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/supabaseClient";
import {
  Loader2,
  UploadCloud,
  Save,
  FileText,
  ImageIcon,
  Trophy,
  Users,
  MapPin,
  Quote,
} from "lucide-react";
import { PUBLIC_MEDIA_BUCKET } from "@/lib/storage/paths";

// Definimos la estructura completa de los datos
export type NosotrosData = {
  hero_descripcion: string;
  historia_titulo: string;
  historia_contenido: string;
  historia_imagen_url: string;
  valores: {
    titulo: string;
    contenido: string;
  }[];
  frase_cierre: string;
};

interface SobreNosotrosFormProps {
  initialData: NosotrosData | null;
  clubId: number;
  subdominio: string;
}

export default function SobreNosotrosForm({
  initialData,
  clubId,
  subdominio,
}: SobreNosotrosFormProps) {
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  // Estado inicial
  const [formData, setFormData] = useState<NosotrosData>({
    hero_descripcion:
      initialData?.hero_descripcion ||
      "Somos un complejo deportivo de pádel con más de una década impulsando este deporte en Corrientes, Argentina.",
    historia_titulo: initialData?.historia_titulo || "Nuestra historia",
    historia_contenido:
      initialData?.historia_contenido ||
      "Fundado en 2012, Versori Pádel nació con el sueño de crear un espacio donde el deporte y la amistad se encuentren...",
    historia_imagen_url: initialData?.historia_imagen_url || "",
    valores: initialData?.valores || [
      {
        titulo: "Nuestra pasión",
        contenido: "Promover el pádel como estilo de vida...",
      },
      {
        titulo: "Nuestra comunidad",
        contenido: "Más de 400 jugadores activos eligen nuestro complejo...",
      },
      {
        titulo: "Nuestra ubicación",
        contenido: "Nos encontramos en Corrientes Capital...",
      },
    ],
    frase_cierre:
      initialData?.frase_cierre ||
      "“El pádel no es solo un deporte, es nuestra forma de conectar personas y crear historias.”",
  });

  const handleChange = (campo: keyof NosotrosData, valor: string) => {
    setFormData((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleValorChange = (
    index: number,
    field: "titulo" | "contenido",
    value: string
  ) => {
    const nuevosValores = [...formData.valores];
    nuevosValores[index] = { ...nuevosValores[index], [field]: value };
    setFormData((prev) => ({ ...prev, valores: nuevosValores }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setFormData((prev) => ({
        ...prev,
        historia_imagen_url: URL.createObjectURL(file),
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMessage(null);

    try {
      let finalImageUrl = formData.historia_imagen_url;

      if (selectedImage) {
        const ext = selectedImage.name.split(".").pop();
        const path = `club_${clubId}/nosotros/historia-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(PUBLIC_MEDIA_BUCKET)
          .upload(path, selectedImage, { upsert: true, cacheControl: "3600" });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from(PUBLIC_MEDIA_BUCKET)
          .getPublicUrl(path);

        finalImageUrl = data.publicUrl;
      }

      const { error } = await supabase.from("nosotros").upsert(
        {
          id_club: clubId,
          hero_descripcion: formData.hero_descripcion,
          historia_titulo: formData.historia_titulo,
          historia_contenido: formData.historia_contenido,
          historia_imagen_url: finalImageUrl,
          valores: formData.valores,
          frase_cierre: formData.frase_cierre,
          updated_at: new Date(),
        },
        { onConflict: "id_club" }
      );

      if (error) throw error;

      setStatusMessage({
        type: "success",
        text: "Página actualizada correctamente.",
      });
      setSelectedImage(null);
    } catch (error) {
      console.error("Error guardando:", error);
      setStatusMessage({ type: "error", text: "Error al guardar cambios." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10 -m-6 md:-m-10">
      <div className="max-w-[1600px] mx-auto space-y-8 pb-32">
        {/* HEADER */}
        <div>
          {/* CORRECCIÓN 1: Comillas escapadas (&quot;) */}
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Editar Página &quot;Nosotros&quot;
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Personaliza la historia y valores en{" "}
            <span className="font-semibold text-slate-700">
              {subdominio}.versori.com/nosotros
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          {/* COLUMNA IZQUIERDA: EDITOR */}
          <div className="space-y-6">
            {/* 1. HERO */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-100">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">
                  1. Introducción (Hero)
                </h2>
              </div>
              <div>
                <label
                  htmlFor="hero_desc"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Descripción Principal
                </label>
                <textarea
                  id="hero_desc"
                  name="hero_desc"
                  rows={3}
                  value={formData.hero_descripcion}
                  onChange={(e) =>
                    handleChange("hero_descripcion", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900"
                  placeholder="Breve descripción introductoria..."
                />
              </div>
            </section>

            {/* 2. HISTORIA */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-100">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <ImageIcon className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">
                  2. Nuestra Historia
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="hist_titulo"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Título de Historia
                  </label>
                  <input
                    id="hist_titulo"
                    name="hist_titulo"
                    type="text"
                    value={formData.historia_titulo}
                    onChange={(e) =>
                      handleChange("historia_titulo", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="Nuestra Historia"
                  />
                </div>
                <div>
                  <label
                    htmlFor="hist_cont"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Contenido
                  </label>
                  <textarea
                    id="hist_cont"
                    name="hist_cont"
                    rows={5}
                    value={formData.historia_contenido}
                    onChange={(e) =>
                      handleChange("historia_contenido", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="Cuenta la historia del club..."
                  />
                </div>
                <div>
                  <span className="block text-sm font-semibold text-slate-700 mb-2">
                    Imagen de Historia
                  </span>
                  <div className="relative w-full h-40 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center overflow-hidden group hover:border-emerald-500 transition-all">
                    {formData.historia_imagen_url ? (
                      <Image
                        src={formData.historia_imagen_url}
                        alt="Historia"
                        fill
                        className="object-cover opacity-80"
                      />
                    ) : (
                      <span className="text-slate-400 text-sm">Sin imagen</span>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <label
                        htmlFor="historia_img_input"
                        className="cursor-pointer bg-white/90 text-slate-700 px-4 py-2 rounded-lg shadow-sm font-medium hover:bg-white flex gap-2"
                      >
                        <UploadCloud className="w-5 h-5" /> Cambiar
                        {/* CORRECCIÓN 2: Atributos de accesibilidad en input file */}
                        <input
                          id="historia_img_input"
                          name="historia_img_input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageSelect}
                          title="Subir imagen de historia"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. VALORES */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-100">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Trophy className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">
                  3. Valores y Datos
                </h2>
              </div>

              <div className="grid gap-6">
                {/* Valor 1 */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-2 text-blue-600 font-semibold text-sm">
                    <Trophy className="w-4 h-4" />
                    <label htmlFor="valor1_titulo" className="cursor-pointer">
                      Tarjeta 1 (Pasión)
                    </label>
                  </div>
                  {/* CORRECCIÓN 3: IDs y Titles en inputs dinámicos */}
                  <input
                    id="valor1_titulo"
                    title="Título Tarjeta 1"
                    type="text"
                    value={formData.valores[0].titulo}
                    onChange={(e) =>
                      handleValorChange(0, "titulo", e.target.value)
                    }
                    className="w-full mb-2 px-3 py-2 text-sm border rounded-lg"
                    placeholder="Título"
                  />
                  <textarea
                    id="valor1_contenido"
                    title="Contenido Tarjeta 1"
                    rows={2}
                    value={formData.valores[0].contenido}
                    onChange={(e) =>
                      handleValorChange(0, "contenido", e.target.value)
                    }
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                    placeholder="Contenido"
                  />
                </div>

                {/* Valor 2 */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-2 text-blue-600 font-semibold text-sm">
                    <Users className="w-4 h-4" />
                    <label htmlFor="valor2_titulo">Tarjeta 2 (Comunidad)</label>
                  </div>
                  <input
                    id="valor2_titulo"
                    title="Título Tarjeta 2"
                    type="text"
                    value={formData.valores[1].titulo}
                    onChange={(e) =>
                      handleValorChange(1, "titulo", e.target.value)
                    }
                    className="w-full mb-2 px-3 py-2 text-sm border rounded-lg"
                    placeholder="Título"
                  />
                  <textarea
                    id="valor2_contenido"
                    title="Contenido Tarjeta 2"
                    rows={2}
                    value={formData.valores[1].contenido}
                    onChange={(e) =>
                      handleValorChange(1, "contenido", e.target.value)
                    }
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                    placeholder="Contenido"
                  />
                </div>

                {/* Valor 3 */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-2 text-blue-600 font-semibold text-sm">
                    <MapPin className="w-4 h-4" />
                    <label htmlFor="valor3_titulo">Tarjeta 3 (Ubicación)</label>
                  </div>
                  <input
                    id="valor3_titulo"
                    title="Título Tarjeta 3"
                    type="text"
                    value={formData.valores[2].titulo}
                    onChange={(e) =>
                      handleValorChange(2, "titulo", e.target.value)
                    }
                    className="w-full mb-2 px-3 py-2 text-sm border rounded-lg"
                    placeholder="Título"
                  />
                  <textarea
                    id="valor3_contenido"
                    title="Contenido Tarjeta 3"
                    rows={2}
                    value={formData.valores[2].contenido}
                    onChange={(e) =>
                      handleValorChange(2, "contenido", e.target.value)
                    }
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                    placeholder="Contenido"
                  />
                </div>
              </div>
            </section>

            {/* 4. FOOTER */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-100">
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <Quote className="w-5 h-5 text-yellow-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">
                  4. Frase de Cierre
                </h2>
              </div>
              <label htmlFor="frase_cierre" className="sr-only">
                Frase de cierre
              </label>
              <textarea
                id="frase_cierre"
                name="frase_cierre"
                title="Frase de cierre del footer"
                rows={2}
                value={formData.frase_cierre}
                onChange={(e) => handleChange("frase_cierre", e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900 italic"
                placeholder="Escribe una frase inspiradora..."
              />
            </section>

            {/* BOTÓN GUARDAR */}
            <div className="hidden md:flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white text-lg font-bold px-10 py-4 rounded-xl transition-all shadow-lg hover:shadow-green-600/30 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
              >
                {saving ? (
                  <Loader2 className="animate-spin w-6 h-6" />
                ) : (
                  <Save className="w-6 h-6" />
                )}
                {saving ? "Guardando..." : "Guardar Página"}
              </button>
            </div>
          </div>

          {/* COLUMNA DERECHA: PREVIEW */}
          <div className="xl:col-span-1 xl:sticky xl:top-6">
            <div className="bg-[#0b0d12] rounded-[2rem] border-[10px] border-slate-800 shadow-2xl overflow-hidden h-[850px] flex flex-col relative">
              <div className="bg-slate-800 px-5 py-4 flex items-center justify-center relative shrink-0">
                <div className="bg-slate-700 text-slate-300 text-xs font-medium px-4 py-1.5 rounded-full flex items-center gap-2">
                  🔒 {subdominio}.versori.com/nosotros
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-b from-[#0b0d12] to-[#0e1a2b] text-gray-200">
                {/* Hero Preview */}
                <section className="relative w-full py-16 text-center border-b border-blue-900/30 px-4">
                  <h1 className="text-3xl font-bold tracking-wide text-white mb-4">
                    » NOSOTROS «
                  </h1>
                  <p className="max-w-lg mx-auto text-sm text-gray-400 leading-relaxed">
                    {formData.hero_descripcion}
                  </p>
                </section>

                {/* Historia Preview */}
                <section className="py-12 border-b border-blue-900/30 px-4">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-6">
                      {formData.historia_titulo}
                    </h2>
                    <p className="text-gray-400 text-sm leading-relaxed mb-8">
                      {formData.historia_contenido}
                    </p>
                    {formData.historia_imagen_url && (
                      <div className="relative w-full h-48 rounded-xl overflow-hidden shadow-lg border border-blue-900/40">
                        <Image
                          src={formData.historia_imagen_url}
                          alt="Historia"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                </section>

                {/* Valores Preview */}
                <section className="py-12 bg-[#0d1522] px-4">
                  <div className="grid gap-8 text-center">
                    <div className="flex flex-col items-center">
                      <Trophy className="text-blue-400 w-8 h-8 mb-2" />
                      <h3 className="text-white font-semibold text-base mb-1">
                        {formData.valores[0].titulo}
                      </h3>
                      <p className="text-gray-400 text-xs max-w-xs">
                        {formData.valores[0].contenido}
                      </p>
                    </div>
                    <div className="flex flex-col items-center">
                      <Users className="text-blue-400 w-8 h-8 mb-2" />
                      <h3 className="text-white font-semibold text-base mb-1">
                        {formData.valores[1].titulo}
                      </h3>
                      <p className="text-gray-400 text-xs max-w-xs">
                        {formData.valores[1].contenido}
                      </p>
                    </div>
                    <div className="flex flex-col items-center">
                      <MapPin className="text-blue-400 w-8 h-8 mb-2" />
                      <h3 className="text-white font-semibold text-base mb-1">
                        {formData.valores[2].titulo}
                      </h3>
                      <p className="text-gray-400 text-xs max-w-xs">
                        {formData.valores[2].contenido}
                      </p>
                    </div>
                  </div>
                </section>

                <footer className="py-12 text-center border-t border-blue-900/30 px-4">
                  <p className="text-gray-400 text-sm italic">
                    {formData.frase_cierre}
                  </p>
                </footer>
              </div>
            </div>
            <p className="text-center text-sm text-slate-500 mt-4 font-medium">
              Vista previa en tiempo real
            </p>
          </div>
        </div>

        {/* Notificación Toast */}
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
                <Save className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-lg">
                  {statusMessage.type === "success" ? "¡Guardado!" : "Error"}
                </p>
                <p className="font-medium">{statusMessage.text}</p>
              </div>
            </div>
          </div>
        )}

        {/* Botón Móvil */}
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
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-sm active:bg-green-800 transition-colors"
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
