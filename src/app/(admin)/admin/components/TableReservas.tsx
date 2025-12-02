// src/app/admin/components/TableReservas.tsx
"use client";

export function TableReservas() {
  const reservas = [
    {
      id: 1,
      cancha: "Cancha 1",
      usuario: "Carlos Gómez",
      fecha: "2025-10-19",
      hora: "18:00",
      estado: "Confirmada",
    },
    {
      id: 2,
      cancha: "Cancha 2",
      usuario: "María López",
      fecha: "2025-10-20",
      hora: "19:00",
      estado: "Pendiente",
    },
  ];

  return (
    <div className="bg-white shadow rounded-xl p-4">
      <h2 className="text-lg font-semibold mb-3">🏐 Reservas recientes</h2>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th className="py-2">Cancha</th>
            <th className="py-2">Usuario</th>
            <th className="py-2">Fecha</th>
            <th className="py-2">Hora</th>
            <th className="py-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {reservas.map((r) => (
            <tr key={r.id} className="border-b hover:bg-gray-50">
              <td className="py-2">{r.cancha}</td>
              <td className="py-2">{r.usuario}</td>
              <td className="py-2">{r.fecha}</td>
              <td className="py-2">{r.hora}</td>
              <td className="py-2">{r.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
