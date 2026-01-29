import Link from "next/link"; // <--- Importamos Link
import { TrendingUp, Ticket, ChevronRight } from "lucide-react";

export function ClientRanking({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-slate-400 text-xs py-8 text-center">
        Sin datos de clientes en este periodo.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {data.map((cliente, index) => (
        // Envolvemos en LINK hacia el perfil del usuario
        <Link
          href={`/admin/usuarios/${cliente.id}`}
          key={index}
          className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group cursor-pointer"
        >
          {/* Columna Izquierda: Perfil */}
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${index === 0 ? "bg-yellow-50 text-yellow-600 border-yellow-200 group-hover:bg-yellow-100" : "bg-slate-100 text-slate-500 border-slate-200 group-hover:bg-slate-200"}`}
            >
              {index + 1}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 leading-none group-hover:text-blue-600 transition-colors">
                {cliente.name}
              </p>
              <div className="flex items-center gap-1 mt-1.5">
                <Ticket size={10} className="text-blue-400" />
                <p className="text-[11px] text-slate-500 font-medium">
                  {cliente.reservas} reservas
                </p>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Dinero + Flecha */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800">
                ${Number(cliente.gastado).toLocaleString()}
              </p>
              <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <TrendingUp size={10} /> Ver perfil
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-slate-300 group-hover:text-blue-500 transition-colors"
            />
          </div>
        </Link>
      ))}
    </div>
  );
}
