type TelefonoRow = { numero: string | null; tipo: string | null };

export function pickTelefono(tels: TelefonoRow[]) {
  const clean = (s: any) => String(s ?? "").trim();
  const normalized = tels
    .map((t) => ({
      numero: clean(t.numero),
      tipo: clean(t.tipo).toLowerCase(),
    }))
    .filter((t) => t.numero.length > 0);

  if (normalized.length === 0) return "";

  const prefer = [
    "whatsapp",
    "wsp",
    "celular",
    "móvil",
    "movil",
    "mobile",
    "principal",
  ];

  for (const p of prefer) {
    const found = normalized.find((t) => t.tipo.includes(p));
    if (found) return found.numero;
  }

  return normalized[0].numero;
}
