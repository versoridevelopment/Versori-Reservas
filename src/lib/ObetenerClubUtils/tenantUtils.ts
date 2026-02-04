// src/lib/tenantUtils.ts

const APEX_HOSTS = new Set([
  "versorisports.com",
  "www.versorisports.com",
]);

/**
 * Extrae el subdominio a partir de un hostname.
 */
export function getSubdomainFromHost(hostname: string): string | null {
  const host = hostname
    .toLowerCase()
    .replace(/\.$/, ""); // quita punto final si existe

  // Dominio base (apex)
  if (APEX_HOSTS.has(host)) return null;

  const parts = host.split(".").filter(Boolean);

  // Dev: ferpadel.localhost
  if (parts.length === 2 && parts[1] === "localhost") {
    return parts[0] === "localhost" ? null : parts[0];
  }

  // Prod: sub.dominio.com
  if (parts.length >= 3) {
    const sub = parts[0];
    if (sub === "www") return null;
    return sub;
  }

  return null;
}
