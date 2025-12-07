"use client";

import { useEffect, useState, FC } from "react";
import Link from "next/link";
import Container from "../ui/Container";
import { supabase } from "../../lib/supabase/supabaseClient";
import type { Session } from "@supabase/supabase-js";

type UserProfile = {
  nombre: string | null;
  apellido: string | null;
};

const Navbar: FC = () => {
  const [hidden, setHidden] = useState<boolean>(false);
  const [lastScrollY, setLastScrollY] = useState<number>(0);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // --- Ocultar barra al hacer scroll ---
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

  // --- Sesión + perfil ---
  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error al obtener la sesión:", error.message);
      }

      setSession(session);

      if (session) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("nombre, apellido")
          .eq("id_usuario", session.user.id) // 👈 CAMBIO CLAVE
          .single();

        if (profileError) {
          console.error("Error al obtener el perfil:", profileError.message);
        }

        setUserProfile(profile ?? null);
      } else {
        setUserProfile(null);
      }
    };

    fetchSessionAndProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      if (session) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("nombre, apellido")
          .eq("id_usuario", session.user.id) // 👈 IGUAL AQUÍ
          .single();

        if (profileError) {
          console.error("Error al obtener el perfil (onAuthStateChange):", profileError.message);
        }

        setUserProfile(profile ?? null);
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const isConfirmed = window.confirm(
      "¿Estás seguro de que querés cerrar sesión?"
    );
    if (isConfirmed) {
      await supabase.auth.signOut();
      // onAuthStateChange se encarga de limpiar los estados
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
              <span className="text-neutral-400">
                {userProfile
                  ? `Hola, ${userProfile.nombre ?? ""} ${
                      userProfile.apellido ?? ""
                    }`
                  : "Cargando..."}
              </span>
              <button
                onClick={handleLogout}
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
