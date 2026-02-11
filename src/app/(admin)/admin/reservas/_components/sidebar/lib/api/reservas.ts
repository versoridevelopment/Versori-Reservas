import type { ReservaUI } from "../types";

export async function fetchReservaFull(reservaId: number) {
  const res = await fetch(`/api/admin/reservas/${reservaId}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;

  const json = await res.json().catch(() => null);
  return (json?.data ?? json) as ReservaUI | null;
}

export async function cancelarReserva(reservaId: number, motivo?: string | null) {
  const res = await fetch(`/api/admin/reservas/${reservaId}/cancelar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ motivo_cancelacion: motivo || null }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || "Error al cancelar");
  }
  return true;
}
