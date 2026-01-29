"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Briefcase,
  Ban,
  CheckCircle2,
  Clock,
  ChevronLeft,
  DollarSign,
  Trophy,
  History,
  MapPin,
  AlertCircle,
  Heart,
  Star,
  Activity,
} from "lucide-react";

// --- TIPOS ---
type ReservaRaw = {
  id_reserva: number;
  fecha: string;
  inicio: string;
  fin: string;
  precio_total: number;
  estado: string;
  canchas: {
    nombre: string;
    tipos_cancha: {
      nombre: string;
      deportes: { nombre: string };
    };
  };
};

type UserProfile = {
  id_usuario: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string | null;
  apodo?: string | null;
  bio?: string | null;
  fecha_nacimiento?: string | null;
  genero?: string | null;
  roles: string[];
  reservas: ReservaRaw[];
  bloqueado?: boolean; // Ajustar según tu lógica real de bloqueo
};

// --- COMPONENTES AUXILIARES ---

function InfoItem({
  icon: Icon,
  label,
  value,
  isLink,
}: {
  icon: any;
  label: string;
  value?: string | null;
  isLink?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
      <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 shadow-sm shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
          {label}
        </p>
        {isLink && value ? (
          <a
            href={
              label === "Email"
                ? `mailto:${value}`
                : `https://wa.me/${value?.replace(/\D/g, "")}`
            }
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-blue-600 hover:underline truncate block"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm font-medium text-slate-800 break-words truncate">
            {value || (
              <span className="text-slate-400 italic">No especificado</span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subtext, color }: any) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-opacity-100`}>
        <Icon className={`w-6 h-6 ${color.replace("bg-", "text-")}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 leading-none">
          {value}
        </p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
          {label}
        </p>
        {subtext && (
          <p className="text-[10px] text-slate-500 font-medium">{subtext}</p>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const styles: Record<string, string> = {
    confirmada: "bg-emerald-100 text-emerald-700 border-emerald-200",
    finalizada: "bg-slate-100 text-slate-600 border-slate-200",
    pendiente_pago: "bg-amber-100 text-amber-700 border-amber-200",
    cancelada: "bg-rose-100 text-rose-700 border-rose-200",
    expirada: "bg-gray-100 text-gray-500 border-gray-200",
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${styles[s] || styles.finalizada}`}
    >
      {s.replace("_", " ")}
    </span>
  );
}

// --- COMPONENTE PRINCIPAL ---

export default function UsuarioDetalleClient({
  clubId,
  idUsuario,
}: {
  clubId: number;
  idUsuario: string;
}) {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/usuarios/${idUsuario}?clubId=${clubId}`,
      );
      if (!res.ok) throw new Error("No se pudo cargar el perfil.");
      setUserData(await res.json());
    } catch (err: any) {
      setError(err?.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [idUsuario, clubId]);

  // --- LÓGICA DE ESTADÍSTICAS AVANZADAS ---
  const stats = useMemo(() => {
    if (!userData) return null;

    const total = userData.reservas.length;
    const confirmadas = userData.reservas.filter((r) =>
      ["confirmada", "finalizada"].includes(r.estado),
    );
    const canceladas = userData.reservas.filter(
      (r) => r.estado === "cancelada",
    );

    // Dinero
    const gastado = confirmadas.reduce(
      (acc, curr) => acc + Number(curr.precio_total),
      0,
    );

    // Tasa Cancelación
    const cancelRate =
      total > 0 ? ((canceladas.length / total) * 100).toFixed(0) : "0";

    // Cancha Favorita
    const canchasCount: Record<string, number> = {};
    confirmadas.forEach((r) => {
      const n = r.canchas?.nombre || "Desc.";
      canchasCount[n] = (canchasCount[n] || 0) + 1;
    });
    const favCourt =
      Object.keys(canchasCount).length > 0
        ? Object.keys(canchasCount).reduce((a, b) =>
            canchasCount[a] > canchasCount[b] ? a : b,
          )
        : "-";

    // Momento del día (Mañana < 13, Tarde < 19, Noche)
    let horarios = { manana: 0, tarde: 0, noche: 0 };
    confirmadas.forEach((r) => {
      const hora = parseInt(r.inicio.split(":")[0]);
      if (hora < 13) horarios.manana++;
      else if (hora < 19) horarios.tarde++;
      else horarios.noche++;
    });
    const momentoPref =
      horarios.manana > horarios.tarde && horarios.manana > horarios.noche
        ? "Mañana"
        : horarios.tarde > horarios.noche
          ? "Tarde"
          : "Noche";

    const ultima =
      total > 0
        ? new Date(userData.reservas[0].fecha).toLocaleDateString("es-AR")
        : "-";

    return { total, gastado, cancelRate, favCourt, momentoPref, ultima };
  }, [userData]);

  const esProfe = userData?.roles?.includes("profe");

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center text-slate-500">
        <div className="animate-spin mr-2">⏳</div> Cargando perfil...
      </div>
    );
  if (!userData || !stats)
    return (
      <div className="p-8 text-center text-red-500">Usuario no encontrado.</div>
    );

  const iniciales =
    `${userData.nombre.charAt(0)}${userData.apellido.charAt(0)}`.toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER NAV */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/admin/usuarios"
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Perfil de Jugador
            </h1>
            <p className="text-sm text-slate-500">
              Detalle completo e historial de actividad
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          {/* COLUMNA IZQUIERDA: PERFIL CARD (FIXED CSS) */}
          <div className="space-y-6 xl:col-span-1">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {/* Banner */}
              <div className="h-32 bg-gradient-to-r from-blue-900 to-slate-900 relative">
                {userData.bloqueado && (
                  <div className="absolute inset-0 bg-red-900/50 flex items-center justify-center backdrop-blur-sm">
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                      <Ban size={12} /> USUARIO BLOQUEADO
                    </span>
                  </div>
                )}
              </div>

              <div className="px-6 pb-6">
                {/* SOLUCIÓN AL BUG VISUAL: Flex layout con margen negativo controlado */}
                <div className="relative flex justify-between items-end -mt-12 mb-4">
                  <div className="w-24 h-24 rounded-full border-4 border-white bg-white text-slate-800 flex items-center justify-center text-3xl font-bold shadow-md z-10">
                    {iniciales}
                  </div>
                  {/* Botones de Rol pequeños */}
                  <div className="mb-1 flex gap-1">
                    {userData.roles.map((rol) => (
                      <span
                        key={rol}
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${rol === "admin" ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}
                      >
                        {rol}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">
                    {userData.nombre} {userData.apellido}
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">
                    {userData.apodo ? `"${userData.apodo}"` : "Sin apodo"}
                  </p>
                </div>

                {/* DATOS DE CONTACTO */}
                <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                  <InfoItem
                    icon={Mail}
                    label="Email"
                    value={userData.email}
                    isLink
                  />
                  <InfoItem
                    icon={Phone}
                    label="Teléfono"
                    value={userData.telefono}
                    isLink
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <InfoItem
                      icon={Calendar}
                      label="Edad"
                      value={userData.fecha_nacimiento}
                    />
                    <InfoItem
                      icon={User}
                      label="Género"
                      value={userData.genero}
                    />
                  </div>
                </div>

                {/* BOTONES ACCIÓN */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => alert("Funcionalidad pendiente")}
                    className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all border ${esProfe ? "border-red-200 text-red-600 hover:bg-red-50" : "bg-slate-900 text-white hover:bg-slate-800"}`}
                  >
                    {esProfe ? <Ban size={14} /> : <Briefcase size={14} />}
                    {esProfe ? "Quitar Profe" : "Hacer Profe"}
                  </button>
                  <button className="flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50">
                    <Shield size={14} />
                    Permisos
                  </button>
                </div>
              </div>
            </div>

            {/* TARJETA "ADN DEL JUGADOR" (NUEVO) */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Activity size={14} /> Insights & Comportamiento
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-sm text-slate-600 flex items-center gap-2">
                    <MapPin size={14} className="text-blue-500" /> Cancha
                    Favorita
                  </span>
                  <span className="font-bold text-slate-900">
                    {stats.favCourt}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-sm text-slate-600 flex items-center gap-2">
                    <Clock size={14} className="text-orange-500" /> Turno
                    Preferido
                  </span>
                  <span className="font-bold text-slate-900">
                    {stats.momentoPref}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-slate-600 flex items-center gap-2">
                    <AlertCircle size={14} className="text-red-500" /> Tasa
                    Cancelación
                  </span>
                  <span
                    className={`font-bold ${Number(stats.cancelRate) > 30 ? "text-red-600" : "text-green-600"}`}
                  >
                    {stats.cancelRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: STATS Y TABLA */}
          <div className="xl:col-span-2 space-y-6">
            {/* KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                icon={Trophy}
                label="Reservas Totales"
                value={stats.total}
                color="bg-blue-500"
              />
              <StatCard
                icon={DollarSign}
                label="Inversión Total"
                value={`$${stats.gastado.toLocaleString("es-AR")}`}
                color="bg-emerald-500"
              />
              <StatCard
                icon={History}
                label="Última Visita"
                value={stats.ultima}
                color="bg-purple-500"
              />
            </div>

            {/* TABLA HISTORIAL */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" /> Historial de
                  Reservas
                </h3>
                <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                  {userData.reservas.length} registros
                </span>
              </div>

              {userData.reservas.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-10">
                  <Calendar className="w-12 h-12 mb-3 opacity-20" />
                  <p>Sin historial de reservas</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3 font-semibold text-slate-500 uppercase text-xs">
                          Fecha
                        </th>
                        <th className="px-6 py-3 font-semibold text-slate-500 uppercase text-xs">
                          Detalle
                        </th>
                        <th className="px-6 py-3 font-semibold text-slate-500 uppercase text-xs">
                          Cancha
                        </th>
                        <th className="px-6 py-3 font-semibold text-slate-500 uppercase text-xs text-right">
                          Precio
                        </th>
                        <th className="px-6 py-3 font-semibold text-slate-500 uppercase text-xs text-center">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {userData.reservas.map((res) => (
                        <tr
                          key={res.id_reserva}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                            {new Date(res.fecha).toLocaleDateString("es-AR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                            <div className="text-xs text-slate-400 font-normal">
                              {new Date(res.fecha).toLocaleDateString("es-AR", {
                                weekday: "long",
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            <div className="flex items-center gap-1.5 font-mono text-xs bg-slate-100 px-2 py-1 rounded w-fit">
                              <Clock size={12} /> {res.inicio.slice(0, 5)} -{" "}
                              {res.fin.slice(0, 5)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium text-slate-700 block">
                              {res.canchas?.nombre}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase">
                              {res.canchas?.tipos_cancha?.deportes?.nombre}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-900 font-bold text-right">
                            ${Number(res.precio_total).toLocaleString("es-AR")}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <StatusBadge status={res.estado} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
