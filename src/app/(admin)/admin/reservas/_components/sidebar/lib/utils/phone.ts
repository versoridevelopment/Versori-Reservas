export function normalizePhone(input: string) {
  return String(input || "").replace(/\D/g, "");
}
