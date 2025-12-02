import "./../globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="relative min-h-screen text-white bg-black">
        {/* 🌫️ Fondo degradado global */}
        <div className="fixed inset-0 -z-50 bg-gradient-to-b from-[#06090e] via-[#0b1018] to-[#121a22]" />

        {/* 📌 Contenido */}
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
