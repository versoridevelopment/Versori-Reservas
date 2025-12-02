"use client";

import { useState, FormEvent, FC } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/supabaseClient"; // Asegúrate que la ruta sea correcta

const LoginPage: FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(`Error al iniciar sesión: ${error.message}`);
    } else {
      router.push("/");
    }

    setIsLoading(false);
  };

  // --- FUNCIÓN PARA EL LOGIN CON GOOGLE ---
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // La URL de redirección después del login exitoso
        redirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Error al iniciar sesión con Google:", error.message);
      alert("Hubo un problema al intentar iniciar sesión con Google.");
    }
  };

  return (
    <section className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#001a33] to-[#002b5b] text-white px-6 pt-32 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-[#0b2545] border border-[#1b4e89] rounded-3xl p-10 w-full max-w-md shadow-2xl text-center"
      >
        <Image
          src="/sponsors/versori/VERSORI_TRANSPARENTE.PNG"
          alt="Versori Logo"
          width={90}
          height={90}
          className="mx-auto mb-6 opacity-90"
        />
        <h1 className="text-3xl font-bold mb-2">Iniciar sesión</h1>
        <p className="text-neutral-400 text-sm mb-8">
          Accedé con tus datos para continuar con tus reservas
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
          {/* ... tus inputs de email y contraseña no cambian ... */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="ejemplo@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 rounded-xl bg-[#112d57] border border-blue-900/40 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 rounded-xl bg-[#112d57] border border-blue-900/40 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="mt-4 bg-blue-600 hover:bg-blue-700 transition-all py-3 rounded-xl font-semibold disabled:bg-blue-800"
          >
            {isLoading ? "Iniciando..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="text-gray-400 text-sm mt-6">
          ¿No tenés cuenta?{" "}
          <Link href="/register" className="text-blue-400 hover:underline">
            Registrate
          </Link>
        </p>

        <div className="mt-8">
          <div className="flex items-center gap-2 justify-center text-gray-400 text-sm mb-4">
            <span className="w-10 h-px bg-gray-600"></span>o
            <span className="w-10 h-px bg-gray-600"></span>
          </div>

          {/* --- BOTÓN DE GOOGLE CONECTADO A LA FUNCIÓN --- */}
          <button
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold px-6 py-3 rounded-xl shadow-md w-full transition-all"
          >
            <Image
              src="/google-icon.svg" // Asegúrate de tener este ícono en tu carpeta /public
              alt="Google Icon"
              width={20}
              height={20}
            />
            Iniciar sesión con Google
          </button>
        </div>
      </motion.div>
    </section>
  );
};

export default LoginPage;
