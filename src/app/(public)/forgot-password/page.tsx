"use client";

import { FormEvent, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { supabase } from "../../../lib/supabase/supabaseClient";
import { getSubdomainFromHost } from "@/lib/ObetenerClubUtils/tenantUtils";
import { getClubBySubdomain } from "@/lib/ObetenerClubUtils/getClubBySubdomain";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );

  // Estados para Branding Dinámico
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [clubName, setClubName] = useState<string>("Versori");
  const [clubLogo, setClubLogo] = useState<string | null>(null);
  const [isClubLoading, setIsClubLoading] = useState(true);

  // 1. Detectar Club al cargar
  useEffect(() => {
    const fetchClubData = async () => {
      try {
        const host = window.location.host;
        const hostname = host.split(":")[0];
        const sub = getSubdomainFromHost(hostname);
        setSubdomain(sub);

        if (sub) {
          const club = await getClubBySubdomain(sub);
          if (club) {
            setClubName(club.nombre);
            setClubLogo(club.logo_url);
          }
        }
      } catch (error) {
        console.error("Error fetching club data:", error);
      } finally {
        setIsClubLoading(false);
      }
    };

    fetchClubData();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setMessageType(null);

    try {
      // 2. Llamada a NUESTRA API (no a supabase directo)
      const response = await fetch("/api/auth/recover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          clubName, // Enviamos nombre del club
          clubLogo, // Enviamos logo del club
          subdomain, // Enviamos subdominio para el redirect
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Error al enviar correo");
      }

      setMessage(
        `Si el correo ${email} está registrado en ${clubName}, recibirás las instrucciones en breve.`
      );
      setMessageType("success");
      setIsSubmitted(true);
    } catch (error) {
      console.error("[ForgotPassword] error:", error);
      setMessage(
        "Ocurrió un error al procesar tu solicitud. Intentá nuevamente."
      );
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  if (isClubLoading) {
    return (
      <div className="min-h-screen bg-[#001a33] flex items-center justify-center text-white">
        Cargando...
      </div>
    );
  }

  // Logo dinámico para la interfaz
  const displayLogo = clubLogo || "/sponsors/versori/VERSORI_TRANSPARENTE.PNG";
  const displayAlt = clubLogo ? `${clubName} Logo` : "Versori Logo";

  if (isSubmitted) {
    return (
      <section className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#001a33] to-[#002b5b] text-white px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-[#0b2545] border border-[#1b4e89] rounded-3xl p-10 w-full max-w-md shadow-2xl text-center"
        >
          <h2 className="text-3xl font-bold mb-4">Revisá tu correo</h2>
          <div className="bg-emerald-500/10 border border-emerald-500/40 text-emerald-200 p-4 rounded-xl text-sm mb-6">
            {message}
          </div>
          <p className="text-neutral-400 text-sm">
            Volver a{" "}
            <Link href="/login" className="text-blue-400 hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#001a33] to-[#002b5b] text-white px-6 pt-32 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-[#0b2545] border border-[#1b4e89] rounded-3xl p-10 w-full max-w-md shadow-2xl text-center"
      >
        {/* LOGO DINÁMICO */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <Image
            src={displayLogo}
            alt={displayAlt}
            fill
            className="object-contain opacity-90"
            sizes="96px"
          />
        </div>

        <h1 className="text-3xl font-bold mb-2">Recuperar contraseña</h1>
        <p className="text-neutral-400 text-sm mb-8">
          Ingresá tu correo para restablecer tu contraseña de{" "}
          <strong>{clubName}</strong>.
        </p>

        {message && messageType === "error" && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-200 p-3 rounded-lg text-sm mb-4">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 rounded-xl bg-[#112d57] border border-blue-900/40 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="ejemplo@gmail.com"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-4 bg-blue-600 hover:bg-blue-700 transition-all py-3 rounded-xl font-semibold text-white disabled:bg-blue-800 disabled:cursor-not-allowed"
          >
            {isLoading ? "Enviando correo..." : "Enviar enlace de recuperación"}
          </button>
        </form>

        <p className="text-gray-400 text-sm mt-6">
          ¿Recordaste tu contraseña?{" "}
          <Link href="/login" className="text-blue-400 hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </motion.div>
    </section>
  );
};

export default ForgotPasswordPage;
