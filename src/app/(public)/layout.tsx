import "../globals.css";
import Navbar from "@/app/(public)/components/layout/Navbar";
import Footer from "@/app/(public)/components/layout/Footer";
import { getCurrentClub } from "@/lib/ObetenerClubUtils/getCurrentClub";
import { Montserrat } from "next/font/google";
import { Metadata } from "next";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

// --- GENERACIÓN DE METADATOS (SERVER SIDE) ---
export async function generateMetadata(): Promise<Metadata> {
  const club = await getCurrentClub();

  // Creamos un timestamp para obligar al navegador a recargar el ícono
  const timestamp = new Date().getTime();

  // Si hay logo, le pegamos el timestamp. Si no, usamos un fallback (asegurate de tener un icon.png o similar si borras el favicon.ico)
  const iconUrl = club?.logo_url
    ? `${club.logo_url}?v=${timestamp}`
    : "/icon.png"; // Puedes poner una imagen genérica en public llamada icon.png

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const club = await getCurrentClub();

  return (
    <html lang="es">
      <body
        className={`relative min-h-screen text-white bg-black ${montserrat.className}`}
      >
        <div className="fixed inset-0 -z-50 bg-gradient-to-b from-[#06090e] via-[#0b1018] to-[#121a22]" />
        <Navbar club={club} />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
