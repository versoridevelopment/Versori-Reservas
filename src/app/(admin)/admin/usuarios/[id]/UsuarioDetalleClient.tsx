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
  LayoutGrid,
  MapPin,
} from "lucide-react";

// --- TIPOS (Adaptados a tu SQL) ---
type ReservaRaw = {
  id_reserva: number;
  fecha: string;
  inicio: string; // Time string
  fin: string;
  precio_total: number;
  estado: string;
  canchas: {
    nombre: string;
    tipos_cancha: {
      nombre: string; // Nombre del tipo (ej: Cristal)
      deportes: {
        nombre: string; // Ej: Padel
      };
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
  roles: string[]; // Array de nombres de roles
  bloqueado?: boolean; // Asumo que esto podría venir del profile o club_usuarios en el futuro
  reservas: ReservaRaw[];
};

// --- COMPONENTES UI ---

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
      <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 shadow-sm shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm font-medium text-slate-800 break-words truncate">
          {value || (
            <span className="text-slate-400 italic">No especificado</span>
          )}
        </p>
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

  // Formatear texto (ej: pendiente_pago -> Pendiente Pago)
  const label = s.replace("_", " ");

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
        styles[s] || styles.finalizada
      }`}
    >
      {label}
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

  // Carga de datos reales
  async function load() {
    setLoading(true);
    setError(null);
    try {
      // Llamada a la API que creamos en el paso anterior
      const res = await fetch(
        `/api/admin/usuarios/${idUsuario}?clubId=${clubId}`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        throw new Error("No se pudo cargar la información del usuario.");
      }

      const data = (await res.json()) as UserProfile;
      setUserData(data);
    } catch (err: any) {
      setError(err?.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [idUsuario, clubId]);

  // Cálculos derivados (Stats)
  const stats = useMemo(() => {
    if (!userData)
      return {
        totalReservas: 0,
        totalGastado: 0,
        ultimaFecha: "-",
        deporteFav: "-",
      };

    const totalReservas = userData.reservas.length;

    // Sumar solo confirmadas o finalizadas (asumiendo lógica de negocio)
    const totalGastado = userData.reservas
      .filter((r) => ["confirmada", "finalizada"].includes(r.estado))
      .reduce((acc, curr) => acc + Number(curr.precio_total), 0);

    const ultimaFecha =
      userData.reservas.length > 0
        ? new Date(userData.reservas[0].fecha).toLocaleDateString("es-AR")
        : "-";

    // Calcular deporte favorito
    const deportesCount: Record<string, number> = {};
    userData.reservas.forEach((r) => {
      const d = r.canchas?.tipos_cancha?.deportes?.nombre || "Varios";
      deportesCount[d] = (deportesCount[d] || 0) + 1;
    });
    const deporteFav = Object.keys(deportesCount).reduce(
      (a, b) => (deportesCount[a] > deportesCount[b] ? a : b),
      "-"
    );

    return { totalReservas, totalGastado, ultimaFecha, deporteFav };
  }, [userData]);

  const esProfe = useMemo(
    () => userData?.roles?.includes("profe") ?? false,
    [userData]
  );

  // Manejador de Rol Profesor
  async function toggleProfe() {
    if (!userData) return;
    const makeProfe = !esProfe;
    if (
      !confirm(
        makeProfe ? "¿Convertir en Profesor?" : "¿Quitar rol de Profesor?"
      )
    )
      return;

    // Aquí llamarías a tu endpoint de roles (ej: /api/admin/usuarios/roles)
    // Por ahora simulamos refresco
    alert(
      "Funcionalidad de cambio de rol pendiente de conectar con API PUT/POST"
    );
    await load();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="p-8 text-center min-h-screen bg-slate-50">
        <div className="bg-red-50 text-red-700 p-4 rounded-xl inline-block border border-red-200 mb-4">
          {error || "Usuario no encontrado"}
        </div>
        <br />
        <Link
          href="/admin/usuarios"
          className="text-blue-600 hover:underline font-medium"
        >
          Volver al listado
        </Link>
      </div>
    );
  }

  const iniciales = `${userData.nombre.charAt(0)}${userData.apellido.charAt(
    0
  )}`.toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER DE NAVEGACIÓN */}
        <div className="flex items-center gap-4">
          <Link
            href="/admin/usuarios"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-all shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Perfil de Usuario
            </h1>
            <p className="text-sm text-slate-500">
              Gestión de datos y reservas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          {/* COLUMNA IZQUIERDA: TARJETA DE PERFIL */}
          <div className="space-y-6 xl:col-span-1">
            {/* CARD PRINCIPAL */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden relative">
              <div className="h-28 bg-gradient-to-r from-slate-800 to-slate-900"></div>

              <div className="px-6 pb-6 relative">
                {/* Avatar Flotante */}
                <div className="absolute -top-12 left-6">
                  <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-700 shadow-md">
                    {iniciales}
                  </div>
                </div>

                <div className="mt-14 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                      {userData.nombre} {userData.apellido}
                    </h2>
                    {userData.bloqueado && (
                      <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
                        BLOQUEADO
                      </span>
                    )}
                  </div>
                  {userData.apodo && (
                    <p className="text-sm text-slate-500 font-medium">
                      "{userData.apodo}"
                    </p>
                  )}

                  {/* Roles Badges */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {userData.roles.length > 0 ? (
                      userData.roles.map((rol) => (
                        <span
                          key={rol}
                          className={`text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border ${
                            rol === "profe"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : rol === "admin"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {rol}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border bg-slate-50 text-slate-500 border-slate-200">
                        Cliente
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 grid gap-3">
                  <InfoItem icon={Mail} label="Email" value={userData.email} />
                  <InfoItem
                    icon={Phone}
                    label="Teléfono"
                    value={userData.telefono}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <InfoItem
                      icon={Calendar}
                      label="Nacimiento"
                      value={userData.fecha_nacimiento}
                    />
                    <InfoItem
                      icon={User}
                      label="Género"
                      value={userData.genero}
                    />
                  </div>
                  {userData.bio && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mt-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Biografía
                      </p>
                      <p className="text-sm text-slate-600 italic leading-relaxed">
                        "{userData.bio}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ACCIONES */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                Acciones Rápidas
              </h3>

              <button
                onClick={toggleProfe}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  esProfe
                    ? "bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50"
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
                }`}
              >
                {esProfe ? (
                  <Ban className="w-4 h-4" />
                ) : (
                  <Briefcase className="w-4 h-4" />
                )}
                {esProfe ? "Quitar Rol Profesor" : "Asignar Rol Profesor"}
              </button>

              <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-white border-2 border-slate-200 text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700 transition-all">
                <Shield className="w-4 h-4" />
                {userData.bloqueado ? "Desbloquear Acceso" : "Bloquear Acceso"}
              </button>
            </div>
          </div>

          {/* COLUMNA DERECHA: HISTORIAL Y ESTADÍSTICAS */}
          <div className="xl:col-span-2 space-y-6">
            {/* STATS RÁPIDAS (Datos Reales) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {stats.totalReservas}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Reservas Totales
                  </p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900">
                    {stats.ultimaFecha}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Última Visita
                  </p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900">
                    ${stats.totalGastado.toLocaleString("es-AR")}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Inversión Total
                  </p>
                </div>
              </div>
            </div>

            {/* TABLA DE RESERVAS */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Historial de Reservas
                </h3>
              </div>

              {userData.reservas.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="font-medium">Sin historial</p>
                  <p className="text-sm text-slate-400">
                    Este usuario aún no tiene reservas registradas.
                  </p>
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
                          Horario
                        </th>
                        <th className="px-6 py-3 font-semibold text-slate-500 uppercase text-xs">
                          Cancha / Deporte
                        </th>
                        <th className="px-6 py-3 font-semibold text-slate-500 uppercase text-xs">
                          Precio
                        </th>
                        <th className="px-6 py-3 font-semibold text-slate-500 uppercase text-xs text-right">
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
                          <td className="px-6 py-4 font-medium text-slate-900">
                            {new Date(res.fecha).toLocaleDateString("es-AR", {
                              weekday: "short",
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            <div className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded w-fit text-xs font-medium">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {res.inicio.slice(0, 5)} - {res.fin.slice(0, 5)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-700">
                                {res.canchas?.nombre || "Cancha Desconocida"}
                              </span>
                              <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                                {res.canchas?.tipos_cancha?.deportes?.nombre} ·{" "}
                                {res.canchas?.tipos_cancha?.nombre}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-900 font-medium">
                            ${Number(res.precio_total).toLocaleString("es-AR")}
                          </td>
                          <td className="px-6 py-4 text-right">
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
