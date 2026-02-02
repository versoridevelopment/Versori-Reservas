"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  MapPin,
  Loader2,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { printReservaTicket } from "@/lib/printTicket";
import { motion } from "framer-motion";

type Estado =
  | "pendiente_pago"
  | "confirmada"
  | "expirada"
  | "rechazada"
  | "cancelada";

type Detalle = {
  id_reserva: number;
  estado: Estado;
  confirmed_at?: string | null;
  created_at?: string | null;

  fecha?: string | null;
  inicio?: string | null;
  fin?: string | null;
  fin_dia_offset?: 0 | 1 | null;

  precio_total?: number | null;
  anticipo_porcentaje?: number | null;
  monto_anticipo?: number | null;

  club_nombre?: string | null;
  club_direccion?: string | null;
  cancha_nombre?: string | null;

  cliente_nombre?: string | null;
  cliente_telefono?: string | null;
  cliente_email?: string | null;

  ultimo_pago?: {
    mp_status: string | null;
    mp_payment_id: number | null;
    amount: number | null;
    currency: string | null;
  } | null;
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

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

// --- COMPONENTE PRINCIPAL ---
export default function ReservaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const id_reserva = Number(id);

  const [data, setData] = useState<Detalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id_reserva) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/reservas/${id_reserva}/detalle`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("No se pudo cargar la reserva");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id_reserva]);

  const handlePrint = () => {
    if (!data) return;
    const total = data.precio_total || 0;
    const pagado = data.monto_anticipo || 0;
    const saldo = total - pagado;

    printReservaTicket({
      id_reserva: data.id_reserva,
      club_nombre: data.club_nombre,
      club_direccion: data.club_direccion,
      cliente_nombre: data.cliente_nombre,
      cancha_nombre: data.cancha_nombre,
      fecha: data.fecha || null,
      inicio: data.inicio || null,
      fin: data.fin || null,
      fin_dia_offset: data.fin_dia_offset,
      precio_total: total,
      pagado: pagado,
      saldo: saldo,
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#06090e] flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="bg-rose-500/10 p-4 rounded-full mb-4 border border-rose-500/20">
          <XCircle className="w-10 h-10 text-rose-500" />
        </div>
        <h1 className="text-xl font-bold mb-2">No pudimos cargar la reserva</h1>
        <p className="text-slate-400 mb-6 max-w-md">{error}</p>
        <button
          onClick={() => router.push("/mis-reservas")}
          className="text-white bg-slate-800 px-6 py-2.5 rounded-xl hover:bg-slate-700 transition-all font-medium border border-slate-700"
        >
          Volver a Mis Reservas
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06090e] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <section className="min-h-screen relative font-sans text-slate-200 pt-28 pb-12 px-4 sm:px-6">
      {/* --- FONDO DEGRADADO --- */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[#06090e]">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[400px] bg-indigo-900/10 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Header Nav */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push("/mis-reservas")}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium mb-6 pl-1"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al listado
        </motion.button>

        {/* Card Principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f141e]/70 border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl"
        >
          {/* Status Banner */}
          <div
            className={`px-6 py-5 flex flex-wrap items-center justify-between gap-4 border-b border-white/5 ${
              data.estado === "confirmada"
                ? "bg-emerald-500/5"
                : data.estado === "pendiente_pago"
                  ? "bg-amber-500/5"
                  : "bg-rose-500/5"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-full ${
                  data.estado === "confirmada"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : data.estado === "pendiente_pago"
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-rose-500/10 text-rose-400"
                }`}
              >
                {data.estado === "confirmada" && (
                  <CheckCircle2 className="w-6 h-6" />
                )}
                {data.estado === "pendiente_pago" && (
                  <Clock className="w-6 h-6" />
                )}
                {(data.estado === "cancelada" ||
                  data.estado === "rechazada" ||
                  data.estado === "expirada") && (
                  <XCircle className="w-6 h-6" />
                )}
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">
                  Estado de Reserva
                </p>
                <p
                  className={`font-bold text-lg capitalize tracking-tight ${
                    data.estado === "confirmada"
                      ? "text-emerald-400"
                      : data.estado === "pendiente_pago"
                        ? "text-amber-400"
                        : "text-rose-400"
                  }`}
                >
                  {data.estado.replace("_", " ")}
                </p>
              </div>
            </div>

            <div className="text-right pl-4 border-l border-white/5">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                Reserva ID
              </p>
              <p className="text-sm text-slate-300 font-mono font-medium">
                #{data.id_reserva.toString().padStart(6, "0")}
              </p>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            {/* Info Club */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                {data.club_nombre}
              </h2>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-slate-300 text-sm">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span className="truncate max-w-[250px]">
                  {data.cancha_nombre}
                </span>
              </div>
            </div>

            {/* Grid Fecha/Hora */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#0b0f17] p-5 rounded-2xl border border-white/5 flex items-start gap-4">
                <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                    Fecha
                  </span>
                  <p className="text-lg font-bold text-white mt-0.5">
                    {formatDate(data.fecha)}
                  </p>
                </div>
              </div>

              <div className="bg-[#0b0f17] p-5 rounded-2xl border border-white/5 flex items-start gap-4">
                <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                    Horario
                  </span>
                  <p className="text-lg font-bold text-white mt-0.5">
                    {data.inicio?.slice(0, 5)}{" "}
                    <span className="text-slate-500 font-normal text-sm">
                      a
                    </span>{" "}
                    {data.fin?.slice(0, 5)}
                  </p>
                </div>
              </div>
            </div>

            {/* Desglose de Pago */}
            <div className="space-y-4 pt-6 border-t border-white/5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5" /> Detalles del Pago
              </h3>

              <div className="bg-[#0b0f17] rounded-2xl p-5 border border-white/5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Precio Total del Turno</span>
                  <span className="font-bold text-white tracking-wide">
                    {fmtMoney(data.precio_total)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Seña / Anticipo Pagado</span>
                  <span className="font-bold text-emerald-400 tracking-wide">
                    - {fmtMoney(data.monto_anticipo)}
                  </span>
                </div>

                <div className="h-px bg-white/10 my-2"></div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-200">
                    Saldo a pagar en el club
                  </span>
                  <div className="text-xl font-black text-white bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                    {fmtMoney(
                      (data.precio_total || 0) - (data.monto_anticipo || 0),
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Info MP */}
            {data.ultimo_pago && (
              <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:justify-between gap-2 text-xs text-slate-500">
                <div className="flex gap-2">
                  <span className="font-semibold">Transacción MP:</span>
                  <span className="font-mono text-slate-400">
                    {data.ultimo_pago.mp_payment_id}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold">Estado:</span>
                  <span className="font-mono text-slate-400 uppercase">
                    {data.ultimo_pago.mp_status}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="bg-[#0b0f17] p-6 border-t border-white/5 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handlePrint}
              className="flex-1 bg-white text-black font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/5 active:scale-[0.98]"
            >
              <Printer className="w-4 h-4" />
              <span>Descargar Ticket</span>
            </button>
            <button
              onClick={() => router.push("/mis-reservas")}
              className="flex-1 bg-slate-800 text-white font-bold py-3.5 rounded-xl hover:bg-slate-700 transition-all border border-slate-700 active:scale-[0.98]"
            >
              Volver
            </button>
          </div>
        </motion.div>

        <p className="text-center text-[10px] text-slate-500 mt-6 max-w-sm mx-auto leading-relaxed">
          <AlertTriangle className="w-3 h-3 inline mr-1 mb-0.5" />
          Presenta este comprobante digital en la recepción del club al momento
          de tu llegada para validar tu turno.
        </p>
      </div>
    </section>
  );
}
