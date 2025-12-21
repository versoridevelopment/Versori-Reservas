"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Trophy,
  Users,
} from "lucide-react";
import ProfesorCard, { Profesor } from "./profesores/ProfesorCard";

// Helper para detectar si la URL es video
const isVideo = (url: string) => url?.match(/\.(mp4|webm|mov)$/i);

export interface LandingProps {
  club: {
    nombre: string;
    subdominio: string;
    color_primario: string;
    color_secundario: string;
    logo_url?: string;
    imagen_hero_url?: string;
    texto_titulo?: string;
    texto_subtitulo?: string;
    marcas: { id: string; tipo: "imagen" | "texto"; valor: string }[];
  };
  nosotros: any;
  profesores: Profesor[];
  contacto: any;
}

export default function LandingClient({
  club,
  nosotros,
  profesores,
  contacto,
}: LandingProps) {
  // Lógica segura para extraer datos de contacto
  const telefonoPrincipal =
    contacto?.telefonos && contacto.telefonos.length > 0
      ? contacto.telefonos[0].numero
      : null;

  const direccionPrincipal =
    contacto?.direcciones && contacto.direcciones.length > 0
      ? contacto.direcciones[0]
      : null;

  const direccionTexto = direccionPrincipal
    ? `${direccionPrincipal.calle || ""} ${
        direccionPrincipal.altura_calle || ""
      }, ${direccionPrincipal.barrio || ""}`
    : null;

  const leyendaHero =
    club.texto_subtitulo || "El mejor lugar para vivir el pádel.";

  return (
    <main className="min-h-screen bg-[#0b0d12] text-gray-200 overflow-x-hidden">
      {/* ================= HERO SECTION ================= */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Fondo (Video o Imagen) */}
        <div className="absolute inset-0 z-0">
          {club.imagen_hero_url ? (
            isVideo(club.imagen_hero_url) ? (
              <video
                src={club.imagen_hero_url}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <Image
                src={club.imagen_hero_url}
                alt="Portada"
                fill
                priority
                className="object-cover"
                sizes="100vw"
              />
            )
          ) : (
            // Fallback si no hay imagen
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-[#0b0d12] to-[#0b0d12]" />
          )}
          {/* Overlay oscuro */}
          <div className="absolute inset-0 bg-black/60 z-10" />
        </div>

        {/* Contenido Hero */}
        <div className="container mx-auto px-6 relative z-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Logo o Nombre */}
            {club.logo_url ? (
              <div className="relative w-40 h-40 md:w-60 md:h-60 mx-auto mb-8">
                <Image
                  src={club.logo_url}
                  alt={club.nombre}
                  fill
                  className="object-contain drop-shadow-2xl"
                  sizes="(max-width: 768px) 160px, 240px"
                />
              </div>
            ) : (
              <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight">
                {club.nombre.toUpperCase()}
              </h1>
            )}

            {/* Textos Editables */}
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 drop-shadow-md">
              {club.texto_titulo || "EL MEJOR LUGAR PARA VIVIR EL PÁDEL"}
            </h2>
            <p className="text-xl md:text-2xl text-gray-200 max-w-2xl mx-auto mb-10 leading-relaxed drop-shadow-md">
              {leyendaHero}
            </p>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/reserva">
                <button
                  className="px-8 py-4 text-white rounded-xl font-bold text-lg transition-all shadow-lg flex items-center gap-2 mx-auto hover:brightness-110 hover:-translate-y-1"
                  style={{ backgroundColor: club.color_primario }}
                >
                  Reservar Cancha <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= CARRUSEL DE MARCAS (INFINITO) ================= */}
      {club.marcas && club.marcas.length > 0 && (
        <section className="py-1 bg-[#050608] border-y border-gray-900 overflow-hidden select-none relative z-20">
          {/* Contenedor Flex para el loop infinito (2 listas idénticas) */}
          <div className="flex overflow-hidden group w-full">
            {/* LISTA 1 */}
            <div className="flex shrink-0 animate-marquee items-center justify-around gap-24 pr-24 min-w-full group-hover:[animation-play-state:paused]">
              {club.marcas.map((marca, i) => (
                <BrandItem key={`brand-1-${i}`} marca={marca} />
              ))}
            </div>

            {/* LISTA 2 (Clon para el efecto infinito) */}
            <div
              aria-hidden="true"
              className="flex shrink-0 animate-marquee items-center justify-around gap-24 pr-24 min-w-full group-hover:[animation-play-state:paused]"
            >
              {club.marcas.map((marca, i) => (
                <BrandItem key={`brand-2-${i}`} marca={marca} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= SECCIÓN NOSOTROS ================= */}
      {nosotros && (
        <section
          id="nosotros"
          className="py-24"
          style={{ backgroundColor: club.color_secundario }}
        >
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2
                  className="font-bold tracking-wider mb-2 uppercase text-sm"
                  style={{ color: club.color_primario }}
                >
                  Nuestra Historia
                </h2>
                <h3 className="text-4xl font-bold text-white mb-6">
                  {nosotros.historia_titulo}
                </h3>
                <p className="text-gray-400 leading-relaxed mb-6 whitespace-pre-line">
                  {nosotros.historia_contenido}
                </p>
              </motion.div>

              <div className="relative h-[450px] rounded-3xl overflow-hidden shadow-2xl border border-gray-800">
                {nosotros.historia_imagen_url && (
                  <Image
                    src={nosotros.historia_imagen_url}
                    alt="Nosotros"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                )}
              </div>
            </div>

            {/* Valores Dinámicos */}
            {nosotros.valores && (
              <div className="grid md:grid-cols-3 gap-8 text-center">
                {nosotros.valores.map((val: any, i: number) => (
                  <div
                    key={i}
                    className="p-8 bg-black/20 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"
                  >
                    {/* Icono genérico o switch según titulo si quisieras */}
                    <Trophy
                      className="w-10 h-10 mx-auto mb-4"
                      style={{ color: club.color_primario }}
                    />
                    <h3 className="text-xl font-bold text-white mb-3">
                      {val.titulo}
                    </h3>
                    <p className="text-gray-400 text-sm">{val.contenido}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ================= PROFESORES ================= */}
      {profesores.length > 0 && (
        <section className="py-24 relative bg-gradient-to-b from-[#0b0d12] to-[#0e1a2b]">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white">Nuestro Equipo</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8 justify-center">
              {profesores.slice(0, 3).map((p) => (
                <ProfesorCard key={p.id_profesor} {...p} />
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/profesores">
                <button className="px-8 py-3 rounded-full border border-gray-700 text-white hover:bg-white hover:text-black transition-all font-medium">
                  Ver todo el equipo
                </button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ================= FOOTER ================= */}
      <footer
        className="pt-20 pb-10 border-t border-gray-800"
        style={{ backgroundColor: club.color_secundario }}
      >
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 mb-16">
            {/* Branding */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">
                {club.nombre}
              </h3>
              <p className="text-gray-500">
                {nosotros?.frase_cierre || "Pasión por el pádel."}
              </p>
            </div>

            {/* Navegación */}
            <div>
              <h4 className="text-white font-semibold mb-6">Navegación</h4>
              <ul className="space-y-4 text-gray-400">
                <li>
                  <Link href="/" className="hover:text-white transition-colors">
                    Inicio
                  </Link>
                </li>
                <li>
                  <Link
                    href="/profesores"
                    className="hover:text-white transition-colors"
                  >
                    Profesores
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contacto */}
            <div>
              <h4 className="text-white font-semibold mb-6">Contacto</h4>
              <ul className="space-y-4 text-gray-400">
                {direccionTexto && (
                  <li className="flex gap-3">
                    <MapPin
                      className="w-5 h-5 shrink-0"
                      style={{ color: club.color_primario }}
                    />
                    <span>{direccionTexto}</span>
                  </li>
                )}
                {telefonoPrincipal && (
                  <li className="flex gap-3">
                    <Phone
                      className="w-5 h-5 shrink-0"
                      style={{ color: club.color_primario }}
                    />
                    <span>{telefonoPrincipal}</span>
                  </li>
                )}
                {contacto?.email && (
                  <li className="flex gap-3">
                    <Mail
                      className="w-5 h-5 shrink-0"
                      style={{ color: club.color_primario }}
                    />
                    <span>{contacto.email}</span>
                  </li>
                )}
                {contacto?.usuario_instagram && (
                  <li className="flex gap-3">
                    <Instagram className="w-5 h-5 shrink-0 text-pink-500" />
                    <a
                      href={`https://instagram.com/${contacto.usuario_instagram.replace(
                        "@",
                        ""
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      {contacto.usuario_instagram}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-600 text-sm">
            © {new Date().getFullYear()} {club.nombre}. Powered by Versori.
          </div>
        </div>
      </footer>
    </main>
  );
}

// =====================================================================
// COMPONENTE AUXILIAR PARA CADA MARCA (TEXTO O IMAGEN)
// =====================================================================
const BrandItem = ({
  marca,
}: {
  marca: { tipo: "imagen" | "texto"; valor: string };
}) => {
  return (
    <div className="flex items-center justify-center">
      {marca.tipo === "imagen" && marca.valor ? (
        // --- RENDERIZADO DE IMAGEN (Logo) ---
        <div className="relative w-48 h-24 md:w-60 md:h-32 transition-transform duration-300 hover:scale-110">
          <Image
            src={marca.valor}
            alt="Marca"
            fill
            className="object-contain drop-shadow-lg"
            sizes="(max-width: 768px) 192px, 240px"
          />
        </div>
      ) : (
        // --- RENDERIZADO DE TEXTO ---
        <span className="text-3xl md:text-5xl font-black text-gray-300 hover:text-white transition-colors uppercase cursor-default whitespace-nowrap drop-shadow-md tracking-wider">
          {marca.valor}
        </span>
      )}
    </div>
  );
};
