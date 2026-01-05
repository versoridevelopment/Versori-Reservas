"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import {
  Search,
  RefreshCw,
  Shield,
  User,
  Mail,
  Calendar,
  MoreHorizontal,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  Ban,
} from "lucide-react";

// --- TIPOS ---
type ApiError = { error: string };

type UsuarioRow = {
  id_club: number;
  id_usuario: string;
  nombre: string;
  apellido: string;
  email: string;
  created_at: string;
  roles: string[];
  es_profe: boolean;
  bloqueado: boolean;
  ultima_reserva: string | null;
};

// --- COMPONENTES UI AUXILIARES ---

function RoleBadge({ rol }: { rol: string }) {
  const r = rol.toLowerCase();

  const styles = {
    admin: "bg-purple-50 text-purple-700 border-purple-200",
    staff: "bg-amber-50 text-amber-700 border-amber-200",
    profe: "bg-blue-50 text-blue-700 border-blue-200",
    default: "bg-gray-100 text-gray-600 border-gray-200",
  };

  const activeStyle = r.includes("admin")
    ? styles.admin
    : r.includes("staff")
    ? styles.staff
    : r.includes("profe")
    ? styles.profe
    : styles.default;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${activeStyle}`}
    >
      {rol}
    </span>
  );
}

function Avatar({
  nombre,
  apellido,
  bloqueado,
}: {
  nombre: string;
  apellido: string;
  bloqueado?: boolean;
}) {
  const iniciales = `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();

  return (
    <div
      className={`relative w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center font-medium text-xs shadow-sm border border-white/20 
      ${
        bloqueado
          ? "bg-gray-200 text-gray-400 grayscale"
          : "bg-gradient-to-br from-[#0d1b2a] to-[#1b263b] text-white"
      }`}
    >
      {bloqueado && (
        <Ban className="absolute -top-1 -right-1 w-4 h-4 text-red-500 bg-white rounded-full p-0.5" />
      )}
      {iniciales}
    </div>
  );
}

