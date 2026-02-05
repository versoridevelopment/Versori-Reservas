"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Ban,
  ChevronLeft,
  DollarSign,
  Trophy,
  History,
  MapPin,
  Loader2,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  StickyNote,
  Save,
  CreditCard,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

// --- TIPOS ---
type ReservaRaw = {
  id_reserva: number;
  fecha: string;
  inicio: string;
  fin: string;
  precio_total: number;
  estado: string;
  motivo_cancelacion?: string | null; // ✅ AGREGADO
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
  bloqueado?: boolean;
  notas_internas?: string;
};

// ... (COMPONENTES AUXILIARES InfoItem, StatCard, StatusBadge SE MANTIENEN IGUAL) ...
function InfoItem({ icon: Icon, label, value, isLink }: any) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
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

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
      <div
        className={`p-2.5 rounded-xl ${color} bg-opacity-10 text-opacity-100 shrink-0`}
      >
        <Icon className={`w-5 h-5 ${color.replace("bg-", "text-")}`} />
      </div>
      <div className="min-w-0">
        <p className="text-lg md:text-2xl font-bold text-slate-900 leading-none truncate">
          {value}
        </p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 truncate">
          {label}
        </p>
      </div>
    </div>
  );
}

const StatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    confirmada: "bg-green-100 text-green-700 border-green-200",
    pendiente_pago: "bg-yellow-50 text-yellow-700 border-yellow-200",
    cancelada: "bg-red-50 text-red-700 border-red-200",
    finalizada: "bg-slate-100 text-slate-600 border-slate-200",
    expirada: "bg-gray-100 text-gray-500 border-gray-200",
  };

  const icons: any = {
    confirmada: <CheckCircle2 className="w-3 h-3" />,
    pendiente_pago: <AlertTriangle className="w-3 h-3" />,
    cancelada: <XCircle className="w-3 h-3" />,
    finalizada: <CheckCircle2 className="w-3 h-3" />,
    expirada: <XCircle className="w-3 h-3" />,
  };

  const s = status.toLowerCase();
  const style = styles[s] || styles.finalizada;
  const icon = icons[s] || null;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${style}`}
    >
      {icon} {s.replace("_", " ")}
    </span>
  );
};

// --- COMPONENTE PRINCIPAL ---

export default function UsuarioDetalleClient({
  clubId,
  idUsuario,
}: {
  clubId: number;
  idUsuario: string;
}) {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    ),
  );

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserProfile | null>(null);

  // Notas
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Permisos
  const [togglingRole, setTogglingRole] = useState<string | null>(null);
  const [viewerIsAdmin, setViewerIsAdmin] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/usuarios/${idUsuario}?clubId=${clubId}`,
      );
      if (!res.ok) throw new Error("Error cargando perfil");
      const data = await res.json();
      setUserData(data);
      setNotes(data.notas_internas || "");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const checkViewerPermissions = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: rolesData } = await supabase
        .from("club_usuarios")
        .select("roles!inner(nombre)")
        .eq("id_usuario", user.id)
        .eq("id_club", clubId);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isAdmin = rolesData?.some((r: any) => {
        const name = r.roles?.nombre?.toLowerCase().trim();
        return (
          name === "admin" || name === "administrador" || name === "propietario"
        );
      });

      setViewerIsAdmin(isAdmin || false);
    };

    checkViewerPermissions();
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idUsuario, clubId, supabase]);

  const handleToggleRole = async (roleName: string) => {
    if (!confirm(`¿Confirmas cambiar el permiso de ${roleName.toUpperCase()}?`))
      return;
    setTogglingRole(roleName);
    try {
      const res = await fetch(`/api/admin/usuarios/${idUsuario}/roles`, {
        method: "POST",
        body: JSON.stringify({ clubId, roleName }),
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "Error al actualizar permisos");
        return;
      }
      await load();
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    } finally {
      setTogglingRole(null);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/admin/usuarios/${idUsuario}/notas`, {
        method: "POST",
        body: JSON.stringify({ clubId, notas: notes }),
      });
      if (!res.ok) alert("No se pudo guardar la nota");
    } catch (e) {
      console.error(e);
    } finally {
      setSavingNotes(false);
    }
  };

  const stats = useMemo(() => {
    if (!userData) return null;
    const total = userData.reservas.length;
    const gastado = userData.reservas
      .filter((r) => r.estado === "finalizada" || r.estado === "confirmada")
      .reduce((acc, curr) => acc + Number(curr.precio_total), 0);

    let edad = "-";
    if (userData.fecha_nacimiento) {
      const born = new Date(userData.fecha_nacimiento);
      const today = new Date();
      let age = today.getFullYear() - born.getFullYear();
      const m = today.getMonth() - born.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < born.getDate())) {
        age--;
      }
      edad = `${age} años`;
    }

    const ultima =
      total > 0
        ? new Date(userData.reservas[0].fecha).toLocaleDateString("es-AR")
        : "-";

    const counts: Record<string, number> = {};
    userData.reservas.forEach((r) => {
      counts[r.canchas?.nombre || "Varios"] =
        (counts[r.canchas?.nombre || "Varios"] || 0) + 1;
    });
    const favCourt =
      Object.keys(counts).length > 0
        ? Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b))
        : "-";

    return { total, gastado, edad, favCourt, ultima };
  }, [userData]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center text-slate-500">
        <Loader2 className="animate-spin mr-2" /> Cargando...
      </div>
    );
  if (!userData || !stats)
    return (
      <div className="p-8 text-center text-red-500">Usuario no encontrado</div>
    );

  const targetEsAdmin = userData.roles.includes("admin");
  const targetEsCajero = userData.roles.includes("cajero");
  const iniciales =
    `${userData.nombre.charAt(0)}${userData.apellido.charAt(0)}`.toUpperCase();

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-10 animate-in fade-in duration-500 pb-20">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex items-center gap-4">
          <Link
            href="/admin/usuarios"
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 shadow-sm"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">
              Perfil de Jugador
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* COLUMNA IZQ: PERFIL */}
          <div className="space-y-6 xl:col-span-1">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="h-28 md:h-32 bg-gradient-to-r from-blue-900 to-slate-900 relative">
                {userData.bloqueado && (
                  <div className="absolute inset-0 bg-red-900/50 flex items-center justify-center backdrop-blur-sm">
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                      <Ban size={12} /> BLOQUEADO
                    </span>
                  </div>
                )}
              </div>

              <div className="px-5 pb-6">
                <div className="relative flex flex-col md:flex-row md:justify-between items-center md:items-end -mt-10 md:-mt-12 mb-4 gap-3">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white bg-white text-slate-800 flex items-center justify-center text-2xl md:text-3xl font-bold shadow-md z-10 shrink-0">
                    {iniciales}
                  </div>
                  <div className="flex gap-1.5 flex-wrap justify-center md:justify-end md:mb-1">
                    {targetEsAdmin && (
                      <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase bg-purple-100 text-purple-700 border border-purple-200 shadow-sm">
                        ADMIN
                      </span>
                    )}
                    {targetEsCajero && (
                      <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm">
                        CAJERO
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-center md:text-left space-y-1">
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                    {userData.nombre} {userData.apellido}
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">
                    {userData.apodo || "Sin apodo"}
                  </p>
                </div>

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
                    <InfoItem icon={Calendar} label="Edad" value={stats.edad} />
                    <InfoItem
                      icon={User}
                      label="Género"
                      value={userData.genero}
                    />
                  </div>
                </div>

                {viewerIsAdmin && (
                  <div className="mt-6 pt-6 border-t border-slate-100 bg-amber-50/50 -mx-5 px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                        <StickyNote size={14} /> Notas Internas
                      </label>
                      <button
                        onClick={handleSaveNotes}
                        disabled={savingNotes}
                        className="text-[10px] flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-800 px-2 py-1 rounded transition-colors disabled:opacity-50"
                      >
                        {savingNotes ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : (
                          <Save size={10} />
                        )}
                        Guardar
                      </button>
                    </div>
                    <textarea
                      className="w-full bg-white border border-amber-200 rounded-xl p-3 text-sm text-slate-700 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 outline-none resize-none placeholder:text-amber-800/30 min-h-[100px]"
                      rows={3}
                      placeholder="Escribe notas privadas (deudas, preferencias)..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      onBlur={handleSaveNotes}
                    />
                  </div>
                )}

                {viewerIsAdmin && (
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                      <ShieldCheck size={12} className="inline mr-1" />
                      Permisos del Sistema
                    </p>
                    <div className="space-y-3">
                      <button
                        disabled={togglingRole === "cajero"}
                        onClick={() => handleToggleRole("cajero")}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all active:scale-[0.98] ${
                          targetEsCajero
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-slate-200 bg-white text-slate-600"
                        }`}
                      >
                        <span className="flex items-center gap-2 font-semibold text-sm">
                          <CreditCard size={16} /> Acceso Cajero
                        </span>
                        {togglingRole === "cajero" ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <span className="text-xs font-bold uppercase">
                            {targetEsCajero ? "Revocar" : "Otorgar"}
                          </span>
                        )}
                      </button>

                      <button
                        disabled={togglingRole === "admin"}
                        onClick={() => handleToggleRole("admin")}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all active:scale-[0.98] ${
                          targetEsAdmin
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-slate-200 bg-white text-slate-600"
                        }`}
                      >
                        <span className="flex items-center gap-2 font-semibold text-sm">
                          <ShieldCheck size={16} /> Acceso Admin
                        </span>
                        {togglingRole === "admin" ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <span className="text-xs font-bold uppercase">
                            {targetEsAdmin ? "Revocar" : "Otorgar"}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: STATS Y LISTA */}
          <div className="xl:col-span-2 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              <StatCard
                icon={Trophy}
                label="Reservas"
                value={stats.total}
                color="bg-blue-500"
              />
              <StatCard
                icon={DollarSign}
                label="Inversión"
                value={`$${stats.gastado.toLocaleString("es-AR")}`}
                color="bg-emerald-500"
              />
              <div className="col-span-2 md:col-span-1">
                <StatCard
                  icon={History}
                  label="Última Vez"
                  value={stats.ultima}
                  color="bg-purple-500"
                />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full min-h-[400px]">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-base">
                  <Clock className="w-4 h-4 text-slate-400" /> Historial
                </h3>
                <span className="text-[10px] md:text-xs bg-white px-2 py-1 rounded border border-slate-200 text-slate-500 font-medium">
                  {userData.reservas.length} jugados
                </span>
              </div>

              {userData.reservas.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-10">
                  <Calendar className="w-12 h-12 mb-3 opacity-20" />
                  <p>Sin actividad reciente</p>
                </div>
              ) : (
                <div className="flex-1">
                  {/* --- VISTA ESCRITORIO (Tabla) --- */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-6 py-3 font-semibold">Fecha</th>
                          <th className="px-6 py-3 font-semibold">Horario</th>
                          <th className="px-6 py-3 font-semibold">Cancha</th>
                          <th className="px-6 py-3 font-semibold text-center">
                            Estado
                          </th>
                          <th className="px-6 py-3 font-semibold text-right">
                            Monto
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
                              {new Date(res.fecha).toLocaleDateString("es-AR")}
                            </td>
                            <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                              {res.inicio.slice(0, 5)} - {res.fin.slice(0, 5)}
                            </td>
                            <td className="px-6 py-4 text-slate-700">
                              {res.canchas?.nombre}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <StatusBadge status={res.estado} />
                                {/* ✅ RENDERIZAR MOTIVO EN ESCRITORIO */}
                                {res.estado === "cancelada" &&
                                  res.motivo_cancelacion && (
                                    <span
                                      className="text-[10px] text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100 max-w-[150px] truncate"
                                      title={res.motivo_cancelacion}
                                    >
                                      {res.motivo_cancelacion}
                                    </span>
                                  )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-xs">
                              {formatMoney(res.precio_total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* --- VISTA MÓVIL (Tarjetas) --- */}
                  <div className="md:hidden divide-y divide-slate-100">
                    {userData.reservas.map((res) => (
                      <div
                        key={res.id_reserva}
                        className="p-4 flex flex-col gap-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-slate-800 text-sm">
                              {new Date(res.fecha).toLocaleDateString("es-AR", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                            </p>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                              {res.inicio.slice(0, 5)} - {res.fin.slice(0, 5)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-900 text-sm mb-1">
                              {formatMoney(res.precio_total)}
                            </p>
                            <StatusBadge status={res.estado} />
                            {/* ✅ RENDERIZAR MOTIVO EN MÓVIL */}
                            {res.estado === "cancelada" &&
                              res.motivo_cancelacion && (
                                <p className="text-[10px] text-red-600 mt-1 max-w-[120px] ml-auto leading-tight bg-red-50 p-1 rounded">
                                  {res.motivo_cancelacion}
                                </p>
                              )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="font-medium truncate">
                            {res.canchas?.nombre}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
