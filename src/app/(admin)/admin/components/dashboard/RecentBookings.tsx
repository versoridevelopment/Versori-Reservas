import { MoreHorizontal, Calendar, Clock } from "lucide-react";

export function RecentBookings({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-slate-400 text-sm text-center py-8">
        No hay reservas próximas.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
          <tr>
            <th className="px-6 py-3 font-semibold">Cliente</th>
            <th className="px-6 py-3 font-semibold">Detalles</th>
            <th className="px-6 py-3 font-semibold">Fecha</th>
            <th className="px-6 py-3 font-semibold text-right">Precio</th>
            <th className="px-6 py-3 font-semibold text-center">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((reserva) => (
            <tr
              key={reserva.id_reserva}
              className="hover:bg-slate-50/50 transition-colors group"
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-100 to-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold border border-blue-100">
                    {reserva.cliente?.charAt(0) || "U"}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700">
                      {reserva.cliente}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {reserva.email}
                    </span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  {reserva.canchas?.nombre}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Calendar size={12} /> {reserva.fecha}
                  </span>
                  <span className="flex items-center gap-1.5 mt-0.5">
                    <Clock size={12} /> {reserva.inicio?.slice(0, 5)}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-right font-bold text-slate-700">
                ${Number(reserva.precio_total).toLocaleString()}
              </td>
              <td className="px-6 py-4 text-center">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-600 border border-emerald-100">
                  Confirmada
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
