"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/supabaseClient";

interface ProfileData {
  id_usuario: string;
  nombre: string;
  apellido: string;
  apodo: string;
  telefono: string;
  bio: string;
  fecha_nacimiento: string;
  genero: string;
  email: string;
}

export default function UsuarioPage() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{
    type: string;
    content: string;
  } | null>(null);

  // Estado inicial
  const [profile, setProfile] = useState<ProfileData>({
    id_usuario: "",
    nombre: "",
    apellido: "",
    apodo: "",
    telefono: "",
    bio: "",
    fecha_nacimiento: "",
    genero: "",
    email: "",
  });

  // 1. Cargar datos al montar
  useEffect(() => {
    const getProfile = async () => {
      try {
        setLoading(true);
        // Verificar sesión
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          // Si no hay usuario, podrías redirigir al login aquí
          console.log("No hay usuario logueado");
          return;
        }

        // Buscar perfil
        const { data, error } = await supabase
          .from("perfiles")
          .select("*")
          .eq("id_usuario", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 es "no rows returned", que es aceptable si es nuevo
          throw error;
        }

        // Rellenar estado
        if (data) {
          setProfile({
            id_usuario: user.id,
            nombre: data.nombre || "",
            apellido: data.apellido || "",
            apodo: data.apodo || "",
            telefono: data.telefono || "",
            bio: data.bio || "",
            fecha_nacimiento: data.fecha_nacimiento || "",
            genero: data.genero || "",
            email: user.email || "", // Email desde Auth
          });
        } else {
          // Si no existe perfil aun, seteamos al menos el email y ID
          setProfile((prev) => ({
            ...prev,
            id_usuario: user.id,
            email: user.email || "",
          }));
        }
      } catch (error: any) {
        console.error("Error cargando perfil:", error.message);
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, []);

  // 2. Manejar cambios en inputs
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 3. Guardar cambios (Upsert)
  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setMessage(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user logged in");

      // Preparamos objeto para enviar (quitando email que es read-only en la tabla normalmente)
      const updates = {
        id_usuario: user.id,
        nombre: profile.nombre,
        apellido: profile.apellido,
        apodo: profile.apodo,
        telefono: profile.telefono,
        bio: profile.bio,
        fecha_nacimiento: profile.fecha_nacimiento || null,
        genero: profile.genero,
        updated_at: new Date().toISOString(), // Formato ISO para timestamptz
      };

      const { error } = await supabase.from("perfiles").upsert(updates);

      if (error) throw error;
      setMessage({
        type: "success",
        content: "¡Perfil actualizado correctamente!",
      });
    } catch (error: any) {
      setMessage({
        type: "error",
        content: error.message || "Error al actualizar",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Cargando...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white border border-gray-200 rounded-lg shadow-sm mt-10">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">
        Configuración de Perfil
      </h1>

      {message && (
        <div
          className={`p-4 mb-4 rounded text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.content}
        </div>
      )}

      <form onSubmit={updateProfile} className="space-y-5">
        {/* Email Read-only */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="email"
            type="text"
            title="Dirección de correo electrónico"
            placeholder="usuario@ejemplo.com"
            value={profile.email}
            disabled
            className="mt-1 block w-full bg-gray-100 border-gray-300 rounded-md shadow-sm p-2 text-gray-500 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1">
            El email se gestiona desde la configuración de cuenta.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="nombre"
              className="block text-sm font-medium text-gray-700"
            >
              Nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              title="Introduce tu nombre"
              placeholder="Ej: Juan"
              value={profile.nombre}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div>
            <label
              htmlFor="apellido"
              className="block text-sm font-medium text-gray-700"
            >
              Apellido
            </label>
            <input
              id="apellido"
              name="apellido"
              title="Introduce tu apellido"
              placeholder="Ej: Pérez"
              value={profile.apellido}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="apodo"
              className="block text-sm font-medium text-gray-700"
            >
              Apodo
            </label>
            <input
              id="apodo"
              name="apodo"
              title="Introduce un apodo"
              placeholder="Ej: Juancito"
              value={profile.apodo}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div>
            <label
              htmlFor="genero"
              className="block text-sm font-medium text-gray-700"
            >
              Género
            </label>
            <select
              id="genero"
              name="genero"
              title="Selecciona tu género"
              value={profile.genero}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-md p-2 bg-white"
            >
              <option value="">Seleccionar...</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="telefono"
              className="block text-sm font-medium text-gray-700"
            >
              Teléfono
            </label>
            <input
              id="telefono"
              type="tel"
              name="telefono"
              title="Introduce tu número de teléfono"
              placeholder="+54 9 11 ..."
              value={profile.telefono}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div>
            <label
              htmlFor="fecha_nacimiento"
              className="block text-sm font-medium text-gray-700"
            >
              Fecha Nacimiento
            </label>
            <input
              id="fecha_nacimiento"
              type="date"
              name="fecha_nacimiento"
              title="Selecciona tu fecha de nacimiento"
              placeholder="dd/mm/aaaa"
              value={profile.fecha_nacimiento}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="bio"
            className="block text-sm font-medium text-gray-700"
          >
            Biografía
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            title="Escribe una breve biografía"
            placeholder="Cuéntanos un poco sobre ti..."
            value={profile.bio}
            onChange={handleChange}
            className="mt-1 w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={updating}
            className={`px-6 py-2 rounded-md text-white font-medium transition-colors ${
              updating
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-black hover:bg-gray-800"
            }`}
          >
            {updating ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
