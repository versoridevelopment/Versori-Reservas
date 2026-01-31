"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Trophy,
  Clock,
  MapPin,
  User,
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

// Tipos
type ReservaHistorial = {
  id_reserva: number;
  fecha: string;
  inicio: string;
  fin: string;
  precio_total: number;
  estado: string;
  canchas: { nombre: string };
  notas: string | null;
};

type PerfilManual = {
  nombre: string;
  telefono: string;
  email: string;
  total_reservas: number;
  total_gastado: number;
};

export default function DetalleUsuarioManualPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams(); // Para leer id_club si viniera por query, o lo sacamos de auth

  // Desempaquetar params (Next.js 15)
  const { id } = use(params);
  const clienteNombre = decodeURIComponent(id);

  const [perfil, setPerfil] = useState<PerfilManual | null>(null);
  const [historial, setHistorial] = useState<ReservaHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [idClub, setIdClub] = useState<number | null>(null);

  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    ),
  );

  // 1. Obtener Club ID
  useEffect(() => {
    const getClub = async () => {
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

  // 2. Cargar Datos
  useEffect(() => {
    if (!idClub || !clienteNombre) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/usuarios/manuales/${encodeURIComponent(clienteNombre)}?id_club=${idClub}`,
        );
        const json = await res.json();
        if (json.ok) {
          setPerfil(json.perfil);
          setHistorial(json.historial);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [idClub, clienteNombre]);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(val);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  if (!perfil)
    return <div className="p-10 text-center">Usuario no encontrado</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans space-y-8">
      {/* NAV */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a lista
      </button>

      {/* HEADER CARD */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 text-orange-600 flex items-center justify-center font-black text-2xl shadow-sm border border-orange-100">
            {perfil.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {perfil.nombre}
              </h1>
              <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wider">
                Manual
              </span>
            </div>

            <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
              <div className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-slate-400" />
                {perfil.telefono}
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-400" />
                {perfil.email}
              </div>
            </div>
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="flex gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-none bg-slate-50 p-4 rounded-xl border border-slate-100 min-w-[140px]">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Turnos
            </span>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-orange-500" />
              <span className="text-2xl font-black text-slate-800">
                {perfil.total_reservas}
              </span>
            </div>
          </div>
          <div className="flex-1 md:flex-none bg-slate-50 p-4 rounded-xl border border-slate-100 min-w-[160px]">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Inversión
            </span>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-black text-slate-800">
                {formatMoney(perfil.total_gastado)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* HISTORIAL TABLE */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-400" /> Historial de Actividad
        </h2>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Horario
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Cancha
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                    Monto
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historial.map((r) => (
                  <tr
                    key={r.id_reserva}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-700">
                        {new Date(r.fecha + "T12:00:00").toLocaleDateString(
                          "es-AR",
                          {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "2-digit",
                          },
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {r.inicio.slice(0, 5)} - {r.fin.slice(0, 5)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">
                          {r.canchas?.nombre}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${
                          r.estado === "confirmada"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : r.estado === "pendiente_pago"
                              ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {r.estado.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-sm text-slate-600">
                      {formatMoney(r.precio_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
