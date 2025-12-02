"use client";

import { useEffect, useState, FC } from "react";
import Link from "next/link";
import Container from "../ui/Container";
import { supabase } from "../../lib/supabase/supabaseClient";
import type { Session } from "@supabase/supabase-js";

// Definimos un tipo para el perfil del usuario para mayor seguridad con TypeScript
type UserProfile = {
  nombre: string | null;
  apellido: string | null;
};

const Navbar: FC = () => {
  // --- Estados del componente ---
  const [hidden, setHidden] = useState<boolean>(false);
  const [lastScrollY, setLastScrollY] = useState<number>(0);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); // <-- NUEVO ESTADO PARA EL PERFIL

  // --- Efecto para ocultar la barra al hacer scroll ---
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > lastScrollY && window.scrollY > 100) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      setLastScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // --- Efecto para gestionar la sesión y obtener el perfil ---
  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        // Si hay sesión, buscamos el perfil del usuario
        const { data: profile } = await supabase
          .from("profiles")
          .select("nombre, apellido")
          .eq("id", session.user.id)
          .single();
        setUserProfile(profile);
      }
    };

    fetchSessionAndProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        // Si el estado de la sesión cambia (ej. login), buscamos el perfil
        const { data: profile } = await supabase
          .from("profiles")
          .select("nombre, apellido")
          .eq("id", session.user.id)
          .single();
        setUserProfile(profile);
      } else {
        // Si el usuario cierra sesión, limpiamos el perfil
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- Función para cerrar sesión con confirmación ---
  const handleLogout = async () => {
    const isConfirmed = window.confirm(
      "¿Estás seguro de que querés cerrar sesión?"
    );
    if (isConfirmed) {
      await supabase.auth.signOut();
      // El listener onAuthStateChange se encargará de actualizar los estados session y userProfile a null
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 transition-transform duration-300 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <Container className="flex items-center justify-between py-4">
        <Link href="/" className="text-xl font-bold text-white tracking-wide">
          VERSORI<span className="text-blue-500">.</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-300">
          <Link href="/profesores" className="hover:text-white transition">
            Profesores
          </Link>
          <Link href="/nosotros" className="hover:text-white transition">
            Nosotros
          </Link>
          <Link
            href="/reserva"
            className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition"
          >
            Hacé tu reserva
          </Link>

          {!session ? (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-4 py-2 rounded-md transition"
              >
                Iniciar sesión
              </Link>
              <Link href="/register" className="hover:text-white transition">
                Registrarse
              </Link>
            </>
          ) : (
            <>
              {/* --- SALUDO CON NOMBRE Y APELLIDO --- */}
              <span className="text-neutral-400">
                {userProfile ? `Hola, ${userProfile.nombre}` : "Cargando..."}
              </span>
              <button
                onClick={handleLogout}
                // --- BOTÓN AZUL ---
                className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition"
              >
                Cerrar sesión
              </button>
            </>
          )}
        </nav>
      </Container>
    </header>
  );
};

export default Navbar;
