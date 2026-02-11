export async function cobrarReserva(params: {
  id_reserva: number;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  note: string;
}) {
  const res = await fetch(`/api/admin/reservas/${params.id_reserva}/cobrar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency,
      provider: params.provider,
      status: params.status,
      note: params.note,
    }),
  });

  if (!res.ok) throw new Error("Error cobrando");
  return true;
}
