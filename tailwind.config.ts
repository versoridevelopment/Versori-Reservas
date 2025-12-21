import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // --- INICIO DE LA CONFIGURACIÓN DEL CARRUSEL ---
      animation: {
        // 'linear' es clave para que no acelere ni frene, sino que sea continuo
        // 'infinite' para que nunca pare
        // '40s' es la velocidad (más segundos = más lento)
        marquee: "marquee 40s linear infinite",
      },
      keyframes: {
        marquee: {
          // Se mueve desde 0 hasta -100% (todo su ancho hacia la izquierda)
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
      // --- FIN DE LA CONFIGURACIÓN DEL CARRUSEL ---

      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
export default config;
