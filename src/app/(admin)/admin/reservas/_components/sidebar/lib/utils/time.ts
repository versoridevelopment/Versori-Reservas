export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function hhmmToDecimal(hhmm: string, startHour: number) {
  const [h, m] = (hhmm || "").slice(0, 5).split(":").map(Number);
  let dec = (h || 0) + (m || 0) / 60;
  if (dec < startHour) dec += 24;
  return dec;
}

export function addMinutesHHMM(hhmm: string, addMin: number) {
  const [h, m] = (hhmm || "").slice(0, 5).split(":").map(Number);
  let total = (h || 0) * 60 + (m || 0) + (addMin || 0);
  total = ((total % 1440) + 1440) % 1440;
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function diffMinutesHHMM(startHHMM: string, endHHMM: string) {
  const [sh, sm] = startHHMM.slice(0, 5).split(":").map(Number);
  const [eh, em] = endHHMM.slice(0, 5).split(":").map(Number);
  const s = (sh || 0) * 60 + (sm || 0);
  let e = (eh || 0) * 60 + (em || 0);
  if (e <= s) e += 1440;
  return e - s;
}
