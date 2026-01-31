"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import {
  Search,
  RefreshCw,
  Mail,
  Calendar,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  Phone,
  Ban,
  CheckCircle2,
  ExternalLink,
  Globe,
  User as UserIcon,
} from "lucide-react";

// --- TIPOS ---
type UsuarioRow = {
  id_club: number;
  id_usuario: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  created_at: string;
  roles: string[];
  es_profe: boolean;
  bloqueado: boolean;
  ultima_reserva: string | null;
};

// --- COMPONENTES UI ---

function RoleBadge({ rol }: { rol: string }) {
  const r = rol.toLowerCase();

  const styles = {
    admin: "bg-purple-100 text-purple-700 border-purple-200",
    staff: "bg-orange-100 text-orange-800 border-orange-200",
    profe: "bg-blue-100 text-blue-700 border-blue-200",
    cliente: "bg-slate-100 text-slate-600 border-slate-200",
  };

  const activeStyle = r.includes("admin")
    ? styles.admin
    : r.includes("staff")
      ? styles.staff
      : r.includes("profe")
        ? styles.profe
        : styles.cliente;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${activeStyle}`}
    >
      {rol}
    </span>
  );
}

function Avatar({
  nombre,
  apellido,
  bloqueado,
  size = "md",
}: {
  nombre: string;
  apellido: string;
  bloqueado?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const iniciales =
    `${(nombre || "").charAt(0)}${(apellido || "").charAt(0)}`.toUpperCase();

  // Tamaños ajustados
  const sizeClasses = {
    sm: "w-8 h-8 text-[10px]",
    md: "w-10 h-10 text-xs",
    lg: "w-12 h-12 text-sm",
  };

  // Colores dinámicos basados en nombre para variedad visual (opcional)
  const colors = [
    "bg-gradient-to-br from-slate-700 to-slate-800",
    "bg-gradient-to-br from-blue-600 to-blue-800",
    "bg-gradient-to-br from-emerald-600 to-emerald-800",
    "bg-gradient-to-br from-violet-600 to-violet-800",
  ];

  // Hash simple para color consistente
  const colorIndex = (nombre.length + apellido.length) % colors.length;
  const bgClass = bloqueado ? "bg-slate-400 grayscale" : colors[colorIndex];

  return (
    <div className="relative inline-block">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-white ${bgClass}`}
      >
        {iniciales}
      </div>
      {bloqueado && (
        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-slate-100">
          <Ban className="w-3 h-3 text-red-500 fill-red-50" />
        </div>
      )}
    </div>
  );
}

// --- MAIN COMPONENT ---

