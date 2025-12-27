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

// --- GENERACIÓN DE METADATOS (FAVICON DINÁMICO) ---
export async function generateMetadata(): Promise<Metadata> {
  // 1. Obtenemos datos frescos
  const club = await getCurrentClub();

  // 2. Generamos una marca de tiempo actual
  // Esto obliga al navegador a ignorar la caché anterior
  const timestamp = new Date().getTime();

  // 3. Construimos la URL con el parámetro ?v=...
  const iconUrl = club?.logo_url
    ? `${club.logo_url}?v=${timestamp}`
    : "/icon.png"; // Fallback si no hay logo

  return {
    title: club?.nombre || "Ferpadel",
    description: "Reserva tu cancha de pádel",
    icons: {
      icon: iconUrl, // Icono estándar
      shortcut: iconUrl, // Acceso directo
      apple: iconUrl, // Icono para iPhone/iPad
    },
  };
}

// --- COMPONENTE LAYOUT ---
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const club = await getCurrentClub();

  // Estados por defecto
  let tieneQuincho = false;
  let showNosotros = true;
  let showProfesores = true;

  if (club) {
    const { data: quinchoData } = await supabase
      .from("quinchos")
      .select("activo")
      .eq("id_club", club.id_club)
      .maybeSingle();

    tieneQuincho = quinchoData?.activo || false;

    const { data: configData } = await supabase
      .from("nosotros")
      .select("activo_nosotros, activo_profesores")
      .eq("id_club", club.id_club)
      .maybeSingle();

    if (configData) {
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
