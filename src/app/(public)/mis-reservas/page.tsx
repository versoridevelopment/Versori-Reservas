"use client";

import { useEffect, useMemo, useRef, useState, CSSProperties } from "react";
import {
  CalendarDays,
  Clock,
  RefreshCw,
  Filter,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MapPin,
  Calendar,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

// --- TIPOS ---
type Estado = "pendiente_pago" | "confirmada" | "expirada" | "rechazada" | "cancelada";

type ReservaRow = {
  id_reserva: number;
  fecha: string;
  inicio: string;
  fin: string;
  fin_dia_offset: 0 | 1;
  estado: Estado;
  precio_total: number | null;
  monto_anticipo: number | null;
  confirmed_at: string | null;
  created_at: string | null;
  cancha_nombre: string | null;
};

type ApiResp = {
  ok: boolean;
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  reservas: ReservaRow[];
  error?: string;
};

// --- HELPERS ---
function fmtMoney(n: any) {
  const v = Number(n || 0);
  if (!Number.isFinite(v)) return "-";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(v);
}

function StatusBadge({ estado }: { estado: Estado }) {
  const styles: Record<string, string> = {
    confirmada: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    pendiente_pago: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    rechazada: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    cancelada: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    expirada: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };

  const icons: Record<string, any> = {
    confirmada: CheckCircle2,
    pendiente_pago: Clock,
    rechazada: XCircle,
    cancelada: XCircle,
    expirada: AlertTriangle,
  };

  const Icon = icons[estado] || AlertTriangle;
  const style = styles[estado] || styles.expirada;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${style} tracking-wide`}
    >
      <Icon className="w-3 h-3" />
      {estado.replace("_", " ")}
    </span>
  );
}

// --- COMPONENTE PRINCIPAL ---
export default function MisReservasPage() {
  const [rows, setRows] = useState<ReservaRow[]>([]);
  const [firstLoading, setFirstLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ✅ Filtros (solo confirmada/cancelada o vacío = ambas)
  const [estado, setEstado] = useState<string>(""); // "" | "confirmada" | "cancelada"
  const [desde, setDesde] = useState<string>("");
  const [hasta, setHasta] = useState<string>("");

  // Paginación
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const inFlightRef = useRef(false);

  const customStyle = {
    "--primary": "#3b82f6",
    "--secondary": "#1e40af",
  } as CSSProperties;

  const filtersQuery = useMemo(() => {
    const sp = new URLSearchParams();

    // ✅ Solo enviamos estado si es confirmada o cancelada
    if (estado === "confirmada" || estado === "cancelada") sp.set("estado", estado);

    if (desde) sp.set("desde", desde);
    if (hasta) sp.set("hasta", hasta);
    return sp.toString();
  }, [estado, desde, hasta]);

  async function fetchPage(p: number, mode: "reset" | "append") {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    if (mode === "reset") {
      setFirstLoading(true);
      setRows([]);
      setErr(null);
      setPage(1);
      setTotalPages(0);
    } else {
      setLoadingMore(true);
      setErr(null);
    }

    try {
      const sp = new URLSearchParams(filtersQuery ? filtersQuery : "");
      sp.set("page", String(p));
      sp.set("page_size", String(pageSize));

      const res = await fetch(`/api/mis-reservas?${sp.toString()}`, {
        cache: "no-store",
      });
      const json = (await res.json().catch(() => null)) as ApiResp | null;

      if (!res.ok || !json?.ok) {
        const msg = (json as any)?.error || "No se pudieron cargar tus reservas.";
        setErr(msg);
        if (mode === "reset") setRows([]);
        return;
      }

      setTotalPages(Number(json.total_pages || 0));

      if (mode === "reset") {
        setRows(json.reservas || []);
        setPage(1);
      } else {
        setRows((prev) => {
          const incoming = json.reservas || [];
          const seen = new Set(prev.map((x) => x.id_reserva));
          return [...prev, ...incoming.filter((x) => !seen.has(x.id_reserva))];
        });
      }
    } catch (e: any) {
      setErr(e?.message || "Error de red.");
      if (mode === "reset") setRows([]);
    } finally {
      inFlightRef.current = false;
      setFirstLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    fetchPage(1, "reset");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersQuery]);

  const canLoadMore = useMemo(() => {
    if (firstLoading) return false;
    if (loadingMore) return false;
    if (totalPages === 0) return false;
    return page < totalPages;
  }, [firstLoading, loadingMore, page, totalPages]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (!canLoadMore) return;

        const next = page + 1;
        setPage(next);
        fetchPage(next, "append");
      },
      { root: null, rootMargin: "400px 0px", threshold: 0 }
    );

    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canLoadMore, page]);

  return (
    <section
      style={customStyle}
      className="min-h-screen relative pt-32 pb-20 px-4 sm:px-6 overflow-hidden text-white font-sans"
    >
      {/* Fondo */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[#06090e]">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[var(--primary)]/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[400px] bg-blue-900/10 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-5xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 text-white">
              Mis Reservas
            </h1>
            <p className="text-slate-400 text-sm md:text-base">
              Historial de turnos (confirmadas y canceladas).
            </p>
          </div>

          <button
            onClick={() => fetchPage(1, "reset")}
            className="self-start md:self-auto bg-slate-800/50 hover:bg-slate-700/50 hover:text-white text-slate-300 border border-slate-700/50 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm backdrop-blur-sm"
          >
            <RefreshCw className={`w-4 h-4 ${firstLoading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>

        {/* FILTROS */}
        <div className="bg-[#0f141e]/60 border border-white/5 rounded-2xl p-5 mb-10 backdrop-blur-md shadow-xl">
          <div className="flex items-center gap-2 mb-4 text-slate-400 text-xs uppercase tracking-wider font-bold">
            <Filter className="w-3.5 h-3.5" />
            Filtrar Resultados
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Select Estado (solo confirmada/cancelada) */}
            <div className="relative group">
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] outline-none appearance-none cursor-pointer transition-all"
              >
                <option value="">Confirmadas y canceladas</option>
                <option value="confirmada">Confirmadas</option>
                <option value="cancelada">Canceladas</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                ▼
              </div>
            </div>

            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] outline-none [color-scheme:dark] transition-all"
              placeholder="Desde"
            />

            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] outline-none [color-scheme:dark] transition-all"
              placeholder="Hasta"
            />
          </div>
        </div>

        {/* CONTENIDO */}
        {firstLoading && (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-[var(--primary)]" />
            <p className="text-sm font-medium animate-pulse">Cargando reservas...</p>
          </div>
        )}

        {!firstLoading && err && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-8 text-center backdrop-blur-sm">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <p className="text-rose-400 font-bold mb-1">Ocurrió un error</p>
            <p className="text-rose-300/80 text-sm">{err}</p>
          </div>
        )}

        {!firstLoading && !err && rows.length === 0 && (
          <div className="py-24 text-center border border-dashed border-slate-800 rounded-3xl bg-[#0f141e]/30">
            <div className="bg-slate-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
              <CalendarDays className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No se encontraron reservas</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
              Intenta cambiar los filtros o realiza tu primera reserva hoy mismo.
            </p>
            <Link
              href="/reserva"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-[var(--primary)]/20"
            >
              Reservar Cancha <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {!firstLoading && !err && rows.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {rows.map((r, i) => (
              <motion.div
                key={r.id_reserva}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/mis-reservas/${r.id_reserva}`}
                  className="group relative block bg-[#0f141e]/80 border border-white/5 hover:border-[var(--primary)]/40 rounded-2xl p-5 transition-all duration-300 hover:bg-[#131b29]/90 hover:shadow-2xl hover:shadow-[var(--primary)]/5 backdrop-blur-md overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/0 to-[var(--primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative z-10 flex gap-4">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-800/50 shrink-0 border border-white/5 flex items-center justify-center text-slate-600 group-hover:text-[var(--primary)] group-hover:bg-[var(--primary)]/10 transition-colors">
                      <MapPin className="w-8 h-8" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 font-mono">
                          #{r.id_reserva}
                        </span>
                        <StatusBadge estado={r.estado} />
                      </div>

                      <h3 className="text-lg font-bold text-white truncate mb-2 group-hover:text-[var(--primary)] transition-colors">
                        {r.cancha_nombre || "Cancha"}
                      </h3>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
                          <span className="capitalize">
                            {new Date(r.fecha + "T12:00:00").toLocaleDateString("es-AR", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
                          <span>
                            {r.inicio?.slice(0, 5)} - {r.fin?.slice(0, 5)} hs
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium group-hover:text-slate-400 transition-colors">
                      Ver detalles
                    </span>
                    <div className="text-base font-bold text-white tracking-tight">
                      {fmtMoney(r.precio_total)}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="h-20 mt-8 flex items-center justify-center">
          {loadingMore && (
            <div className="flex items-center gap-2 text-slate-500 text-sm bg-[#0f141e] px-4 py-2 rounded-full border border-white/5">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando más reservas...
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