export default function UsuariosClient({
  clubId,
  clubNombre,
}: {
  clubId: number;
  clubNombre: string;
}) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<UsuarioRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<
    "todos" | "admin" | "profe" | "cliente"
  >("todos");
  const [statusFilter, setStatusFilter] = useState<
    "todos" | "activos" | "bloqueados"
  >("todos");

  // 1. CARGA DE DATOS
  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/usuarios?clubId=${clubId}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Error al cargar usuarios");
      }
      const data = await res.json();
      setRows(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [clubId]);

  // Lógica Filtrado
  const filteredRows = useMemo(() => {
    return rows.filter((u) => {
      const searchLower = q.toLowerCase();
      const matchesText =
        (u.nombre || "").toLowerCase().includes(searchLower) ||
        (u.apellido || "").toLowerCase().includes(searchLower) ||
        (u.email || "").toLowerCase().includes(searchLower) ||
        (u.telefono && u.telefono.includes(searchLower));

      if (!matchesText) return false;
      if (roleFilter === "profe" && !u.es_profe) return false;
      if (roleFilter === "admin" && !u.roles.includes("admin")) return false;
      if (roleFilter === "cliente" && (u.es_profe || u.roles.includes("admin")))
        return false;
      if (statusFilter === "bloqueados" && !u.bloqueado) return false;
      if (statusFilter === "activos" && u.bloqueado) return false;

      return true;
    });
  }, [rows, q, roleFilter, statusFilter]);

  // Acciones (sin cambios lógicos, solo visuales en botones)
  const handleToggleProfe = async (u: UsuarioRow) => {
    const action = u.es_profe ? "quitar rol de profesor a" : "hacer profesor a";
    if (!confirm(`¿Confirmas ${action} ${u.nombre}?`)) return;
    try {
      const makeProfe = !u.es_profe;
      const res = await fetch("/api/admin/usuarios/profe", {
        method: makeProfe ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario: u.id_usuario, id_club: clubId }),
      });
      if (!res.ok) throw new Error("Error al actualizar rol");
      setRows((prev) =>
        prev.map((r) =>
          r.id_usuario === u.id_usuario
            ? {
                ...r,
                es_profe: makeProfe,
                roles: makeProfe
                  ? [...r.roles, "profe"]
                  : r.roles.filter((role) => role !== "profe"),
              }
            : r,
        ),
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleBloqueo = async (u: UsuarioRow) => {
    const accion = u.bloqueado ? "desbloquear" : "bloquear";
    if (!confirm(`¿${accion} a ${u.nombre}?`)) return;
    try {
      const res = await fetch("/api/admin/usuarios/bloqueo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_usuario: u.id_usuario,
          bloquear: !u.bloqueado,
        }),
      });
      if (!res.ok) throw new Error("Error bloqueo");
      setRows((prev) =>
        prev.map((r) =>
          r.id_usuario === u.id_usuario ? { ...r, bloqueado: !r.bloqueado } : r,
        ),
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="flex-1 w-full bg-slate-50 min-h-screen p-6 md:p-10 space-y-8 font-sans">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm">
              <Globe className="w-6 h-6 text-blue-500" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Usuarios Registrados
            </h1>
          </div>
          <p className="text-slate-500 mt-2 text-sm max-w-xl leading-relaxed ml-1">
            Gestión de usuarios registrados en la plataforma web de{" "}
            <span className="font-semibold text-slate-700">{clubNombre}</span>.
          </p>
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-70"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>Actualizar Lista</span>
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex justify-between items-center shadow-sm">
          <span className="flex items-center gap-2">
            <Ban className="w-4 h-4" /> {error}
          </span>
          <button
            onClick={load}
            className="underline font-bold hover:text-red-900"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* CONTROLES */}
      <div className="flex flex-col lg:flex-row gap-4 items-center bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        {/* BUSCADOR */}
        <div className="relative flex-1 w-full group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 bg-transparent border-none rounded-xl text-slate-700 placeholder-slate-400 focus:ring-0 focus:bg-slate-50 transition-all"
            placeholder="Buscar por nombre, email o teléfono..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="w-px h-8 bg-slate-200 hidden lg:block mx-2"></div>

        {/* FILTROS */}
        <div className="flex gap-2 w-full lg:w-auto p-2 lg:p-0 overflow-x-auto">
          {/* ROL */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2.5 pl-4 pr-10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <option value="todos">Todos los Roles</option>
              <option value="admin">Administradores</option>
              <option value="profe">Profesores</option>
              <option value="cliente">Clientes</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* ESTADO */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter("todos")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${statusFilter === "todos" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter("activos")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${statusFilter === "activos" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Activos
            </button>
            <button
              onClick={() => setStatusFilter("bloqueados")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${statusFilter === "bloqueados" ? "bg-white text-red-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Bloqueados
            </button>
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] overflow-hidden">
        {loading ? (
          <div className="p-10 flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-slate-400 text-sm font-medium animate-pulse">
              Cargando base de datos...
            </p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center justify-center">
            <div className="bg-slate-50 p-5 rounded-full mb-4">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              No se encontraron usuarios
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              Prueba ajustando los filtros de búsqueda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Última Actividad
                  </th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((u) => (
                  <tr
                    key={u.id_usuario}
                    className={`group transition-colors ${u.bloqueado ? "bg-red-50/30 hover:bg-red-50/50" : "hover:bg-blue-50/30"}`}
                  >
                    {/* USUARIO */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <Avatar
                          nombre={u.nombre}
                          apellido={u.apellido}
                          bloqueado={u.bloqueado}
                        />
                        <div>
                          <Link
                            href={`/admin/usuarios/${u.id_usuario}`}
                            className="font-bold text-slate-800 hover:text-blue-600 transition-colors block"
                          >
                            {u.nombre} {u.apellido}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 rounded border border-slate-200">
                              ID: {u.id_usuario.slice(0, 6)}
                            </span>
                            {u.bloqueado && (
                              <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 rounded flex items-center gap-1">
                                <Ban className="w-3 h-3" /> BLOQUEADO
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* CONTACTO */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span
                            className="truncate max-w-[180px]"
                            title={u.email}
                          >
                            {u.email}
                          </span>
                        </div>
                        {u.telefono && (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{u.telefono}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* ROLES */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {(u.roles ?? []).map((rol) => (
                          <RoleBadge key={rol} rol={rol} />
                        ))}
                        {u.roles.length === 0 && (
                          <span className="text-xs text-slate-400 italic">
                            Cliente
                          </span>
                        )}
                      </div>
                    </td>

                    {/* ACTIVIDAD */}
                    <td className="px-6 py-4">
                      {u.ultima_reserva ? (
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">
                              {new Date(u.ultima_reserva).toLocaleDateString(
                                "es-AR",
                                { day: "2-digit", month: "short" },
                              )}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(u.ultima_reserva).toLocaleTimeString(
                                "es-AR",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 flex items-center gap-2 opacity-60">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />{" "}
                          Sin actividad reciente
                        </span>
                      )}
                    </td>

                    {/* ACCIONES */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        <button
                          onClick={() => handleToggleProfe(u)}
                          title={
                            u.es_profe ? "Quitar Profesor" : "Hacer Profesor"
                          }
                          className={`p-2 rounded-lg border transition-all ${
                            u.es_profe
                              ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                              : "bg-white text-slate-400 border-slate-200 hover:text-blue-600 hover:border-blue-200"
                          }`}
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleBloqueo(u)}
                          title={u.bloqueado ? "Desbloquear" : "Bloquear"}
                          className={`p-2 rounded-lg border transition-all ${
                            u.bloqueado
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                              : "bg-white text-slate-400 border-slate-200 hover:text-red-600 hover:border-red-200"
                          }`}
                        >
                          {u.bloqueado ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Ban className="w-4 h-4" />
                          )}
                        </button>

                        <Link
                          href={`/admin/usuarios/${u.id_usuario}`}
                          className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
                          title="Ver Perfil Detallado"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* FOOTER TABLA */}
        {!loading && filteredRows.length > 0 && (
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>Mostrando {filteredRows.length} resultados</span>
            <div className="flex gap-2">
              <button
                disabled
                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-300 cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled
                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-300 cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
