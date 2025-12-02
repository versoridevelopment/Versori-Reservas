"use client";
import Image from "next/image";
import { useState } from "react";

export default function UsuarioPage() {
  // Simulamos datos cargados desde la tabla 'profiles' o 'usuarios'
  const [user, setUser] = useState({
    nombre: "Juan",
    apellido: "Cruz",
    telefono: "3794000000",
    created_at: "2024-05-12",
    updated_at: "2025-10-20",
    fotoPerfil: "https://thispersondoesnotexist.com",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    alert(`Datos guardados:\n${JSON.stringify(user, null, 2)}`);
    // Aquí luego irá la lógica con Supabase o Prisma
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-50 py-10">
      <div className="bg-white shadow-md rounded-4xl p-8 w-full max-w-2xl">
        {/* Foto de perfil */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-32 h-32">
            <Image
              src={user.fotoPerfil}
              alt="Foto de perfil"
              fill
              className="rounded-full object-cover border-4 border-gray-200"
            />
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-gray-800">
            {user.nombre} {user.apellido}
          </h1>
          <p className="text-sm text-gray-500 italic">Administrador</p>
        </div>

        {/* Formulario de edición */}
        <form className="space-y-5">
          <div>
            <label className="block text-sm text-gray-600">Nombre</label>
            <input
              type="text"
              name="nombre"
              value={user.nombre}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 mt-1 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600">Apellido</label>
            <input
              type="text"
              name="apellido"
              value={user.apellido}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 mt-1 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600">
              Teléfono <span className="text-gray-400 text-xs">(opcional)</span>
            </label>
            <input
              type="text"
              name="telefono"
              value={user.telefono}
              onChange={handleChange}
              placeholder="Ej: 3794000000"
              className="w-full border rounded-md px-3 py-2 mt-1 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Fecha de creación - solo informativa */}
          <div className="pt-3">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-700">
                Cuenta creada el:
              </span>{" "}
              {new Date(user.created_at).toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Botón de guardar */}
          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              className="bg-[#0d1b2a] text-white px-5 py-2 rounded-md hover:bg-[#1b263b] transition"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
