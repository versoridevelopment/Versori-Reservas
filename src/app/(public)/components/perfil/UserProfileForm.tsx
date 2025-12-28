"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Save,
  Loader2,
  Smile,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ProfileData {
  id_usuario: string;
  nombre: string | null;
  apellido: string | null;
  telefono: string | null;
  apodo?: string | null;
  bio?: string | null;
  fecha_nacimiento?: string | null;
  genero?: string | null;
}

interface Props {
  initialData: ProfileData | null;
  email: string;
  userId: string;
}

export default function UserProfileForm({ initialData, email, userId }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState<ProfileData>(
    initialData || {
      id_usuario: userId,
      nombre: "",
      apellido: "",
      telefono: "",
      apodo: "",
      bio: "",
      fecha_nacimiento: "",
      genero: "",
    }
  );

  const handleChange = (field: keyof ProfileData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // LLAMADA AL SERVIDOR (API ROUTE)
      // Ya no llamamos a supabase directamente aquí
      const response = await fetch("/api/user/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          apellido: formData.apellido,
          telefono: formData.telefono,
          apodo: formData.apodo,
          bio: formData.bio,
          fecha_nacimiento: formData.fecha_nacimiento,
          genero: formData.genero,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al actualizar");
      }

      alert("¡Perfil actualizado correctamente!");
      router.refresh(); // Actualiza la UI del servidor (ej: nombre en el navbar)
    } catch (error: any) {
      console.error(error);
      alert("Error: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#111318] border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl">
      {/* SECCIÓN 1: DATOS OBLIGATORIOS / BÁSICOS */}
      <div className="space-y-8">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <User className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold text-white">Información Básica</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nombre */}
          <div className="space-y-2">
            <label
              htmlFor="nombre"
              className="text-sm font-medium text-gray-400"
            >
              Nombre
            </label>
            <input
              id="nombre"
              type="text"
              value={formData.nombre || ""}
              onChange={(e) => handleChange("nombre", e.target.value)}
              className="w-full bg-[#0b0d12] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Tu nombre"
              title="Tu nombre"
              aria-label="Nombre"
            />
          </div>

          {/* Apellido */}
          <div className="space-y-2">
            <label
              htmlFor="apellido"
              className="text-sm font-medium text-gray-400"
            >
              Apellido
            </label>
            <input
              id="apellido"
              type="text"
              value={formData.apellido || ""}
              onChange={(e) => handleChange("apellido", e.target.value)}
              className="w-full bg-[#0b0d12] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Tu apellido"
              title="Tu apellido"
              aria-label="Apellido"
            />
          </div>

          {/* Email (Read Only) */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-400 flex items-center gap-2"
            >
              <Mail className="w-3 h-3" /> Email (No editable)
            </label>
            <input
              id="email"
              type="text"
              value={email}
              disabled
              className="w-full bg-[#1a1d24] border border-white/5 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
              title="Correo electrónico no editable"
              placeholder="email@ejemplo.com"
              aria-label="Correo electrónico"
            />
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <label
              htmlFor="telefono"
              className="text-sm font-medium text-gray-400 flex items-center gap-2"
            >
              <Phone className="w-3 h-3" /> Teléfono
            </label>
            <input
              id="telefono"
              type="text"
              value={formData.telefono || ""}
              onChange={(e) => handleChange("telefono", e.target.value)}
              className="w-full bg-[#0b0d12] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="+54 9..."
              title="Tu número de teléfono"
              aria-label="Teléfono"
            />
          </div>
        </div>

        {/* SECCIÓN 2: PERSONALIZACIÓN (OPCIONALES) */}
        <div className="flex items-center gap-3 border-b border-white/5 pb-4 pt-4">
          <Smile className="w-6 h-6 text-purple-500" />
          <h2 className="text-xl font-bold text-white">Sobre Mí</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Apodo */}
          <div className="space-y-2">
            <label
              htmlFor="apodo"
              className="text-sm font-medium text-gray-400"
            >
              Apodo / Nickname
            </label>
            <input
              id="apodo"
              type="text"
              value={formData.apodo || ""}
              onChange={(e) => handleChange("apodo", e.target.value)}
              className="w-full bg-[#0b0d12] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="¿Cómo te dicen?"
              title="Tu apodo"
              aria-label="Apodo"
            />
          </div>

          {/* Fecha Nacimiento */}
          <div className="space-y-2">
            <label
              htmlFor="fecha_nacimiento"
              className="text-sm font-medium text-gray-400 flex items-center gap-2"
            >
              <Calendar className="w-3 h-3" /> Fecha de Nacimiento
            </label>
            <input
              id="fecha_nacimiento"
              type="date"
              value={formData.fecha_nacimiento || ""}
              onChange={(e) => handleChange("fecha_nacimiento", e.target.value)}
              className="w-full bg-[#0b0d12] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors [color-scheme:dark]"
              title="Selecciona tu fecha de nacimiento"
              placeholder="dd/mm/aaaa"
              aria-label="Fecha de nacimiento"
            />
          </div>

          {/* Bio */}
          <div className="col-span-1 md:col-span-2 space-y-2">
            <label
              htmlFor="bio"
              className="text-sm font-medium text-gray-400 flex items-center gap-2"
            >
              <FileText className="w-3 h-3" /> Biografía Corta
            </label>
            <textarea
              id="bio"
              rows={3}
              value={formData.bio || ""}
              onChange={(e) => handleChange("bio", e.target.value)}
              className="w-full bg-[#0b0d12] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
              placeholder="Cuéntanos un poco sobre vos, tu nivel de juego, etc."
              title="Biografía corta"
              aria-label="Biografía corta"
            />
          </div>
        </div>

        {/* BOTÓN GUARDAR */}
        <div className="flex justify-end pt-6 border-t border-white/5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            title="Guardar cambios del perfil"
            aria-label="Guardar cambios"
          >
            {saving ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
