import { MoreHorizontal, Calendar, Clock, CheckCircle2 } from "lucide-react";

export function BookingTable({ data }: { data: any[] }) {
  if (!data || data.length === 0)
    return <div className="text-gray-400 p-4">Sin reservas próximas.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-400 uppercase bg-slate-50/50">
          <tr>
            <th className="px-6 py-4 rounded-tl-xl">Cliente</th>
            <th className="px-6 py-4">Cancha / Info</th>
            <th className="px-6 py-4">Fecha</th>
            <th className="px-6 py-4">Precio</th>
            <th className="px-6 py-4">Estado</th>
            <th className="px-6 py-4 rounded-tr-xl"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((reserva) => (
            <tr
              key={reserva.id_reserva}
              className="hover:bg-slate-50 transition-colors"
            >
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800">
                    {reserva.cliente}
                  </span>
                  <span className="text-xs text-slate-400">
                    {reserva.email}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-slate-600 font-medium">
                    {reserva.canchas?.nombre}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-slate-500">
                <div className="flex flex-col text-xs">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {reserva.fecha}
                  </span>
                  <span className="flex items-center gap-1 font-mono mt-1">
                    <Clock size={12} /> {reserva.inicio?.slice(0, 5)} -{" "}
                    {reserva.fin?.slice(0, 5)}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 font-bold text-slate-700">
                ${Number(reserva.precio_total).toLocaleString()}
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  <CheckCircle2 size={12} /> Confirmada
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  aria-label="Opciones de reserva"
                  className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <MoreHorizontal size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
