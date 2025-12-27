import "../globals.css";
import Navbar from "@/app/(public)/components/layout/Navbar";
import Footer from "@/app/(public)/components/layout/Footer";
import { getCurrentClub } from "@/lib/ObetenerClubUtils/getCurrentClub";
import { Montserrat } from "next/font/google";
import { Metadata } from "next";
import { supabase } from "@/lib/supabase/supabaseClient";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

// --- GENERACIÓN DE METADATOS ---
export async function generateMetadata(): Promise<Metadata> {
  const club = await getCurrentClub();

  // Timestamp para forzar actualización de caché de imágenes si cambiaron
  const timestamp = new Date().getTime();

  const iconUrl = club?.logo_url
    ? `${club.logo_url}?v=${timestamp}`
    : "/icon.png";

  return {
    title: club?.nombre || "Ferpadel",
    description: "Reserva tu cancha de pádel",
    icons: {
      icon: iconUrl,
      shortcut: iconUrl,
      apple: iconUrl,
    },
  };
}

// --- COMPONENTE LAYOUT ---
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Obtener club actual
  const club = await getCurrentClub();

  // 2. Inicializar estados por defecto
  let tieneQuincho = false;
  let showNosotros = true; // Por defecto visible si no hay config
  let showProfesores = true; // Por defecto visible si no hay config

  if (club) {
    // A) Consultar estado del Quincho
    const { data: quinchoData } = await supabase
      .from("quinchos")
      .select("activo")
      .eq("id_club", club.id_club)
      .maybeSingle();

    tieneQuincho = quinchoData?.activo || false;

    // B) Consultar estado de Nosotros y Profesores (Tabla 'nosotros')
    const { data: configData } = await supabase
      .from("nosotros")
      .select("activo_nosotros, activo_profesores")
      .eq("id_club", club.id_club)
      .maybeSingle();

    if (configData) {
      // Usamos '??' (nullish coalescing) para que si es null, sea true por defecto
      showNosotros = configData.activo_nosotros ?? true;
      showProfesores = configData.activo_profesores ?? true;
    }
  }

  return (
    <html lang="es">
      <body
        className={`relative min-h-screen text-white bg-black ${montserrat.className}`}
      >
        <div className="fixed inset-0 -z-50 bg-gradient-to-b from-[#06090e] via-[#0b1018] to-[#121a22]" />

        {/* 3. Pasar todas las props de visibilidad al Navbar */}
        <Navbar
          club={club}
          tieneQuincho={tieneQuincho}
          showNosotros={showNosotros}
          showProfesores={showProfesores}
        />

        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
