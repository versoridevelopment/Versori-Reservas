// src/lib/getCurrentClub.ts
import { headers } from "next/headers";
import { getSubdomainFromHost } from "./tenantUtils";
import { getClubBySubdomain, Club } from "./getClubBySubdomain";

export type { Club } from "./getClubBySubdomain";

/**
 * Obtiene el club actual en un Server Component
 * usando el subdominio del host de la request.
 */
export async function getCurrentClub(): Promise<Club | null> {
  const headersList = await headers();

  const host =
    headersList.get("x-forwarded-host") ??
    headersList.get("host") ??
    "";

  const hostname = host
    .split(":")[0]
    .toLowerCase()
    .replace(/\.$/, "");

  const subdomain = getSubdomainFromHost(hostname);

  console.log("[getCurrentClub] host:", hostname, "subdomain:", subdomain);

  if (!subdomain) return null;

  const club = await getClubBySubdomain(subdomain);

  console.log("[getCurrentClub] club encontrado:", club?.subdominio);

  return club;
}
