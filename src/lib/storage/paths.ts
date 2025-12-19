// src/lib/storage/paths.ts

export const PUBLIC_MEDIA_BUCKET = "public-media";

// --- HELPERS DE RUTAS ---
export function clubBasePath(idClub: number) {
  return `club_${idClub}`;
}

export function clubBrandingPath(idClub: number) {
  return `${clubBasePath(idClub)}/branding`;
}

// --- UTILIDADES DE ARCHIVO ---
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
  return "jpg"; // Fallback
}

// --- GENERADORES DE PATHS ---
export function buildLogoPath(idClub: number, file: File) {
  const ext = safeFileExt(file);
  return `${clubBrandingPath(idClub)}/logo-${Date.now()}.${ext}`;
}

export function buildHeroPath(idClub: number, file: File) {
  const ext = safeFileExt(file);
  return `${clubBrandingPath(idClub)}/hero-${Date.now()}.${ext}`;
}
