"use client";

import { motion } from "framer-motion";
import { MapPin, Trophy, Users } from "lucide-react";
import Image from "next/image";

export default function NosotrosPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b0d12] to-[#0e1a2b] text-gray-200">
      {/* HERO */}
      <section className="relative w-full py-28 text-center border-b border-blue-900/30">
        <motion.h1
          className="text-5xl md:text-6xl font-bold tracking-wide text-white mb-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          » NOSOTROS «
        </motion.h1>

        <motion.p
          className="max-w-3xl mx-auto text-lg text-gray-400 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.9 }}
        >
          Somos un complejo deportivo de pádel con más de una década impulsando
          este deporte en{" "}
          <span className="text-blue-400 font-semibold">
            Corrientes, Argentina
          </span>
          . En <span className="text-white font-semibold">Versori Pádel</span>{" "}
          combinamos tradición, innovación y comunidad, creando un espacio donde
          cada jugador —profesional o aficionado— puede disfrutar al máximo.
        </motion.p>
      </section>

      {/* SECCIÓN HISTORIA */}
      <section className="py-24 border-b border-blue-900/30">
        <div className="container mx-auto px-6 text-center max-w-5xl">
          <motion.h2
            className="text-3xl font-bold text-white mb-8"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            Nuestra historia
          </motion.h2>

          <motion.p
            className="text-gray-400 text-lg leading-relaxed"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.9 }}
            viewport={{ once: true }}
          >
            Fundado en 2012,{" "}
            <span className="text-blue-400 font-semibold">Versori Pádel</span>{" "}
            nació con el sueño de crear un espacio donde el deporte y la amistad
            se encuentren. Lo que comenzó como dos canchas al aire libre, hoy es
            un complejo de primer nivel con{" "}
            <span className="text-white font-semibold">
              6 canchas profesionales, iluminación LED
            </span>{" "}
            y un ambiente familiar que respira pasión por el pádel.
          </motion.p>

          <motion.div
            className="mt-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Image
              src="/nosotros/canchas.jpg"
              alt="Canchas de pádel Versori"
              width={1000}
              height={500}
              className="rounded-2xl shadow-lg mx-auto border border-blue-900/40"
            />
          </motion.div>
        </div>
      </section>

      {/* SECCIÓN OBJETIVO / COMUNIDAD / UBICACIÓN */}
      <section className="py-24 bg-[#0d1522]">
        <div className="container mx-auto px-6 grid md:grid-cols-3 gap-12 text-center">
          {/* 1 */}
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Trophy className="text-blue-400 w-12 h-12 mb-4" />
            <h3 className="text-white font-semibold text-lg mb-2">
              Nuestra pasión
            </h3>
            <p className="text-gray-400 max-w-xs leading-relaxed">
              Promover el pádel como estilo de vida. Organizamos torneos
              locales, entrenamientos personalizados y eventos que fortalecen la
              comunidad deportiva correntina.
            </p>
          </motion.div>

          {/* 2 */}
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.9 }}
            viewport={{ once: true }}
          >
            <Users className="text-blue-400 w-12 h-12 mb-4" />
            <h3 className="text-white font-semibold text-lg mb-2">
              Nuestra comunidad
            </h3>
            <p className="text-gray-400 max-w-xs leading-relaxed">
              Más de{" "}
              <span className="text-blue-300 font-semibold">
                400 jugadores activos
              </span>{" "}
              eligen nuestro complejo cada mes. Nos une el respeto, la
              competencia sana y el amor por el deporte.
            </p>
          </motion.div>

          {/* 3 */}
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 1 }}
            viewport={{ once: true }}
          >
            <MapPin className="text-blue-400 w-12 h-12 mb-4" />
            <h3 className="text-white font-semibold text-lg mb-2">
              Nuestra ubicación
            </h3>
            <p className="text-gray-400 max-w-xs leading-relaxed">
              Nos encontramos en{" "}
              <span className="font-semibold text-blue-300">
                Corrientes Capital
              </span>
              , a pocos minutos del centro. Rodeados de naturaleza y con fácil
              acceso desde toda la ciudad.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CIERRE */}
      <footer className="py-20 text-center border-t border-blue-900/30">
        <motion.p
          className="text-gray-400 text-base italic"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          “El pádel no es solo un deporte, es nuestra forma de conectar personas
          y crear historias.”
        </motion.p>
      </footer>
    </main>
  );
}
