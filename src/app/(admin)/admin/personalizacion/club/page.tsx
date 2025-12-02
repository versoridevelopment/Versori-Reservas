"use client";

import { useState } from "react";
import Image from "next/image";

export default function ClubPersonalizacionPage() {
  const [club, setClub] = useState({
    nombre: "Versori Padel Club",
    logo: "/favicon.ico",
    colorPrincipal: "#0d1b2a",
  });

  const handleChange = (campo: string, valor: string) => {
    setClub((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      handleChange("logo", preview);
    }
  };

  const handleSave = () => {
    alert(
      "✅ Cambios guardados correctamente (en el futuro se guardarán en la BD)."
    );
  };

  return (
    <div className="bg-white shadow rounded-xl p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">
        ⚙️ Personalización del Club
      </h2>

      {/* Logo */}
      <div className="flex items-center gap-6 mb-6">
        <div className="relative w-24 h-24 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
          <Image
            src={club.logo}
            alt="Logo del club"
            fill
            className="object-contain p-2"
          />
        </div>

        <div>
          <label
            htmlFor="logo"
            className="cursor-pointer text-sm text-white bg-[#0d1b2a] hover:bg-[#1b263b] transition px-4 py-2 rounded-md inline-block"
          >
            Cambiar logo
          </label>
          <input
            id="logo"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoChange}
          />
        </div>
      </div>

      {/* Nombre */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre del club
        </label>
        <input
          type="text"
          value={club.nombre}
          onChange={(e) => handleChange("nombre", e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#0d1b2a] outline-none"
        />
      </div>

      {/* Color principal */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Color principal del sitio
        </label>
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={club.colorPrincipal}
            onChange={(e) => handleChange("colorPrincipal", e.target.value)}
            className="w-12 h-12 cursor-pointer border border-gray-300 rounded"
          />
          <span className="text-sm text-gray-600">{club.colorPrincipal}</span>
        </div>
      </div>

      {/* Vista previa */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">
          Vista previa
        </h3>
        <div
          className="rounded-lg p-6 text-white font-semibold text-center"
          style={{ backgroundColor: club.colorPrincipal }}
        >
          {club.nombre}
        </div>
      </div>

      {/* Botón Guardar */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          className="bg-[#0d1b2a] hover:bg-[#1b263b] text-white px-6 py-2 rounded-md transition"
        >
          Guardar cambios
        </button>
      </div>
    </div>
  );
}
