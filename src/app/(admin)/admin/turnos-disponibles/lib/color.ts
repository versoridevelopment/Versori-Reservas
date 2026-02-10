export function isoTodayAR() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function clampHexColor(x: string | null | undefined, fallback: string) {
  const s = String(x ?? "").trim();
  if (/^#([0-9a-fA-F]{3}){1,2}$/.test(s)) return s;
  return fallback;
}

export function bestTextOn(hex: string) {
  const h = hex.replace("#", "");
  const full =
    h.length === 3 ? h.split("").map((c) => c + c).join("") : h.padEnd(6, "0");
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return L > 0.6 ? "#0b0f19" : "#ffffff";
}
