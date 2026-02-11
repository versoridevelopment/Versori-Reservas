import type { Segmento } from "../types";

export async function calcularPrecio(params: {
  id_club: number;
  id_cancha: number;
  fecha: string;
  inicio: string;
  fin: string;
  segmento_override: Segmento;
}) {
  const res = await fetch("/api/reservas/calcular-precio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    cache: "no-store",
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.ok) {
    return {
      ok: false as const,
      error: json?.error || "No se pudo calcular el precio",
      precio_total: 0,
    };
  }

  return {
    ok: true as const,
    precio_total: Number(json?.precio_total || 0),
  };
}
