// src/lib/storage/paths.ts

// --- CONSTANTES ---
export const PUBLIC_MEDIA_BUCKET = "public-media";

// --- HELPERS DE RUTAS ---
export function clubBasePath(idClub: number) {
  return `club_${idClub}`;
}

export function clubBrandingPath(idClub: number) {
  return `${clubBasePath(idClub)}/branding`;
}

// --- UTILIDADES DE ARCHIVO (Tu lógica) ---
export function safeFileExt(file: File) {
  const name = file.name || "";
  const lastDot = name.lastIndexOf(".");
  if (lastDot > -1 && lastDot < name.length - 1) {
    const ext = name
      .slice(lastDot + 1)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    if (ext) return ext;
  }
  const type = (file.type || "").toLowerCase();
  if (type.includes("png")) return "png";
  if (type.includes("jpeg") || type.includes("jpg")) return "jpg";
  if (type.includes("webp")) return "webp";
  if (type.includes("gif")) return "gif";
  return "jpg";
}

// --- GENERADOR DE PATH PARA LOGO ---
export function buildLogoPath(idClub: number, file: File) {
  const ext = safeFileExt(file);
  // Usamos timestamp para evitar caché si cambian el logo seguido
  return `${clubBrandingPath(idClub)}/logo-${Date.now()}.${ext}`;
}
