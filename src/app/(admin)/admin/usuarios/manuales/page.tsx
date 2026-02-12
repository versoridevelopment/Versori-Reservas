"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Search,
  Phone,
  Mail,
  History,
  ArrowUpDown,
  ChevronDown,
  Trophy,
  Clock,
  MoreVertical,
  ExternalLink,
  DollarSign,
  Loader2,
  Frown,
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

// --- TIPOS ---
type ClienteManual = {
  id: number;
  nombre: string;
  telefono: string;
  email: string;
  total_reservas: number;
  total_gastado: number;
  ultima_reserva: string;
  notas: string;
};

type SortField = "reciente" | "frecuente" | "gastador";

export default function UsuariosManualesPage() {
  const [clientes, setClientes] = useState<ClienteManual[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [idClub, setIdClub] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<"admin" | "cajero" | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortField>("reciente");
  const [showFilters, setShowFilters] = useState(false);

  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    ),
  );

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      let currentClubId = 9;
      if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        const subdomain = hostname.split(".")[0];
        if (subdomain && subdomain !== "localhost") {
          const { data } = await supabase
            .from("clubes")
            .select("id_club")
            .eq("subdominio", subdomain)
            .single();
          if (data) currentClubId = data.id_club;
        }
      }
      setIdClub(currentClubId);

      const { data: members } = await supabase
        .from("club_usuarios")
        .select("roles(nombre)")
        .eq("id_usuario", user.id)
        .eq("id_club", currentClubId);

      const isAdmin = members?.some((m: any) => {
        const rName = m.roles?.nombre?.toLowerCase().trim();
        return (
          rName === "admin" ||
          rName === "administrador" ||
          rName === "propietario"
        );
      });

      setUserRole(isAdmin ? "admin" : "cajero");
    };
    init();
  }, [supabase]);

  useEffect(() => {
    const fetchClientes = async () => {
      if (!idClub) return;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/usuarios/usuarios-manuales?id_club=${idClub}`,
        );
        const json = await res.json();
        if (json.ok) setClientes(json.clientes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
  }, [idClub]);

  // --- FILTRADO ---
  const filteredAndSorted = useMemo(() => {
    let result = [...clientes];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.nombre.toLowerCase().includes(q) ||
          c.telefono.includes(q) ||
          c.email?.toLowerCase().includes(q),
      );
    }
    result.sort((a, b) => {
      if (sortBy === "reciente")
        return (
          new Date(b.ultima_reserva).getTime() -
          new Date(a.ultima_reserva).getTime()
        );
      if (sortBy === "frecuente") return b.total_reservas - a.total_reservas;
      if (sortBy === "gastador") return b.total_gastado - a.total_gastado;
      return 0;
    });
    return result;
  }, [clientes, search, sortBy]);

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div
      className="flex-1 w-full bg-slate-50 min-h-screen pb-20 font-sans relative"
      onClick={() => setActiveMenuId(null)}
    >
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 py-4 md:px-10 md:py-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-orange-50 border border-orange-100 rounded-lg">
                <History className="w-5 h-5 text-orange-500" />
              </div>
              <h1 className="text-xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Usuarios Manuales
              </h1>
            </div>
            <p className="text-xs md:text-sm text-slate-500">
              Gestión de clientes frecuentes sin cuenta registrada.
            </p>
          </div>

          {/* STATS RÁPIDOS */}
          {!loading && clientes.length > 0 && (
            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100 w-full md:w-auto">
              <div
                className={`flex-1 md:flex-none px-3 py-1 ${
                  userRole === "admin" ? "border-r border-slate-200" : ""
                }`}
              >
                <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  Total Clientes
                </span>
                <span className="text-lg font-black text-slate-800">
                  {clientes.length}
                </span>
              </div>
              {userRole === "admin" && (
                <div className="flex-1 md:flex-none px-3 py-1">
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                    Ingresos
                  </span>
                  <span className="text-lg font-black text-green-600 truncate">
                    {formatMoney(
                      clientes.reduce(
                        (acc, curr) => acc + curr.total_gastado,
                        0,
                      ),
                    )}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 md:p-10 space-y-6">
        {/* CONTROLES */}
        <div className="flex flex-col md:flex-row gap-3 items-center sticky top-[80px] z-10 md:static">
          <div className="relative flex-1 w-full group shadow-sm md:shadow-none rounded-xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="relative w-full md:w-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFilters(!showFilters);
              }}
              className="w-full md:w-auto px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between gap-3 font-semibold text-slate-700 hover:bg-slate-50 transition-all text-sm"
            >
              <span className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-slate-400" />
                <span>Ordenar</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-full md:w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden ring-1 ring-black/5"
                >
                  <div className="p-1.5 space-y-0.5">
                    <button
                      onClick={() => {
                        setSortBy("reciente");
                        setShowFilters(false);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-3 hover:bg-slate-50 text-slate-600"
                    >
                      <Clock className="w-4 h-4 text-orange-500" /> Más
                      Recientes
                    </button>
                    <button
                      onClick={() => {
                        setSortBy("frecuente");
                        setShowFilters(false);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-3 hover:bg-slate-50 text-slate-600"
                    >
                      <Trophy className="w-4 h-4 text-orange-500" /> Más
                      Frecuentes
                    </button>
                    {userRole === "admin" && (
                      <button
                        onClick={() => {
                          setSortBy("gastador");
                          setShowFilters(false);
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-3 hover:bg-slate-50 text-slate-600"
                      >
                        <DollarSign className="w-4 h-4 text-orange-500" /> Mayor
                        Gasto
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* LISTA */}
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin h-8 w-8 text-orange-500" />
            <p className="text-slate-400 font-medium text-sm">Cargando...</p>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 border-dashed">
            <div className="bg-slate-50 p-4 rounded-full mb-3">
              <Frown className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Sin resultados</h3>
            <p className="text-sm text-slate-400">Intenta con otro término</p>
          </div>
        ) : (
          <>
            {/* VISTA MÓVIL */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {filteredAndSorted.map((cliente) => (
                <div
                  key={cliente.id}
                  onClick={() =>
                    router.push(`/admin/usuarios/manuales/${cliente.id}`)
                  }
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm active:scale-[0.98] transition-transform relative"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-slate-100 text-slate-700">
                        {cliente.nombre.charAt(0).toUpperCase()}
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm">
                        {cliente.nombre || "Usuario Desconocido"}
                      </h3>
                    </div>

                    <button
                      aria-label="Opciones"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(
                          activeMenuId === cliente.id ? null : cliente.id,
                        );
                      }}
                      className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {activeMenuId === cliente.id && (
                      <div className="absolute right-4 top-12 w-40 bg-white rounded-xl shadow-xl border border-slate-100 z-30 p-1 animate-in fade-in zoom-in-95">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/admin/usuarios/manuales/${cliente.id}`,
                            );
                          }}
                          className="w-full text-left px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                          Ver Perfil
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase">
                        Turnos
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        {cliente.total_reservas}
                      </span>
                    </div>
                    {userRole === "admin" && (
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase">
                          Gastado
                        </span>
                        <span className="text-sm font-bold text-green-700">
                          {formatMoney(cliente.total_gastado)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* VISTA ESCRITORIO */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-visible">
              <div className="overflow-x-auto min-h-[400px]">
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
                      {userRole === "admin" && (
                        <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                          Facturación
                        </th>
                      )}
                      <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                        Última Visita
                      </th>
                      <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAndSorted.map((cliente) => (
                      <tr
                        key={cliente.id}
                        onClick={() =>
                          router.push(`/admin/usuarios/manuales/${cliente.id}`)
                        }
                        className="transition-colors group cursor-pointer hover:bg-orange-50/40 relative"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg bg-slate-100 text-slate-600 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                              {cliente.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div className="font-bold text-slate-800">
                              {cliente.nombre}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {cliente.telefono ? (
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />{" "}
                                {cliente.telefono}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">
                                Sin teléfono
                              </span>
                            )}
                            {cliente.email && (
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />{" "}
                                {cliente.email}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700">
                            {cliente.total_reservas}
                          </span>
                        </td>

                        {userRole === "admin" && (
                          <td className="px-6 py-4 text-right">
                            <div className="font-bold text-slate-800 group-hover:text-green-700 transition-colors">
                              {formatMoney(cliente.total_gastado)}
                            </div>
                          </td>
                        )}

                        <td className="px-6 py-4 text-right text-sm text-slate-500">
                          {new Date(cliente.ultima_reserva).toLocaleDateString(
                            "es-AR",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </td>

                        <td
                          className="px-6 py-4 text-right relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(
                                activeMenuId === cliente.id ? null : cliente.id,
                              );
                            }}
                            className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeMenuId === cliente.id && (
                            <div className="absolute right-8 top-8 w-40 bg-white rounded-xl shadow-xl border border-slate-100 z-50 p-1 animate-in fade-in zoom-in-95 duration-100">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/admin/usuarios/manuales/${cliente.id}`,
                                  );
                                }}
                                className="w-full text-left px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                                Ver Perfil
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
