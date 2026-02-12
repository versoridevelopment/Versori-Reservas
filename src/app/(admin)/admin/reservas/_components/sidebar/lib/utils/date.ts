export function toISODateLocal(d: Date | string | undefined | null) {
  if (!d) return new Date().toISOString().split("T")[0];

  const dateObj =
    typeof d === "string" ? new Date(d.includes("T") ? d : d + "T12:00:00") : d;

  if (isNaN(dateObj.getTime())) return new Date().toISOString().split("T")[0];

  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
