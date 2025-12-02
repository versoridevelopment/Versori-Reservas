import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Usa la configuración base de Next.js
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  {
    // Ignoramos directorios que no deben ser linted
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      ".vercel/**",
      "supabase/**",
      "src/generated/**", // 👈 Ignora todo el código autogenerado de Prisma
      "prisma/**",
      "next-env.d.ts",
    ],

    // Desactivamos reglas que causan errores en producción
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/no-wrapper-object-types": "off",
      "@typescript-eslint/no-unnecessary-type-constraint": "off",
      "no-console": "off",
    },
  },
];

export default eslintConfig;
