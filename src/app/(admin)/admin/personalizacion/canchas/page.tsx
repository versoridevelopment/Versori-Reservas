"use client";
import { useState } from "react";
import Image from "next/image";

type Cancha = {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
};

export default function CanchasPage() {
  const [canchas, setCanchas] = useState<Cancha[]>([
    {
      id: 1,
      nombre: "Cancha 1",
      descripcion: "Interior climatizada",
      precio: 10000,
      imagen: "/reserva/cancha_interior.jpg",
    },
    {
      id: 2,
      nombre: "Cancha 2",
      descripcion: "Excelente iluminación LED",
      precio: 12000,
      imagen: "/reserva/cancha_interior.jpg",
    },
  ]);

  const handleChange = (
    id: number,
    campo: keyof Cancha,
    valor: string | number
  ) => {
    setCanchas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [campo]: valor } : c))
    );
  };

  const handleImageChange = (
    id: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      handleChange(id, "imagen", preview);
    }
  };

  return (
    <div className="bg-white shadow rounded-xl p-8">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">
        ⚙️ Administrar canchas
      </h2>

      <div className="grid md:grid-cols-2 gap-8">
        {canchas.map((cancha) => (
          <div
            key={cancha.id}
            className="relative border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="relative w-full h-48 bg-gray-100 group">
              <Image
                src={cancha.imagen}
                alt={cancha.nombre}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
              <label
                htmlFor={`imagen-${cancha.id}`}
                className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded cursor-pointer opacity-0 group-hover:opacity-100 transition"
              >
                Cambiar imagen
              </label>
              <input
                id={`imagen-${cancha.id}`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageChange(cancha.id, e)}
              />
            </div>

            <div className="p-4 space-y-3">
              <input
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#0d1b2a] outline-none"
                value={cancha.nombre}
                onChange={(e) =>
                  handleChange(cancha.id, "nombre", e.target.value)
                }
              />
              <textarea
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#0d1b2a] outline-none resize-none"
                value={cancha.descripcion}
                onChange={(e) =>
                  handleChange(cancha.id, "descripcion", e.target.value)
                }
              />
              <div className="flex items-center justify-between">
                <input
                  type="number"
                  className="w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#0d1b2a] outline-none"
                  value={cancha.precio}
                  onChange={(e) =>
                    handleChange(cancha.id, "precio", Number(e.target.value))
                  }
                />
                <button className="bg-[#0d1b2a] text-white px-4 py-2 rounded-md hover:bg-[#1b263b] transition">
                  Guardar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
