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
  Download,
  Filter,
  Phone,
  Ban,
  CheckCircle2,
  ExternalLink,
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
    admin: "bg-purple-100 text-purple-700 border-purple-200 ring-purple-500/10",
    staff: "bg-orange-100 text-orange-800 border-orange-200 ring-orange-500/10",
    profe: "bg-blue-100 text-blue-700 border-blue-200 ring-blue-500/10",
    cliente: "bg-slate-100 text-slate-600 border-slate-200 ring-slate-500/10",
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
      className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ring-1 ring-inset ${activeStyle}`}
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
  const iniciales = `${(nombre || "").charAt(0)}${(apellido || "").charAt(
    0
  )}`.toUpperCase();
  const sizeClass =
    size === "lg"
      ? "w-12 h-12 text-sm"
      : size === "sm"
      ? "w-8 h-8 text-[10px]"
      : "w-10 h-10 text-xs";

  return (
    <div className="relative inline-block">
      <div
        className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-white
        ${
          bloqueado
            ? "bg-slate-400 grayscale"
            : "bg-gradient-to-br from-slate-700 to-slate-900"
        }`}
      >
        {iniciales}
      </div>
      {bloqueado && (
        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
          <Ban className="w-3.5 h-3.5 text-red-500 fill-red-50" />
        </div>
      )}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center space-x-4 p-4 border-b border-gray-100"
        >
          <div className="rounded-full bg-gray-200 h-10 w-10"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---

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

  // 1. CARGA DE DATOS REALES
  async function load() {
    setLoading(true);
    setError(null);
    try {
      // Llamada a la API que crearemos a continuación
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
      setError(err?.message || "Error inesperado al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [clubId]);

  // Lógica de Filtrado (Frontend)
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

  // 2. TOGGLE PROFESOR (Conexión Backend)
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

      // Actualización optimista local
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
            : r
        )
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 3. TOGGLE BLOQUEO (Conexión Backend)
  const handleToggleBloqueo = async (u: UsuarioRow) => {
    const accion = u.bloqueado ? "desbloquear" : "bloquear";
    if (!confirm(`¿Estás seguro de ${accion} a ${u.nombre}?`)) return;

    try {
      // Asumiendo que existe un endpoint para bloquear (generalmente requiere auth admin)
      const res = await fetch("/api/admin/usuarios/bloqueo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_usuario: u.id_usuario,
          bloquear: !u.bloqueado,
        }),
      });

      if (!res.ok) throw new Error("Error al modificar estado de bloqueo");

      setRows((prev) =>
        prev.map((r) =>
          r.id_usuario === u.id_usuario ? { ...r, bloqueado: !r.bloqueado } : r
        )
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Usuarios
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Directorio de{" "}
              <span className="font-semibold text-slate-700">{clubNombre}</span>
              .
            </p>
          </div>
          <div className="flex w-full md:w-auto gap-2">
            <button
              onClick={load}
              className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-all active:scale-95"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* ERROR MSG */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex justify-between items-center">
            <span>{error}</span>
            <button onClick={load} className="underline font-bold">
              Reintentar
            </button>
          </div>
        )}

        {/* TOOLBAR */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="relative w-full lg:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, email..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto overflow-x-auto pb-2 sm:pb-0">
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200 shrink-0">
              <Filter className="w-4 h-4 text-slate-400 ml-2" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="bg-transparent text-sm font-medium text-slate-600 outline-none cursor-pointer py-1 pr-2"
              >
                <option value="todos">Todos los Roles</option>
                <option value="admin">Administradores</option>
                <option value="profe">Profesores</option>
                <option value="cliente">Clientes</option>
              </select>
            </div>

            <div className="flex p-1 bg-slate-50 rounded-lg border border-slate-200 shrink-0">
              <button
                onClick={() => setStatusFilter("todos")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  statusFilter === "todos"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setStatusFilter("activos")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  statusFilter === "activos"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                Activos
              </button>
              <button
                onClick={() => setStatusFilter("bloqueados")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  statusFilter === "bloqueados"
                    ? "bg-white text-red-700 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                Bloqueados
              </button>
            </div>
          </div>
        </div>

        {/* TABLA / CARDS */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[300px]">
          {loading ? (
            <div className="p-6">
              <TableSkeleton />
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="p-4 bg-slate-50 rounded-full mb-3">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-slate-900 font-medium">
                No se encontraron usuarios
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                Intenta ajustar los filtros de búsqueda.
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/50 border-b border-slate-200">
                    <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Usuario</th>
                      <th className="px-6 py-4">Contacto</th>
                      <th className="px-6 py-4">Rol en Club</th>
                      <th className="px-6 py-4">Actividad</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRows.map((u) => (
                      <tr
                        key={u.id_usuario}
                        className={`group transition-colors ${
                          u.bloqueado
                            ? "bg-red-50/30 hover:bg-red-50/50"
                            : "hover:bg-slate-50/80"
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              nombre={u.nombre}
                              apellido={u.apellido}
                              bloqueado={u.bloqueado}
                            />
                            <div>
                              <Link
                                href={`/admin/usuarios/${u.id_usuario}`}
                                className="font-semibold text-sm text-slate-900 hover:text-blue-600 block transition-colors"
                              >
                                {u.nombre} {u.apellido}
                              </Link>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono mt-0.5">
                                <span>ID: {u.id_usuario.slice(0, 6)}...</span>
                                {u.bloqueado && (
                                  <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold text-[10px] font-sans">
                                    BLOQUEADO
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <span
                                className="truncate max-w-[150px]"
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
                        <td className="px-6 py-4">
                          {u.ultima_reserva ? (
                            <div className="flex flex-col text-sm">
                              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {new Date(u.ultima_reserva).toLocaleDateString(
                                  "es-AR"
                                )}
                              </div>
                              <span className="text-xs text-slate-400 pl-5">
                                {new Date(u.ultima_reserva).toLocaleTimeString(
                                  "es-AR",
                                  { hour: "2-digit", minute: "2-digit" }
                                )}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                              Sin actividad
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleToggleProfe(u)}
                              title={
                                u.es_profe
                                  ? "Quitar Profesor"
                                  : "Hacer Profesor"
                              }
                              className={`p-2 rounded-lg border transition-all ${
                                u.es_profe
                                  ? "bg-blue-50 text-blue-600 border-blue-200"
                                  : "bg-white text-slate-400 border-slate-200 hover:text-blue-600"
                              }`}
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleBloqueo(u)}
                              title={u.bloqueado ? "Desbloquear" : "Bloquear"}
                              className={`p-2 rounded-lg border transition-all ${
                                u.bloqueado
                                  ? "bg-red-50 text-red-600 border-red-200"
                                  : "bg-white text-slate-400 border-slate-200 hover:text-red-600"
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
                              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
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

              {/* MOVIL (CARDS) */}
              <div className="md:hidden grid grid-cols-1 divide-y divide-slate-100">
                {filteredRows.map((u) => (
                  <div
                    key={u.id_usuario}
                    className={`p-4 ${
                      u.bloqueado ? "bg-red-50/20" : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          nombre={u.nombre}
                          apellido={u.apellido}
                          bloqueado={u.bloqueado}
                          size="md"
                        />
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm leading-tight">
                            {u.nombre} {u.apellido}
                          </h3>
                          <div className="flex gap-1.5 mt-1">
                            {(u.roles ?? []).map((rol) => (
                              <RoleBadge key={rol} rol={rol} />
                            ))}
                            {u.bloqueado && (
                              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 rounded font-bold uppercase">
                                Bloqueado
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Link
                        href={`/admin/usuarios/${u.id_usuario}`}
                        className="p-2 text-slate-400 hover:text-blue-600"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 gap-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{u.email}</span>
                      </div>
                      {u.telefono && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span>{u.telefono}</span>
                        </div>
                      )}
                      {u.ultima_reserva && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 px-2">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            Última reserva:{" "}
                            {new Date(u.ultima_reserva).toLocaleDateString(
                              "es-AR"
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleToggleProfe(u)}
                        className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border ${
                          u.es_profe
                            ? "bg-white border-slate-200 text-slate-600"
                            : "bg-blue-50 border-blue-200 text-blue-700"
                        }`}
                      >
                        <UserCheck className="w-4 h-4" />{" "}
                        {u.es_profe ? "Quitar Profe" : "Hacer Profe"}
                      </button>
                      <button
                        onClick={() => handleToggleBloqueo(u)}
                        className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border ${
                          u.bloqueado
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-white border-red-200 text-red-600"
                        }`}
                      >
                        {u.bloqueado ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" /> Desbloquear
                          </>
                        ) : (
                          <>
                            <Ban className="w-4 h-4" /> Bloquear
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {filteredRows.length} usuarios encontrados
            </span>
            <div className="flex gap-2">
              <button
                disabled
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 disabled:opacity-50 cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 disabled:opacity-50 cursor-not-allowed"
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
