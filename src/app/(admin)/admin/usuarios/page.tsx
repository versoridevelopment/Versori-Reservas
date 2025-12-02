"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Usuario = {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string;
  rol: "Cliente" | "Cajero" | "Administrador";
  activo: boolean;
  fotoPerfil: string;
  fechaCreacion: string;
};

export default function UsuariosPage() {
  const [userRole] = useState("Cajero"); // cambiar a "Administrador" para ver todos los usuarios

  const usuarios: Usuario[] = [
    {
      id: 1,
      nombre: "Neil",
      apellido: "Sims",
      correo: "neil@windster.com",
      telefono: "+54 379 4000001",
      rol: "Cliente",
      activo: true,
      fotoPerfil: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
      fechaCreacion: "2024-09-14T14:23:00Z",
    },
    {
      id: 2,
      nombre: "Roberta",
      apellido: "Casas",
      correo: "roberta@windster.com",
      telefono: "+54 379 4000002",
      rol: "Administrador",
      activo: true,
      fotoPerfil: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
      fechaCreacion: "2024-11-01T08:40:00Z",
    },
    {
      id: 3,
      nombre: "Thomas",
      apellido: "Lean",
      correo: "thomas@windster.com",
      telefono: "+54 379 4000003",
      rol: "Cliente",
      activo: false,
      fotoPerfil: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
      fechaCreacion: "2024-07-02T20:11:00Z",
    },
  ];

  // Si el usuario es cajero, solo ve clientes
  const usuariosVisibles =
    userRole === "Administrador"
      ? usuarios
      : usuarios.filter((u) => u.rol === "Cliente");

  const [usuariosActivos, setUsuariosActivos] = useState(usuariosVisibles);

  const handleToggleActivo = (id: number) => {
    const usuario = usuariosActivos.find((u) => u.id === id);
    if (!usuario) return;

    const accion = usuario.activo ? "desactivar" : "activar";
    const confirmar = window.confirm(
      `¿Estás seguro de que deseas ${accion} el estado de ${usuario.nombre} ${usuario.apellido}?`
    );

    if (confirmar) {
      setUsuariosActivos((prev) =>
        prev.map((u) => (u.id === id ? { ...u, activo: !u.activo } : u))
      );
    }
  };

  return (
    <div className="bg-white shadow rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-6">👥 Usuarios</h2>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b text-sm text-gray-600">
            <th className="py-2">Usuario</th>
            <th className="py-2">Correo</th>
            <th className="py-2">Teléfono</th>
            <th className="py-2">Rol</th>
            <th className="py-2">Fecha creación</th>
            <th className="py-2 text-center">Estado</th>
          </tr>
        </thead>
        <tbody>
          {usuariosActivos.map((u) => (
            <tr
              key={u.id}
              className="border-b hover:bg-gray-50 transition text-sm"
            >
              {/* Usuario + foto */}
              <td className="flex items-center gap-3 py-3">
                <div className="relative w-10 h-10">
                  <Image
                    src={u.fotoPerfil}
                    alt={`${u.nombre} ${u.apellido}`}
                    fill
                    className="rounded-full border object-cover"
                  />
                </div>
                <div>
                  <Link
                    href={`/admin/usuarios/${u.id}`}
                    className="font-medium text-[#0d1b2a] hover:underline"
                  >
                    {`${u.nombre} ${u.apellido}`}
                  </Link>
                  <p className="text-xs text-gray-500">#{u.id}</p>
                </div>
              </td>

              {/* Correo */}
              <td className="py-3">{u.correo}</td>

              {/* Teléfono */}
              <td className="py-3">{u.telefono || "—"}</td>

              {/* Rol */}
              <td className="py-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    u.rol === "Administrador"
                      ? "bg-blue-100 text-blue-800"
                      : u.rol === "Cajero"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {u.rol}
                </span>
              </td>

              {/* Fecha creación */}
              <td className="py-3 text-gray-600">
                {new Date(u.fechaCreacion).toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </td>

              {/* Estado con confirmación */}
              <td className="py-3 text-center">
                <button
                  onClick={() => handleToggleActivo(u.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    u.activo ? "bg-[#0d1b2a]" : "bg-gray-300"
                  }`}
                  title={
                    u.activo
                      ? "Usuario activo (clic para desactivar)"
                      : "Usuario inactivo (clic para activar)"
                  }
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      u.activo ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
