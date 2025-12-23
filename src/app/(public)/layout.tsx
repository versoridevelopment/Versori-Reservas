import "../globals.css"; // Asegúrate de que la ruta sea correcta (suele ser ./globals.css si estás en src/app)
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

export const metadata: Metadata = {
  title: "Ferpadel",
  description: "Reserva tu cancha de pádel",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const club = await getCurrentClub();

  return (
    <html lang="es">
      {/* CORRECCIÓN: Usamos template literals (``) para inyectar la variable montserrat.className */}
      <body
        className={`relative min-h-screen text-white bg-black ${montserrat.className}`}
      >
        {/* Fondo fijo degradado */}
        <div className="fixed inset-0 -z-50 bg-gradient-to-b from-[#06090e] via-[#0b1018] to-[#121a22]" />

        <Navbar club={club} />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
