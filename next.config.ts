/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // ----- EXISTENTES -----
      {
        protocol: "https",
        hostname: "cdn-icons-png.flaticon.com",
      },
      {
        protocol: "https",
        hostname: "thispersondoesnotexist.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com", // para las canchas
      },
      {
        protocol: "https",
        hostname: "example.com", // logo de prueba
      },
      {
        protocol: "https",
        hostname: "your-real-domain.com", // opcional
      },

      // ----- NUEVO: SUPABASE STORAGE (OBLIGATORIO) -----
      // Permite cargar imágenes públicas desde:
      // https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

module.exports = nextConfig;
