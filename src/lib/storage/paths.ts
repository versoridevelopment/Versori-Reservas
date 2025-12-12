export const PUBLIC_MEDIA_BUCKET = "public-media";

/**
 * Raíz única para TODO el contenido del club.
 * IMPORTANTE: sin "clubs/" (para no duplicar).
 */
export function clubBasePath(idClub: number) {
  return `club_${idClub}`;
}

export function clubBrandingPath(idClub: number) {
  return `${clubBasePath(idClub)}/branding`;
}
