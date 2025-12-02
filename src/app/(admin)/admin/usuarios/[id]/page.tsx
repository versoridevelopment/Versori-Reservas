"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type Reserva = {
  id: number;
  fechaInicio: string;
  fechaFin: string;
  precioTotal: number;
  cancha: string;
  estado: "Activa" | "Finalizada" | "Cancelada";
};

type Usuario = {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string;
  rol: string;
  activo: boolean;
  fotoPerfil: string;
  fechaCreacion: string;
  reservas: Reserva[];
};

export default function UsuarioDetallePage() {
  const params = useParams();
  const userId = Number(params.id);

  // Simulamos datos (más adelante se traerán desde la BD)
  const usuario: Usuario = {
    id: userId,
    nombre: "Neil",
    apellido: "Sims",
    correo: "neil@windster.com",
    telefono: "+54 379 4000001",
    rol: "Cliente",
    activo: true,
    fotoPerfil: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    fechaCreacion: "2024-09-14T14:23:00Z",
    reservas: [
      {
        id: 1,
        fechaInicio: "2025-10-19T10:00:00",
        fechaFin: "2025-10-19T11:30:00",
        precioTotal: 15000,
        cancha: "Cancha 1",
        estado: "Activa",
      },
      {
        id: 2,
        fechaInicio: "2025-10-10T15:00:00",
        fechaFin: "2025-10-10T16:30:00",
        precioTotal: 12000,
        cancha: "Cancha 2",
        estado: "Finalizada",
      },
    ],
  };

  const formatearFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const calcularDuracion = (inicio: string, fin: string) => {
    const diffMs = new Date(fin).getTime() - new Date(inicio).getTime();
    const minutos = Math.floor(diffMs / 60000);
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas > 0 ? `${horas}h` : ""}${mins > 0 ? ` ${mins}min` : ""}`;
  };

  return (
    <div className="bg-white shadow rounded-xl p-6">
      {/* ENCABEZADO */}
      <div className="flex items-center gap-6 mb-8">
        <div className="relative w-20 h-20">
          <Image
            src={usuario.fotoPerfil}
            alt={usuario.nombre}
            fill
            className="rounded-full border object-cover"
          />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">
            {usuario.nombre} {usuario.apellido}
          </h2>
          <p className="text-sm text-gray-500">{usuario.correo}</p>
          <p className="text-sm text-gray-500">
            Tel: {usuario.telefono || "No especificado"}
          </p>
          <p className="text-xs italic text-gray-400">
            {usuario.rol} — Creado el {formatearFecha(usuario.fechaCreacion)}
          </p>
        </div>
      </div>

      {/* ESTADO */}
      <div className="mb-8">
        <span
          className={`px-4 py-1 rounded-full text-sm font-medium ${
            usuario.activo
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {usuario.activo ? "Cuenta activa" : "Cuenta inactiva"}
        </span>
      </div>

      {/* RESERVAS */}
      <h3 className="text-lg font-semibold mb-4">
        🗓️ Reservas de este cliente
      </h3>

      {usuario.reservas.length > 0 ? (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b text-sm text-gray-600">
              <th className="py-2">Cancha</th>
              <th className="py-2">Inicio</th>
              <th className="py-2">Fin</th>
              <th className="py-2">Duración</th>
              <th className="py-2">Estado</th>
              <th className="py-2 text-right">Precio</th>
            </tr>
          </thead>
          <tbody>
            {usuario.reservas.map((r) => (
              <tr key={r.id} className="border-b hover:bg-gray-50 text-sm">
                <td className="py-3">{r.cancha}</td>
                <td className="py-3">
                  {new Date(r.fechaInicio).toLocaleString("es-AR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </td>
                <td className="py-3">
                  {new Date(r.fechaFin).toLocaleString("es-AR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </td>
                <td className="py-3">
                  {calcularDuracion(r.fechaInicio, r.fechaFin)}
                </td>
                <td className="py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      r.estado === "Activa"
                        ? "bg-green-100 text-green-800"
                        : r.estado === "Finalizada"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {r.estado}
                  </span>
                </td>
                <td className="py-3 text-right font-semibold">
                  ${r.precioTotal.toLocaleString("es-AR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500 italic">
          Este usuario no tiene reservas registradas.
        </p>
      )}

      {/* ENLACES */}
      <div className="mt-8 flex gap-4">
        <Link
          href="/admin/usuarios"
          className="text-sm text-[#0d1b2a] hover:underline"
        >
          ← Volver a usuarios
        </Link>
        <Link
          href="/admin/reservas"
          className="text-sm text-[#0d1b2a] hover:underline"
        >
          Ver todas las reservas →
        </Link>
      </div>
    </div>
  );
}
