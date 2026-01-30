// src/app/auth/confirm/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function ConfirmPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("Confirmando cuenta...");

  const supabaseBrowser = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          flowType: "implicit",
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true, // ok
        },
      }
    );
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        const url = new URL(window.location.href);
        const next = url.searchParams.get("next") || "/";

        // 1) Leer hash tokens
        const hash = window.location.hash?.startsWith("#")
          ? window.location.hash.slice(1)
          : "";
        const hp = new URLSearchParams(hash);

        const access_token = hp.get("access_token");
        const refresh_token = hp.get("refresh_token");

        // A veces Supabase manda error en query (?error=...)
        const err = url.searchParams.get("error");
        const errCode = url.searchParams.get("error_code");
        if (err || errCode) {
          setMsg("El enlace no es válido o expiró. Pedí un nuevo registro.");
          return;
        }

        if (!access_token || !refresh_token) {
          // Si no hay hash, puede que ya haya session por detectSessionInUrl
          const { data } = await supabaseBrowser.auth.getSession();
          if (data.session) {
            // sync cookies SSR igual
            await fetch("/auth/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
              }),
            });
            router.refresh();
            router.replace(next);
            return;
          }

          setMsg("No se pudo iniciar sesión al confirmar (faltan tokens).");
          return;
        }

        // 2) Set session en browser
        const { error } = await supabaseBrowser.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error) {
          setMsg("Error iniciando sesión: " + error.message);
          return;
        }

        // 3) Sync a cookies SSR (para que middleware te vea logueado)
        const r = await fetch("/auth/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token, refresh_token }),
        });

        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.ok) {
          setMsg("Sesión creada, pero no se pudo sincronizar cookies SSR.");
          // igual intentamos redirigir
        }

        // 4) Refrescar server y navegar
        router.refresh();
        router.replace(next);
      } catch (e: any) {
        setMsg("Error inesperado confirmando registro.");
      }
    };

    run();
  }, [router, supabaseBrowser]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full rounded-2xl border p-6">
        <h1 className="text-xl font-semibold">Confirmación</h1>
        <p className="mt-2 text-sm opacity-80">{msg}</p>
        {msg !== "Confirmando cuenta..." && (
          <div className="mt-4">
            <a className="underline" href="/login">
              Ir al login
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