// --- COMPONENTE MENU DESPLEGABLE (NUEVO: Usando <details>) ---
// Al aislarlo y usar <details>, eliminamos el conflicto de aria-expanded manual.
function UserActionsMenu({
  onFilterChange,
}: {
  onFilterChange: (type: "bloqueados") => void;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  // Cerrar el menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        detailsRef.current &&
        !detailsRef.current.contains(event.target as Node)
      ) {
        detailsRef.current.removeAttribute("open");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeMenu = () => {
    if (detailsRef.current) {
      detailsRef.current.removeAttribute("open");
    }
  };

  return (
    <details className="relative" ref={detailsRef}>
      <summary
        className="list-none p-2 rounded-lg border bg-white border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-center outline-none focus:ring-2 focus:ring-blue-500/20"
        title="Más opciones"
      >
        <MoreHorizontal className="w-5 h-5 text-gray-600" />
      </summary>

      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-10 py-1 animation-fade-in">
        <div className="px-4 py-2 border-b border-gray-100">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Acciones masivas
          </span>
        </div>
        <button
          onClick={closeMenu}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
        <button
          onClick={closeMenu}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Upload className="w-4 h-4" /> Importar Usuarios
        </button>

        <div className="my-1 border-t border-gray-100"></div>

        <div className="px-4 py-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Vistas
          </span>
        </div>
        <button
          onClick={() => {
            onFilterChange("bloqueados");
            closeMenu();
          }}
          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
        >
          <Ban className="w-4 h-4" /> Ver Bloqueados
        </button>
      </div>
    </details>
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [q, setQ] = useState("");
  const [filterType, setFilterType] = useState<
    "todos" | "profes" | "bloqueados"
  >("todos");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 600));

      const mockData: UsuarioRow[] = [
        {
          id_club: 1,
          id_usuario: "u1",
          nombre: "Neil",
          apellido: "Sims",
          email: "neil@demo.com",
          created_at: "2024-01-15T10:00:00",
          roles: ["cliente"],
          es_profe: false,
          bloqueado: false,
          ultima_reserva: "2025-10-19T10:00:00",
        },
        {
          id_club: 1,
          id_usuario: "u2",
          nombre: "Juan",
          apellido: "Cruz",
          email: "juan@demo.com",
          created_at: "2023-11-20T10:00:00",
          roles: ["admin"],
          es_profe: true,
          bloqueado: false,
          ultima_reserva: "2025-10-18T15:30:00",
        },
        {
          id_club: 1,
          id_usuario: "u3",
          nombre: "Usuario",
          apellido: "Bloqueado",
          email: "bad@demo.com",
          created_at: "2024-05-01T10:00:00",
          roles: ["cliente"],
          es_profe: false,
          bloqueado: true,
          ultima_reserva: null,
        },
      ];
      setRows(mockData);
    } catch (err: any) {
      setError(err?.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [clubId]);

  const filteredRows = rows.filter((u) => {
    const matchesText =
      u.nombre.toLowerCase().includes(q.toLowerCase()) ||
      u.apellido.toLowerCase().includes(q.toLowerCase()) ||
      u.email.toLowerCase().includes(q.toLowerCase());

    if (filterType === "profes" && !u.es_profe) return false;
    if (filterType === "bloqueados" && !u.bloqueado) return false;
    if (filterType === "todos" && u.bloqueado) return false;

    return matchesText;
  });

  const handleToggleProfe = (u: UsuarioRow) => {
    alert(`Lógica para cambiar rol profe a: ${u.nombre}`);
  };

  const handleToggleBloqueo = (u: UsuarioRow) => {
    const accion = u.bloqueado ? "desbloquear" : "bloquear";
    if (confirm(`¿Estás seguro de ${accion} a ${u.nombre}?`)) {
      setRows((prev) =>
        prev.map((r) =>
          r.id_usuario === u.id_usuario ? { ...r, bloqueado: !r.bloqueado } : r
        )
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Directorio de Usuarios
            </h1>
            <p className="text-sm text-gray-500">
              Gestión de clientes, profesores y permisos de {clubNombre}.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={load}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              aria-label="Recargar lista"
              title="Recargar datos"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar usuario..."
                aria-label="Buscar usuarios"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex p-1 bg-gray-100 rounded-lg border border-gray-200">
              <button
                onClick={() => setFilterType("todos")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  filterType === "todos"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterType("profes")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  filterType === "profes"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Profesores
              </button>
            </div>
          </div>

          {/* NUEVO COMPONENTE DE MENÚ AISLADO */}
          <UserActionsMenu onFilterChange={setFilterType} />
        </div>

        {/* Tabla */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Contacto</th>
                  <th className="px-6 py-4">Roles</th>
                  <th className="px-6 py-4">Última Actividad</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRows.map((u) => (
                  <tr
                    key={u.id_usuario}
                    className={`transition-colors group ${
                      u.bloqueado ? "bg-gray-50" : "hover:bg-gray-50/80"
                    }`}
                  >
                    {/* Usuario */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          nombre={u.nombre}
                          apellido={u.apellido}
                          bloqueado={u.bloqueado}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/usuarios/${u.id_usuario}`}
                              className={`font-medium transition-colors block ${
                                u.bloqueado
                                  ? "text-gray-500 line-through"
                                  : "text-gray-900 hover:text-blue-600"
                              }`}
                            >
                              {u.nombre} {u.apellido}
                            </Link>
                            {u.bloqueado && (
                              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                                BLOQUEADO
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 font-mono">
                            ID: {u.id_usuario.slice(0, 6)}...
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        {u.email}
                      </div>
                    </td>

                    {/* Roles */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {(u.roles ?? []).map((rol) => (
                          <RoleBadge key={rol} rol={rol} />
                        ))}
                        {u.es_profe && !u.roles.includes("profe") && (
                          <RoleBadge rol="profe" />
                        )}
                      </div>
                    </td>

                    {/* Última Reserva */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-sm">
                        {u.ultima_reserva ? (
                          <>
                            <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              {new Date(u.ultima_reserva).toLocaleDateString(
                                "es-AR"
                              )}
                            </div>
                            <span className="text-xs text-gray-400 pl-5">
                              {new Date(u.ultima_reserva).toLocaleTimeString(
                                "es-AR",
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            Sin actividad reciente
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleToggleProfe(u)}
                          title={
                            u.es_profe ? "Quitar Profesor" : "Hacer Profesor"
                          }
                          aria-label={
                            u.es_profe
                              ? "Quitar rol profesor"
                              : "Asignar rol profesor"
                          }
                          className={`p-1.5 rounded-lg border transition-colors ${
                            u.es_profe
                              ? "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                              : "bg-white border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200"
                          }`}
                        >
                          {u.es_profe ? (
                            <UserCheck className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-gray-300" />
                          )}
                        </button>

                        <button
                          onClick={() => handleToggleBloqueo(u)}
                          title={
                            u.bloqueado
                              ? "Desbloquear usuario"
                              : "Bloquear usuario"
                          }
                          aria-label={u.bloqueado ? "Desbloquear" : "Bloquear"}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            u.bloqueado
                              ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                              : "bg-white border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200"
                          }`}
                        >
                          {u.bloqueado ? (
                            <Shield className="w-4 h-4" />
                          ) : (
                            <Ban className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <span className="text-xs text-gray-500">
              Mostrando {filteredRows.length} resultados
            </span>
            <div className="flex gap-2">
              <button
                disabled
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 text-gray-500"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 text-gray-500"
                aria-label="Siguiente"
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
