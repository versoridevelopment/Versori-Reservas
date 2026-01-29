"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Copy,
  ExternalLink,
  Eye,
  X,
} from "lucide-react";

// --- TIPOS ---
type MPStatus = "approved" | "pending" | "in_process" | "rejected" | "refunded";

type PagoRow = {
  id_pago: number;
  mp_payment_id: string;
  monto: number;
  estado: MPStatus;
  fecha: string; // ISO String
  cliente: {
    nombre: string;
    apellido: string;
    email: string;
  };
  metodo_detalle: string;
};

// --- COMPONENTE REUTILIZABLE: FILTRO DE RANGO DE FECHAS ---
// (Puedes mover esto a un archivo separado components/DateRangeFilter.tsx)

type DateRange = {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
};

function DateRangeFilter({
  onChange,
}: {
  onChange: (range: DateRange | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFrom, setTempFrom] = useState("");
  const [tempTo, setTempTo] = useState("");
  const [activeLabel, setActiveLabel] = useState("Cualquier fecha");
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const applyFilter = (from: string, to: string, label: string) => {
    setTempFrom(from);
    setTempTo(to);
    setActiveLabel(label);
    onChange({ from, to });
    setIsOpen(false);
  };

  const clearFilter = () => {
    setTempFrom("");
    setTempTo("");
    setActiveLabel("Cualquier fecha");
    onChange(null);
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    if (!tempFrom && !tempTo) return;
    const label =
      tempFrom && tempTo ? `${tempFrom} - ${tempTo}` : "Personalizado";
    setActiveLabel(label);
    onChange({ from: tempFrom, to: tempTo });
    setIsOpen(false);
  };

  // Helpers para presets
  const getToday = () => new Date().toISOString().split("T")[0];
  const getYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  };
  const getFirstOfMonth = () => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm transition-colors ${
          activeLabel !== "Cualquier fecha"
            ? "bg-blue-50 border-blue-200 text-blue-700"
            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
        }`}
        aria-label="Filtrar por rango de fechas"
        aria-haspopup="dialog"
        aria-expanded={isOpen ? true : undefined}
      >
        <Calendar className="w-4 h-4" />
        <span>{activeLabel}</span>
        {activeLabel !== "Cualquier fecha" && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              clearFilter();
            }}
            className="ml-1 p-0.5 hover:bg-blue-200 rounded-full"
            title="Borrar filtro de fecha"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-20 p-4 animation-fade-in">
          <div className="space-y-1 mb-4">
            <button
              onClick={() => applyFilter(getToday(), getToday(), "Hoy")}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              Hoy
            </button>
            <button
              onClick={() =>
                applyFilter(getYesterday(), getYesterday(), "Ayer")
              }
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              Ayer
            </button>
            <button
              onClick={() =>
                applyFilter(getFirstOfMonth(), getToday(), "Este mes")
              }
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              Este mes
            </button>
          </div>

          <div className="border-t border-gray-100 pt-3 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase">
              Rango Personalizado
            </p>
            <div>
              <label
                htmlFor="date-from"
                className="block text-xs text-gray-500 mb-1"
              >
                Desde
              </label>
              <input
                type="date"
                id="date-from"
                className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm text-gray-700"
                value={tempFrom}
                onChange={(e) => setTempFrom(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="date-to"
                className="block text-xs text-gray-500 mb-1"
              >
                Hasta
              </label>
              <input
                type="date"
                id="date-to"
                className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm text-gray-700"
                value={tempTo}
                onChange={(e) => setTempTo(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={clearFilter}
                className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg"
              >
                Limpiar
              </button>
              <button
                onClick={handleCustomApply}
                className="flex-1 px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- COMPONENTES UI (Badges y Stats iguales a antes) ---

function StatusBadge({ status }: { status: MPStatus }) {
  const config = {
    approved: {
      label: "Aprobado",
      style: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle2,
    },
    pending: {
      label: "Pendiente",
      style: "bg-amber-50 text-amber-700 border-amber-200",
      icon: AlertCircle,
    },
    in_process: {
      label: "En proceso",
      style: "bg-amber-50 text-amber-700 border-amber-200",
      icon: AlertCircle,
    },
    rejected: {
      label: "Rechazado",
      style: "bg-red-50 text-red-700 border-red-200",
      icon: XCircle,
    },
    refunded: {
      label: "Reembolsado",
      style: "bg-gray-100 text-gray-600 border-gray-200",
      icon: XCircle,
    },
  };
  const { label, style, icon: Icon } = config[status] || config.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function StatCard({ title, value, subtext, icon: Icon, colorClass }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-lg ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}

// --- PÁGINA PRINCIPAL ---

export default function PagosPage() {
  const [loading, setLoading] = useState(true);
  const [pagos, setPagos] = useState<PagoRow[]>([]);

  // ESTADOS DE FILTRO
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState<MPStatus | "all">("all");
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 600));

      const mockPagos: PagoRow[] = [
        {
          id_pago: 1024,
          mp_payment_id: "5429381023",
          monto: 15000,
          estado: "approved",
          fecha: "2025-10-19T10:05:00",
          cliente: { nombre: "Neil", apellido: "Sims", email: "neil@demo.com" },
          metodo_detalle: "Visa •••• 4242",
        },
        {
          id_pago: 1025,
          mp_payment_id: "5429381024",
          monto: 12000,
          estado: "in_process",
          fecha: "2025-10-19T11:30:00",
          cliente: { nombre: "Juan", apellido: "Cruz", email: "juan@demo.com" },
          metodo_detalle: "Mastercard •••• 8888",
        },
        {
          id_pago: 1026,
          mp_payment_id: "5429381025",
          monto: 10000,
          estado: "rejected",
          fecha: "2025-10-10T15:00:00",
          cliente: {
            nombre: "Roberta",
            apellido: "Casas",
            email: "roberta@demo.com",
          },
          metodo_detalle: "Saldo Mercado Pago",
        }, // Fecha antigua para probar filtro
        {
          id_pago: 1027,
          mp_payment_id: "5429381026",
          monto: 15000,
          estado: "approved",
          fecha: "2025-10-18T09:00:00",
          cliente: {
            nombre: "Thomas",
            apellido: "Lean",
            email: "thomas@demo.com",
          },
          metodo_detalle: "Visa Débito •••• 1234",
        },
      ];
      setPagos(mockPagos);
      setLoading(false);
    }
    loadData();
  }, []);

  // LÓGICA DE FILTRADO AVANZADA
  const filteredPagos = pagos.filter((p) => {
    // 1. Filtro Texto
    const matchesText =
      p.mp_payment_id.includes(q) ||
      p.cliente.nombre.toLowerCase().includes(q.toLowerCase()) ||
      p.cliente.apellido.toLowerCase().includes(q.toLowerCase());

    // 2. Filtro Estado
    const matchesStatus = filterStatus === "all" || p.estado === filterStatus;

    // 3. Filtro Fecha (NUEVO)
    let matchesDate = true;
    if (dateRange) {
      const itemDate = new Date(p.fecha).setHours(0, 0, 0, 0); // Normalizamos a medianoche

      if (dateRange.from) {
        const fromDate = new Date(dateRange.from).setHours(0, 0, 0, 0);
        if (itemDate < fromDate) matchesDate = false;
      }

      if (dateRange.to) {
        const toDate = new Date(dateRange.to).setHours(23, 59, 59, 999); // Final del día
        const itemTime = new Date(p.fecha).getTime();
        if (itemTime > toDate) matchesDate = false;
      }
    }

    return matchesText && matchesStatus && matchesDate;
  });

  const totalApproved = pagos
    .filter((p) => p.estado === "approved")
    .reduce((acc, curr) => acc + curr.monto, 0);
  const countApproved = pagos.filter((p) => p.estado === "approved").length;
  const countPending = pagos.filter(
    (p) => p.estado === "pending" || p.estado === "in_process",
  ).length;

  const handleCopyId = (id: string) => navigator.clipboard.writeText(id);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Historial de Pagos
            </h1>
            <p className="text-sm text-gray-500">
              Monitoreo de transacciones vía Mercado Pago.
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Exportar Reporte
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Ingresos (Mes)"
            value={`$${totalApproved.toLocaleString("es-AR")}`}
            subtext={`${countApproved} transacciones aprobadas`}
            icon={DollarSign}
            colorClass="bg-emerald-100 text-emerald-600"
          />
          <StatCard
            title="Pagos Exitosos"
            value={countApproved}
            subtext="Tasa de aprobación: 92%"
            icon={CheckCircle2}
            colorClass="bg-blue-100 text-blue-600"
          />
          <StatCard
            title="Pendientes / Revisión"
            value={countPending}
            subtext="Requieren atención"
            icon={AlertCircle}
            colorClass="bg-amber-100 text-amber-600"
          />
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
            {/* Buscador */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por ID de pago o cliente..."
                aria-label="Buscar pagos"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Filtro Estado */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                aria-label="Filtrar por estado del pago"
                title="Filtrar por estado"
                className="appearance-none w-full sm:w-48 pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">Todos los estados</option>
                <option value="approved">Aprobados</option>
                <option value="in_process">En Proceso</option>
                <option value="rejected">Rechazados</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>

            {/* FILTRO DE FECHA AVANZADO (IMPLEMENTADO) */}
            <DateRangeFilter onChange={setDateRange} />
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">ID Transacción</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Detalle MP</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Monto</th>
                  <th className="px-6 py-4 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-28"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </td>
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4"></td>
                    </tr>
                  ))
                ) : filteredPagos.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No se encontraron pagos en este rango de fechas.
                    </td>
                  </tr>
                ) : (
                  filteredPagos.map((p) => (
                    <tr
                      key={p.id_pago}
                      className="hover:bg-gray-50/80 transition-colors group"
                    >
                      {/* ID Transacción */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <Link
                            href={`/admin/pagos/${p.id_pago}`}
                            className="font-mono text-xs text-blue-600 hover:underline w-fit"
                            aria-label={`Ver detalle del pago número ${p.id_pago}`}
                          >
                            Ref: #{p.id_pago}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-0.5 group/copy">
                            <span className="font-medium text-gray-900 text-sm">
                              MP: {p.mp_payment_id}
                            </span>
                            <button
                              onClick={() => handleCopyId(p.mp_payment_id)}
                              className="text-gray-400 hover:text-blue-600 opacity-0 group-hover/copy:opacity-100 transition-opacity"
                              title="Copiar ID MercadoPago"
                              aria-label="Copiar ID de transacción"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 text-sm">
                            {p.cliente.nombre} {p.cliente.apellido}
                          </span>
                          <span className="text-xs text-gray-500">
                            {p.cliente.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {new Date(p.fecha).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                          <div className="text-xs text-gray-400 mt-0.5">
                            {new Date(p.fecha).toLocaleTimeString("es-AR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          <span>{p.metodo_detalle}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={p.estado} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`font-bold text-sm ${
                            p.estado === "rejected"
                              ? "text-gray-400 line-through"
                              : "text-gray-900"
                          }`}
                        >
                          ${p.monto.toLocaleString("es-AR")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/admin/pagos/${p.id_pago}`}
                            title="Ver detalle completo"
                            aria-label={`Ver detalle completo del pago ${p.id_pago}`}
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-900 flex items-center justify-center"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            title="Ver en MercadoPago"
                            aria-label="Abrir en MercadoPago"
                            className="p-1.5 hover:bg-blue-50 rounded text-gray-500 hover:text-blue-600"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <span className="text-xs text-gray-500">
              Mostrando {filteredPagos.length} registros
            </span>
            <div className="flex gap-2">
              <button
                disabled
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 text-gray-500"
                aria-label="Página anterior"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 text-gray-500"
                aria-label="Página siguiente"
                title="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
