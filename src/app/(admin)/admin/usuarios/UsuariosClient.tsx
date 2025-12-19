"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ApiError = { error: string };

type UsuarioRow = {
  id_club: number;
  id_usuario: string; // uuid
  nombre: string;
  apellido: string;
  email: string;
  created_at: string; // timestamptz
  roles: string[];    // ['cliente','profe',...]
  es_profe: boolean;
};

function RoleBadge({ rol }: { rol: string }) {
  const r = rol.toLowerCase();

  const cls =
    r === "admin"
      ? "bg-blue-100 text-blue-800"
      : r === "staff"
      ? "bg-yellow-100 text-yellow-800"
      : r === "profe"
      ? "bg-purple-100 text-purple-800"
      : "bg-green-100 text-green-800"; // cliente / default

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${cls}`}>
      {rol}
    </span>
  );
}

function Avatar({ email, nombre, apellido }: { email: string; nombre: string; apellido: string }) {
  // Si luego agregás foto en profiles, lo reemplazamos.
  const fallback = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  const alt = `${nombre} ${apellido}`;
  return (
    <div className="relative w-10 h-10">
      <Image src={fallback} alt={alt} fill className="rounded-full border object-cover" />
    </div>
  );
}

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
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("id_club", String(clubId));
      if (q.trim()) params.set("q", q.trim());

      const res = await fetch(`/api/admin/usuarios?${params.toString()}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        const e = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(e?.error || "Error al cargar usuarios");
      }

      const data = (await res.json()) as UsuarioRow[];
      setRows(data);
    } catch (err: any) {
      setError(err?.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId]);

  // búsqueda con botón (no en cada tecla) -> si querés en vivo, movemos load() a useEffect de q
  const canSearch = useMemo(() => true, []);

  async function toggleProfe(u: UsuarioRow) {
    const makeProfe = !u.es_profe;
    const accion = makeProfe ? "asignar" : "quitar";

    const ok = confirm(
      makeProfe
        ? `¿Hacer PROFE a ${u.nombre} ${u.apellido}?`
        : `¿Quitar PROFE a ${u.nombre} ${u.apellido}?`
    );
    if (!ok) return;

    try {
      const res = await fetch("/api/admin/usuarios/profe", {
        method: makeProfe ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario: u.id_usuario, id_club: clubId }),
      });

      if (!res.ok) {
        const e = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(e?.error || `No se pudo ${accion} rol profe`);
      }

      // actualizar localmente sin recargar toda la tabla
      setRows((prev) =>
        prev.map((x) => {
          if (x.id_usuario !== u.id_usuario) return x;

          const roles = new Set((x.roles ?? []).map((r) => r.toLowerCase()));
          if (makeProfe) roles.add("profe");
          else roles.delete("profe");

          const rolesArr = Array.from(roles).sort();

          return {
            ...x,
            es_profe: makeProfe,
            roles: rolesArr,
          };
        })
      );
    } catch (err: any) {
      alert(err?.message || "Error al actualizar rol profe");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">👥 Usuarios</h1>
          <p className="text-sm text-gray-600 mt-1">
            {clubNombre} · Gestión de roles (cliente / profe).
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={load}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
          >
            Recargar
          </button>
        </div>
      </div>

      {/* Toolbar (buscador) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex-1">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por email, nombre o apellido…"
            className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0d1b2a]/20"
          />
        </div>

        <button
          disabled={!canSearch}
          onClick={load}
          className="rounded-xl bg-[#0d1b2a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1b263b] disabled:opacity-60"
        >
          Buscar
        </button>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-xl p-6">
        {loading ? (
          <div className="text-sm text-gray-600">Cargando usuarios…</div>
        ) : error ? (
          <div className="text-sm text-rose-700">
            {error}
            <div className="mt-3">
              <button
                onClick={load}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-gray-600">No hay usuarios para mostrar.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-sm text-gray-600">
                <th className="py-2">Usuario</th>
                <th className="py-2">Correo</th>
                <th className="py-2">Roles</th>
                <th className="py-2">Fecha creación</th>
                <th className="py-2 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((u) => (
                <tr key={u.id_usuario} className="border-b hover:bg-gray-50 transition text-sm">
                  {/* Usuario + avatar */}
                  <td className="flex items-center gap-3 py-3">
                    <Avatar email={u.email} nombre={u.nombre} apellido={u.apellido} />
                    <div>
                      <Link
                        href={`/admin/usuarios/${u.id_usuario}`}
                        className="font-medium text-[#0d1b2a] hover:underline"
                      >
                        {u.nombre} {u.apellido}
                      </Link>
                      <p className="text-xs text-gray-500">#{u.id_usuario}</p>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="py-3">{u.email}</td>

                  {/* Roles */}
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      {(u.roles ?? []).map((rol) => (
                        <RoleBadge key={rol} rol={rol} />
                      ))}
                    </div>
                  </td>

                  {/* Fecha creación */}
                  <td className="py-3 text-gray-600">
                    {new Date(u.created_at).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </td>

                  {/* Acciones */}
                  <td className="py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => toggleProfe(u)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold text-white ${
                          u.es_profe ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                        }`}
                      >
                        {u.es_profe ? "Quitar profe" : "Hacer profe"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
