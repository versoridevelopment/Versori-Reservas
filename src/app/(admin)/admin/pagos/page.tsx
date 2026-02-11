"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Download,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  Clock,
  ChevronRight as ChevronRightIcon,
  CreditCard,
  Wallet,
} from "lucide-react";

// --- HELPERS ---
function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  colorClass,
  loading,
  isMoney,
}: any) {
  const displayValue =
    isMoney && !loading
      ? new Intl.NumberFormat("es-AR", {
          maximumFractionDigits: 1,
          notation: value >= 1000000 ? "compact" : "standard",
        }).format(value)
      : value;

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
      <div className="w-full overflow-hidden">
        <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
        {loading ? (
          <div className="h-8 w-24 bg-gray-100 animate-pulse rounded mt-2"></div>
        ) : (
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mt-1 sm:mt-2 flex items-center gap-1">
            {isMoney && <span className="text-gray-400 font-medium">$</span>}
            <span className="truncate">{displayValue}</span>
          </h3>
        )}
        {subtext && (
          <p className="text-[10px] md:text-xs text-gray-400 mt-1 truncate">
            {subtext}
          </p>
        )}
      </div>
      <div className={`p-2 sm:p-3 rounded-lg shrink-0 ${colorClass}`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: any = {
    approved: {
      label: "Aprobado",
      style: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle2,
    },
    pending: {
      label: "Pendiente",
      style: "bg-amber-50 text-amber-700 border-amber-200",
      icon: Clock,
    },
    rejected: {
      label: "Rechazado",
      style: "bg-red-50 text-red-700 border-red-200",
      icon: XCircle,
    },
  };
  const { label, style, icon: Icon } = config[status] || config.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${style}`}
    >
      <Icon className="w-3 h-3" /> {label}
    </span>
  );
}

export default function PagosPage() {
  const [loading, setLoading] = useState(true);
  const [pagos, setPagos] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("approved");

  useEffect(() => {
    async function fetchPagos() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/pagos");
        const json = await res.json();
        if (json.ok) setPagos(json.pagos || []);
      } catch (err) {
        console.error("Error al cargar pagos:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPagos();
  }, []);

  const filteredPagos = useMemo(() => {
    return pagos.filter((p) => {
      const search = q.toLowerCase();
      const matchesText =
        (p.cliente?.nombre || "").toLowerCase().includes(search) ||
        (p.cliente?.apellido || "").toLowerCase().includes(search) ||
        (p.mp_payment_id || "").toLowerCase().includes(search);

      const matchesStatus = filterStatus === "all" || p.estado === filterStatus;
      return matchesText && matchesStatus;
    });
  }, [pagos, q, filterStatus]);

  const totalMonto = useMemo(
    () => filteredPagos.reduce((acc, curr) => acc + (curr.monto || 0), 0),
    [filteredPagos],
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 pb-24 md:pb-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pagos</h1>
          <p className="text-sm text-gray-500">
            Historial de ingresos confirmados
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            title="Ingresos Totales (Vista)"
            value={totalMonto}
            isMoney
            subtext="Suma de pagos en lista"
            icon={DollarSign}
            colorClass="bg-emerald-100 text-emerald-600"
            loading={loading}
          />
          <StatCard
            title="Transacciones"
            value={filteredPagos.length}
            subtext="Operaciones filtradas"
            icon={CheckCircle2}
            colorClass="bg-blue-100 text-blue-600"
            loading={loading}
          />
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cliente o ID..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded-lg px-4 py-2 text-sm bg-white outline-none cursor-pointer h-10"
          >
            <option value="approved">Confirmados</option>
            <option value="all">Todos</option>
            <option value="rejected">Rechazados</option>
          </select>
        </div>

        {/* CONTENEDOR DE DATOS */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
              <p className="text-gray-500">Cargando transacciones...</p>
            </div>
          ) : filteredPagos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Wallet className="w-12 h-12 mb-2 opacity-20" />
              <p>No se encontraron pagos</p>
            </div>
          ) : (
            <>
              {/* VISTA ESCRITORIO (Tabla) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase">
                    <tr>
                      <th className="px-6 py-4">ID / Referencia</th>
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-6 py-4">Fecha</th>
                      <th className="px-6 py-4">Método</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4 text-right">Monto</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPagos.map((p: any) => (
                      <tr
                        key={p.id_pago}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono text-xs text-gray-500">
                          #{p.id_pago}
                          <div className="text-gray-900 font-sans font-medium">
                            {p.mp_payment_id || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-sm text-gray-900">
                            {p.cliente.nombre} {p.cliente.apellido}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {new Date(p.fecha).toLocaleDateString("es-AR")}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                          {p.metodo_detalle}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={p.estado} />
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900 whitespace-nowrap">
                          ${p.monto.toLocaleString("es-AR")}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/admin/pagos/${p.id_pago}`}
                            className="p-2 hover:bg-gray-100 rounded-lg inline-block text-gray-400"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* VISTA MÓVIL (Lista de Cards) */}
              <div className="md:hidden divide-y divide-gray-100">
                {filteredPagos.map((p: any) => (
                  <Link
                    href={`/admin/pagos/${p.id_pago}`}
                    key={p.id_pago}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">
                          {p.cliente.nombre} {p.cliente.apellido}
                        </span>
                        <span className="font-bold text-gray-900">
                          ${p.monto.toLocaleString("es-AR")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-mono">
                          #{p.id_pago}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(p.fecha).toLocaleDateString("es-AR")}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{p.metodo_detalle}</span>
                      </div>

                      <div className="pt-1">
                        <StatusBadge status={p.estado} />
                      </div>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-300 ml-2" />
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
