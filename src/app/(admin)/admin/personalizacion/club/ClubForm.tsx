// src/app/(admin)/admin/personalizacion/club/ClubForm.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/supabaseClient";
import { Loader2, UploadCloud, Save } from "lucide-react";
import type { Club } from "@/lib/ObetenerClubUtils/getClubBySubdomain";
import {
  buildLogoPath,
  PUBLIC_MEDIA_BUCKET,
  clubBrandingPath,
} from "@/lib/storage/paths";

interface ClubFormProps {
  initialData: Club;
}

export default function ClubForm({ initialData }: ClubFormProps) {
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    nombre: initialData.nombre,
    logo: initialData.logo_url || "",
    colorPrincipal: initialData.color_primario || "#0d1b2a",
  });

  const handleChange = (campo: string, valor: string) => {
    setFormData((prev) => ({ ...prev, [campo]: valor }));
    if (statusMessage) setStatusMessage(null);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      handleChange("logo", previewUrl);
    }
  };

  const uploadLogo = async (file: File) => {
    // Generamos el path usando tu lógica centralizada
    const path = buildLogoPath(initialData.id_club, file);

    const { error: uploadError } = await supabase.storage
      .from(PUBLIC_MEDIA_BUCKET)
      .upload(path, file, {
        upsert: true,
        cacheControl: "3600",
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(PUBLIC_MEDIA_BUCKET)
      .getPublicUrl(path);

    return data.publicUrl;
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMessage(null);

    try {
      let finalLogoUrl = formData.logo;

      if (selectedFile) {
        finalLogoUrl = await uploadLogo(selectedFile);
      }

      const { error } = await supabase
        .from("clubes")
        .update({
          nombre: formData.nombre,
          logo_url: finalLogoUrl,
          color_primario: formData.colorPrincipal,
        })
        .eq("id_club", initialData.id_club);

      if (error) throw error;

      setStatusMessage({
        type: "success",
        text: "Cambios guardados correctamente.",
      });
      setSelectedFile(null);
    } catch (error) {
      console.error("Error guardando:", error);
      setStatusMessage({ type: "error", text: "Error al guardar." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 rounded-lg">
          <UploadCloud className="text-blue-600 w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Personalización: {initialData.subdominio}
          </h2>
          <p className="text-sm text-gray-500">Gestión de identidad visual.</p>
        </div>
      </div>

      {/* Sección Logo */}
      <div className="flex items-center gap-8 mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
        <div className="relative w-32 h-32 bg-white rounded-full overflow-hidden border-2 border-gray-200 shadow-sm flex-shrink-0 flex items-center justify-center">
          {formData.logo ? (
            <Image
              src={formData.logo}
              alt="Logo actual"
              fill
              className="object-contain p-2"
            />
          ) : (
            <span className="text-xs text-gray-400">Sin Logo</span>
          )}
        </div>

        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-1">Logotipo del Club</h3>
          <p className="text-sm text-gray-500 mb-4">
            Carpeta destino:{" "}
            <code className="text-xs bg-gray-200 px-1 rounded">
              {clubBrandingPath(initialData.id_club)}
            </code>
          </p>
          <label
            htmlFor="logo-upload"
            className="cursor-pointer inline-flex items-center gap-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition px-4 py-2 rounded-lg shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            Cambiar imagen
            {/* Input oculto vinculado al label mediante htmlFor + id */}
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
              title="Subir nuevo logo"
            />
          </label>
        </div>
      </div>

      {/* Inputs Nombre y Color */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          {/* CORRECCIÓN DE ACCESIBILIDAD: htmlFor vinculado al id del input */}
          <label
            htmlFor="nombre-club"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Nombre del club
          </label>
          <input
            id="nombre-club"
            type="text"
            value={formData.nombre}
            onChange={(e) => handleChange("nombre", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            placeholder="Ej: Versori Padel Club"
          />
        </div>

        <div>
          {/* CORRECCIÓN DE ACCESIBILIDAD: htmlFor vinculado al id del input */}
          <label
            htmlFor="color-principal"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Color de marca
          </label>
          <div className="flex items-center gap-3 border border-gray-300 rounded-lg p-2 pr-4 bg-white">
            <input
              id="color-principal"
              type="color"
              value={formData.colorPrincipal}
              onChange={(e) => handleChange("colorPrincipal", e.target.value)}
              className="w-10 h-10 cursor-pointer rounded border-0 p-0"
              style={{ background: "none" }}
              title="Seleccionar color principal"
            />
            {/* El title arriba corrige el error específico "Element has no title attribute" */}
            <span className="font-mono text-sm text-gray-600 uppercase flex-1">
              {formData.colorPrincipal}
            </span>
          </div>
        </div>
      </div>

      {/* Botón Guardar */}
      <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-end gap-4">
        {statusMessage && (
          <div
            className={`text-sm px-4 py-2 rounded-md ${
              statusMessage.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {statusMessage.type === "success" ? "✅ " : "❌ "}
            {statusMessage.text}
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#0d1b2a] hover:bg-[#1b263b] text-white px-8 py-2.5 rounded-lg transition-all shadow-md disabled:opacity-70"
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin w-4 h-4" /> Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Guardar Cambios
            </>
          )}
        </button>
      </div>
    </div>
  );
}
