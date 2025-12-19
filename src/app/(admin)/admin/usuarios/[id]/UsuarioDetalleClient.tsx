"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ApiError = { error: string };

type RoleRow = {
  id_club: number;
  id_usuario: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  created_at: string;
};

export default function UsuarioDetalleClient({ clubId, idUsuario }: { clubId: number; idUsuario: string }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<RoleRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/usuarios/${idUsuario}`, { cache: "no-store" });
      if (!res.ok) {
        const e = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(e?.error || "No se pudo cargar usuario");
      }
      const data = (await res.json()) as RoleRow[];

      // Seguridad: el usuario debe pertenecer al club actual (al menos un rol)
      const belongs = data.some((x) => x.id_club === clubId);
      if (!belongs) throw new Error("El usuario no pertenece al club actual.");

      setRows(data.filter((x) => x.id_club === clubId));
    } catch (err: any) {
      setError(err?.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idUsuario, clubId]);

  const user = useMemo(() => rows[0], [rows]);
  const roles = useMemo(() => Array.from(new Set(rows.map((r) => r.rol))), [rows]);
  const esProfe = useMemo(() => roles.includes("profe"), [roles]);

  async function toggleProfe() {
    if (!user) return;
    const makeProfe = !esProfe;

    const ok = confirm(makeProfe ? "¿Asignar rol profe?" : "¿Quitar rol profe?");
    if (!ok) return;

    const res = await fetch("/api/admin/usuarios/profe", {
      method: makeProfe ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_usuario: user.id_usuario, id_club: clubId }),
    });

    if (!res.ok) {
      const e = (await res.json().catch(() => null)) as ApiError | null;
      alert(e?.error || "No se pudo actualizar rol profe");
      return;
    }

    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Usuario</h1>
          <p className="text-sm text-gray-600 mt-1">Detalle y roles por club.</p>
        </div>
        <Link
          href="/admin/usuarios"
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
        >
          Volver
        </Link>
      </div>

      <div className="bg-white shadow rounded-xl p-6">
        {loading ? (
          <div className="text-sm text-gray-600">Cargando…</div>
        ) : error ? (
          <div className="text-sm text-rose-700">{error}</div>
        ) : !user ? (
          <div className="text-sm text-gray-600">No encontrado.</div>
        ) : (
          <div className="space-y-4">
            <div className="text-lg font-semibold text-gray-900">
              {user.nombre} {user.apellido}
            </div>
            <div className="text-sm text-gray-600">{user.email}</div>

            <div className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <span key={r} className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {r}
                </span>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={toggleProfe}
                className={`px-4 py-2 rounded-xl text-sm font-semibold text-white ${
                  esProfe ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {esProfe ? "Quitar profe" : "Hacer profe"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
