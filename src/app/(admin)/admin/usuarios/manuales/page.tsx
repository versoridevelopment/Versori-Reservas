"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Search,
  Phone,
  Mail,
  User,
  DollarSign,
  History,
  ArrowUpDown,
  ChevronDown,
  Trophy,
  Clock,
  Frown,
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation"; // ✅ IMPORT CORRECTO

// --- TIPOS ---
type ClienteManual = {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  total_reservas: number;
  total_gastado: number;
  ultima_reserva: string; // ISO Date
};

type SortField = "reciente" | "frecuente" | "gastador";

export default function UsuariosManualesPage() {
  // --- ESTADOS ---
  const [clientes, setClientes] = useState<ClienteManual[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [idClub, setIdClub] = useState<number | null>(null);

  // ✅ Router de App Directory
  const router = useRouter();

  // Filtros
  const [sortBy, setSortBy] = useState<SortField>("reciente");
  const [showFilters, setShowFilters] = useState(false);

  // Cliente Supabase
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    ),
  );

  // 1. Obtener ID Club
  useEffect(() => {
    const getClub = async () => {
      // Evitar error en SSR
      if (typeof window === "undefined") return;

      const hostname = window.location.hostname;
      const subdomain = hostname.split(".")[0];
      if (subdomain && subdomain !== "localhost") {
        const { data } = await supabase
          .from("clubes")
          .select("id_club")
          .eq("subdominio", subdomain)
          .single();
        if (data) setIdClub(data.id_club);
      } else {
        setIdClub(9); // Fallback dev
      }
    };
    getClub();
  }, [supabase]);

  // 2. Cargar Clientes
  useEffect(() => {
    if (!idClub) return;

    const fetchClientes = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/usuarios/usuarios-manuales?id_club=${idClub}`,
        );
        const json = await res.json();
        if (json.ok) {
          setClientes(json.clientes);
        }
      } catch (err) {
        console.error("Error cargando clientes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
  }, [idClub]);

  // --- LÓGICA DE FILTRADO Y ORDENAMIENTO ---
  const filteredAndSorted = useMemo(() => {
    let result = [...clientes];

    // Búsqueda
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.nombre.toLowerCase().includes(q) ||
          c.telefono.includes(q) ||
          c.email?.toLowerCase().includes(q),
      );
    }

    // Ordenamiento
    result.sort((a, b) => {
      if (sortBy === "reciente") {
        return (
          new Date(b.ultima_reserva).getTime() -
          new Date(a.ultima_reserva).getTime()
        );
      }
      if (sortBy === "frecuente") {
        return b.total_reservas - a.total_reservas;
      }
      if (sortBy === "gastador") {
        return b.total_gastado - a.total_gastado;
      }
      return 0;
    });

    return result;
  }, [clientes, search, sortBy]);

  // Helpers visuales
  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(amount);

  const getLabelSort = () => {
    switch (sortBy) {
      case "reciente":
        return "Más Recientes";
      case "frecuente":
        return "Más Frecuentes";
      case "gastador":
        return "Mayores Gastos";
    }
  };

  return (
    <div className="flex-1 w-full bg-slate-50 min-h-screen p-6 md:p-10 space-y-8 font-sans">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm">
              <History className="w-6 h-6 text-orange-500" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Usuarios Manuales
            </h1>
          </div>
          <p className="text-slate-500 mt-2 text-sm max-w-xl leading-relaxed ml-1">
            Visualizá y gestioná a los clientes frecuentes que fueron cargados
            manualmente en la agenda. El sistema agrupa sus reservas por nombre
            o teléfono automáticamente.
          </p>
        </div>

        {/* STATS RÁPIDOS */}
        {!loading && clientes.length > 0 && (
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-4 py-2 border-r border-slate-100">
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Clientes
              </span>
              <span className="text-2xl font-black text-slate-800">
                {clientes.length}
              </span>
            </div>
            <div className="px-4 py-2">
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Ingresos Totales
              </span>
              <span className="text-2xl font-black text-green-600">
                {formatMoney(
                  clientes.reduce((acc, curr) => acc + curr.total_gastado, 0),
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* CONTROLES (Búsqueda y Filtros) */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        {/* BUSCADOR */}
        <div className="relative flex-1 w-full group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl leading-5 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
            placeholder="Buscar por nombre, teléfono o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* FILTROS */}
        <div className="relative w-full md:w-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full md:w-auto px-5 py-3 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between gap-3 font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
          >
            <span className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-slate-400" />
              <span className="text-sm">Ordenar por:</span>
              <span className="text-sm text-orange-600">{getLabelSort()}</span>
            </span>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`}
            />
          </button>

          {/* DROPDOWN MENU */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden ring-1 ring-black/5"
              >
                <div className="p-1.5 space-y-0.5">
                  <button
                    onClick={() => {
                      setSortBy("reciente");
                      setShowFilters(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-3 transition-colors ${sortBy === "reciente" ? "bg-orange-50 text-orange-700 font-bold" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    <div
                      className={`p-1.5 rounded-md ${sortBy === "reciente" ? "bg-orange-100" : "bg-slate-100"}`}
                    >
                      <Clock className="w-4 h-4" />
                    </div>
                    Más Recientes
                  </button>
                  <button
                    onClick={() => {
                      setSortBy("frecuente");
                      setShowFilters(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-3 transition-colors ${sortBy === "frecuente" ? "bg-orange-50 text-orange-700 font-bold" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    <div
                      className={`p-1.5 rounded-md ${sortBy === "frecuente" ? "bg-orange-100" : "bg-slate-100"}`}
                    >
                      <Trophy className="w-4 h-4" />
                    </div>
                    Más Frecuentes
                  </button>
                  <button
                    onClick={() => {
                      setSortBy("gastador");
                      setShowFilters(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-3 transition-colors ${sortBy === "gastador" ? "bg-orange-50 text-orange-700 font-bold" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    <div
                      className={`p-1.5 rounded-md ${sortBy === "gastador" ? "bg-orange-100" : "bg-slate-100"}`}
                    >
                      <DollarSign className="w-4 h-4" />
                    </div>
                    Mayor Gasto
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* TABLA DE RESULTADOS */}
      <div className="bg-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-24 flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-100 border-t-orange-500"></div>
            <p className="text-slate-400 font-medium animate-pulse">
              Analizando historial de reservas...
            </p>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center justify-center">
            <div className="bg-slate-50 p-6 rounded-full mb-4 ring-8 ring-slate-50/50">
              {search ? (
                <Frown className="w-10 h-10 text-slate-300" />
              ) : (
                <User className="w-10 h-10 text-slate-300" />
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-800">
              {search ? "No se encontraron resultados" : "Lista vacía"}
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-2">
              {search
                ? `No hay clientes que coincidan con "${search}".`
                : "Todavía no hay historial de reservas cargadas manualmente por el administrador."}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-6 px-6 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
                    Frecuencia
                  </th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                    Facturación
                  </th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                    Última Visita
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSorted.map((cliente) => (
                  <tr
                    key={cliente.id}
                    // ✅ NAVEGACIÓN CORREGIDA CON NEXT/NAVIGATION
                    onClick={() =>
                      router.push(
                        `/admin/usuarios/manuales/${encodeURIComponent(cliente.nombre)}`,
                      )
                    }
                    className="hover:bg-orange-50/40 transition-colors group cursor-pointer"
                  >
                    {/* CLIENTE */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 flex items-center justify-center font-bold shadow-sm border border-slate-100 group-hover:from-orange-100 group-hover:to-orange-200 group-hover:text-orange-700 group-hover:border-orange-200 transition-all">
                          {cliente.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-base group-hover:text-orange-900 transition-colors">
                            {cliente.nombre}
                          </p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 mt-1">
                            MANUAL
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* CONTACTO */}
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        {cliente.telefono ? (
                          <div className="flex items-center gap-2 text-sm text-slate-600 group-hover:text-slate-800">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-medium tracking-tight">
                              {cliente.telefono}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                            <Phone className="w-3.5 h-3.5 opacity-50" /> Sin
                            teléfono
                          </div>
                        )}
                        {cliente.email && (
                          <div className="flex items-center gap-2 text-xs text-slate-500 group-hover:text-slate-700">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />{" "}
                            {cliente.email}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* FRECUENCIA */}
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center justify-center min-w-[3rem] px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <span className="text-sm font-black text-slate-700">
                          {cliente.total_reservas}
                        </span>
                      </div>
                    </td>

                    {/* GASTO */}
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-slate-800 group-hover:text-green-700 transition-colors tabular-nums">
                        {formatMoney(cliente.total_gastado)}
                      </div>
                    </td>

                    {/* ÚLTIMA VISITA */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 text-sm text-slate-500 group-hover:text-slate-700">
                        {new Date(cliente.ultima_reserva).toLocaleDateString(
                          "es-AR",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* FOOTER TABLA */}
        {!loading && filteredAndSorted.length > 0 && (
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 text-xs font-medium text-slate-500 flex justify-between items-center">
            <span>Mostrando {filteredAndSorted.length} clientes manuales</span>
            <span className="text-slate-400">
              Datos extraídos del historial de reservas
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
