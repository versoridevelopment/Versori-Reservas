"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Reserva = {
  id: number;
  fechaInicio: string;
  fechaFin: string;
  precioTotal: number;
  clienteId: number;
  cliente: string;
  telefono: string;
  cancha: string;
  estado: "Activa" | "Finalizada" | "Cancelada";
  metodoPago: string;
  imagenCancha: string;
};

export default function ReservasPage() {
  const [userRole] = useState<"Administrador" | "Cajero">("Administrador");

  const reservas: Reserva[] = [
    {
      id: 1,
      fechaInicio: "2025-10-19T10:00:00",
      fechaFin: "2025-10-19T11:30:00",
      precioTotal: 15000,
      clienteId: 1,
      cliente: "Neil Sims",
      telefono: "+54 379 4000001",
      cancha: "Cancha 1",
      estado: "Activa",
      metodoPago: "MercadoPago",
      imagenCancha: "/reserva/cancha_interior.jpg",
    },
    {
      id: 2,
      fechaInicio: "2025-10-18T15:00:00",
      fechaFin: "2025-10-18T16:00:00",
      precioTotal: 10000,
      clienteId: 3,
      cliente: "Thomas Lean",
      telefono: "+54 379 4000003",
      cancha: "Cancha 2",
      estado: "Finalizada",
      metodoPago: "Efectivo",
      imagenCancha: "/reserva/cancha_interior.jpg",
    },
    {
      id: 3,
      fechaInicio: "2025-10-17T19:00:00",
      fechaFin: "2025-10-17T20:30:00",
      precioTotal: 12000,
      clienteId: 2,
      cliente: "Roberta Casas",
      telefono: "+54 379 4000002",
      cancha: "Cancha 3",
      estado: "Cancelada",
      metodoPago: "Tarjeta",
      imagenCancha: "/reserva/cancha_interior.jpg",
    },
  ];

  // Restricción por rol
  const reservasVisibles =
    userRole === "Administrador"
      ? reservas
      : reservas.map((r) => ({
          ...r,
          metodoPago: "—",
          precioTotal: 0,
        }));

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calcularDuracion = (inicio: string, fin: string) => {
    const diffMs = new Date(fin).getTime() - new Date(inicio).getTime();
    const minutos = Math.floor(diffMs / 60000);
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas > 0 ? `${horas}h` : ""}${mins > 0 ? ` ${mins}min` : ""}`;
  };

  return (
    <div className="bg-white shadow rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-6">📅 Reservas</h2>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b text-sm text-gray-600">
            <th className="py-2">Cancha</th>
            <th className="py-2">Cliente</th>
            <th className="py-2">Teléfono</th>
            <th className="py-2">Inicio</th>
            <th className="py-2">Fin</th>
            <th className="py-2">Duración</th>
            <th className="py-2">Estado</th>
            <th className="py-2">Método pago</th>
            <th className="py-2 text-right">Precio total</th>
          </tr>
        </thead>
        <tbody>
          {reservasVisibles.map((r) => (
            <tr key={r.id} className="border-b hover:bg-gray-50 text-sm">
              {/* Cancha */}
              <td className="py-3 flex items-center gap-3">
                <div className="relative w-14 h-10">
                  <Image
                    src={r.imagenCancha}
                    alt={r.cancha}
                    fill
                    className="rounded-md object-cover border"
                  />
                </div>
                <span className="font-medium">{r.cancha}</span>
              </td>

              {/* Cliente */}
              <td className="py-3">
                <Link
                  href={`/admin/usuarios/${r.clienteId}`}
                  className="text-[#0d1b2a] hover:underline font-medium"
                >
                  {r.cliente}
                </Link>
              </td>

              <td className="py-3">{r.telefono}</td>

              {/* Fechas */}
              <td className="py-3">{formatearFecha(r.fechaInicio)}</td>
              <td className="py-3">{formatearFecha(r.fechaFin)}</td>
              <td className="py-3 text-gray-700">
                {calcularDuracion(r.fechaInicio, r.fechaFin)}
              </td>

              {/* Estado */}
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

              {/* Método pago */}
              <td className="py-3 text-gray-700">{r.metodoPago}</td>

              {/* Precio */}
              <td className="py-3 text-right font-semibold">
                {r.precioTotal > 0
                  ? `$${r.precioTotal.toLocaleString("es-AR")}`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
