"use client";

import { useState, useEffect, FormEvent, FC } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/supabaseClient";
import { getSubdomainFromHost } from "@/lib/ObetenerClubUtils/tenantUtils";
import { getClubBySubdomain } from "@/lib/ObetenerClubUtils/getClubBySubdomain";
import { Loader2 } from "lucide-react";

type MessageType = "success" | "error" | "info" | null;

const LoginPage: FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<MessageType>(null);

  // Multi-tenant
  const [clubId, setClubId] = useState<number | null>(null);
  const [clubLogo, setClubLogo] = useState<string | null>(null);
  const [clubLoading, setClubLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchClub = async () => {
      try {
        const host = window.location.host;
        const hostname = host.split(":")[0];
        const sub = getSubdomainFromHost(hostname);

        if (!sub) return;

        const club = await getClubBySubdomain(sub);
        if (club) {
          setClubId(club.id_club);
          setClubLogo(club.logo_url);
        } else {
          setMessage("Club no encontrado para este subdominio.");
          setMessageType("error");
        }
      } finally {
        setClubLoading(false);
      }
    };

    fetchClub();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) newErrors.email = "El email es obligatorio.";
    else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) newErrors.email = "Ingresá un email válido.";
    }

    if (!password) newErrors.password = "La contraseña es obligatoria.";
    else if (password.length < 6) newErrors.password = "La contraseña debe tener al menos 6 caracteres.";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setMessage("Revisá los campos marcados en rojo.");
      setMessageType("error");
      return false;
    }

    return true;
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setMessage(null);
    setMessageType(null);
    setErrors({});

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error("No se pudo obtener el usuario.");

      // Asociar al club (si aplica)
      if (clubId) {
        try {
          await fetch("/api/memberships/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clubId, userId: data.user.id }),
          });
        } catch (memErr) {
          console.warn("Error asociando membresía, continuando login...", memErr);
        }
      }

      router.refresh();
      router.push(next);
    } catch (err: any) {
      console.error("[Login] Error:", err?.message);
      setMessage("Usuario o contraseña incorrectos.");
      setMessageType("error");
      setIsLoading(false);
    }
  };

  if (clubLoading) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#001a33] to-[#002b5b] text-white px-6">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
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
        {clubLogo ? (
          <div className="relative w-24 h-24 mx-auto mb-6">
            <Image src={clubLogo} alt="Logo del Club" fill className="object-contain" priority />
          </div>
        ) : (
          <div className="w-20 h-20 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center font-bold text-2xl">
            C
          </div>
        )}

        <h1 className="text-3xl font-bold mb-2">Iniciar sesión</h1>
        <p className="text-neutral-400 text-sm mb-8">Accedé con tus datos para continuar con tus reservas</p>

        {message && (
          <div
            className={`mb-4 text-sm p-3 rounded-xl text-left border ${
              messageType === "error"
                ? "bg-red-500/10 text-red-300 border-red-500/40"
                : messageType === "success"
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/40"
                : "bg-blue-500/10 text-blue-200 border-blue-500/40"
            }`}
          >
            {message}
          </div>
        )}

        <form noValidate onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
          <div>
            <label htmlFor="email" className="block text-sm text-gray-300 mb-1">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              placeholder="ejemplo@gmail.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: "" }));
              }}
              className={`w-full p-3 rounded-xl bg-[#112d57] border ${
                errors.email ? "border-red-500" : "border-blue-900/40"
              } focus:outline-none focus:ring-2 focus:ring-blue-600`}
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-gray-300 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: "" }));
              }}
              className={`w-full p-3 rounded-xl bg-[#112d57] border ${
                errors.password ? "border-red-500" : "border-blue-900/40"
              } focus:outline-none focus:ring-2 focus:ring-blue-600`}
            />
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-4 bg-blue-600 hover:bg-blue-700 transition-all py-3 rounded-xl font-semibold disabled:bg-blue-800 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? "Iniciando..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="text-gray-400 text-sm mt-6">
          ¿No tenés cuenta?{" "}
          <Link href="/register" className="text-blue-400 hover:underline">
            Registrate
          </Link>
        </p>

        <p className="text-gray-400 text-sm mt-4">
          ¿Olvidaste tu contraseña?{" "}
          <Link href="/forgot-password" className="text-blue-400 hover:underline">
            Recuperarla
          </Link>
        </p>
      </motion.div>
    </section>
  );
};

export default LoginPage;
