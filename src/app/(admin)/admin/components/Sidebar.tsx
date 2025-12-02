"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  Users,
  CreditCard,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { ROLE_PERMISSIONS, Rol } from "@/lib/roles";

export function Sidebar() {
  const [userRole] = useState<Rol>("Administrador");
  const permisos = ROLE_PERMISSIONS[userRole];
  const [isPersonalizacionOpen, setIsPersonalizacionOpen] = useState(false);

  const user = {
    nombreCompleto: "Juan Cruz",
    rol: "Administrador",
    fotoPerfil: "https://thispersondoesnotexist.com/",
  };

  const links = [
    {
      key: "dashboard",
      href: "/admin",
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
    },
    {
      key: "reservas",
      href: "/admin/reservas",
      label: "Reservas",
      icon: <Calendar size={18} />,
    },
    {
      key: "usuarios",
      href: "/admin/usuarios",
      label: "Usuarios",
      icon: <Users size={18} />,
    },
    {
      key: "pagos",
      href: "/admin/pagos",
      label: "Pagos",
      icon: <CreditCard size={18} />,
    },
  ];

  const handleLogout = () => alert("Sesión cerrada");

  return (
    <aside className="w-64 bg-[#0d1b2a] text-white flex flex-col justify-between shadow-lg">
      {/* Usuario */}
      <div className="flex flex-col items-center p-5 border-b border-gray-700">
        <Link href="/admin/usuario" className="group">
          <div className="relative w-16 h-16 mx-auto transition-transform group-hover:scale-105">
            <Image
              src={user.fotoPerfil}
              alt="Foto de perfil"
              fill
              className="rounded-full border-2 border-gray-600 object-cover"
            />
          </div>
        </Link>
        <h2 className="mt-3 text-lg font-semibold">{user.nombreCompleto}</h2>
        <p className="text-xs italic text-gray-400">{user.rol}</p>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-2 space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-3 px-3 py-2 hover:bg-[#1b263b] rounded-md transition"
          >
            {link.icon}
            {link.label}
          </Link>
        ))}

        {/* Menú desplegable */}
        {userRole === "Administrador" && (
          <div>
            <button
              onClick={() => setIsPersonalizacionOpen(!isPersonalizacionOpen)}
              className="flex w-full items-center gap-3 px-3 py-2 hover:bg-[#1b263b] rounded-md transition"
            >
              <Settings size={18} />
              <span>Personalización</span>
              {isPersonalizacionOpen ? (
                <ChevronDown size={16} className="ml-auto" />
              ) : (
                <ChevronRight size={16} className="ml-auto" />
              )}
            </button>

            {isPersonalizacionOpen && (
              <div className="ml-8 mt-2 space-y-1">
                <Link
                  href="/admin/personalizacion/club"
                  className="block px-2 py-1 text-sm text-gray-300 hover:text-white hover:bg-[#1b263b] rounded-md transition"
                >
                  Club
                </Link>
                <Link
                  href="/admin/personalizacion/canchas"
                  className="block px-2 py-1 text-sm text-gray-300 hover:text-white hover:bg-[#1b263b] rounded-md transition"
                >
                  Canchas
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center justify-center gap-2 py-3 border-t border-gray-700 text-sm hover:bg-[#1b263b] transition"
      >
        <LogOut size={16} />
        Cerrar sesión
      </button>
    </aside>
  );
}
