"use client";

import React, { useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";

type Cancha = { id_cancha: number; nombre: string };

type ClubTheme = {
  logoUrl: string | null;
  primary: string | null;
  secondary: string | null;
};

type ApiOk = {
  ok: true;
  fecha: string;
  dayTitle: string;
  duracion_min: number;
  minStart: number;
  maxEnd: number;
  slots: Record<number, string[]>;
};

type ApiErr = { ok?: false; error: string };
type ApiResp = ApiOk | ApiErr;

function isoTodayAR() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const MAX_COLS = 8;

function clampHexColor(x: string | null | undefined, fallback: string) {
  const s = String(x ?? "").trim();
  // admite #RGB / #RRGGBB
  if (/^#([0-9a-fA-F]{3}){1,2}$/.test(s)) return s;
  return fallback;
}

// texto blanco/negro según luminancia (para que el flyer quede legible con cualquier color)
function bestTextOn(hex: string) {
  const h = hex.replace("#", "");
  const full =
    h.length === 3 ? h.split("").map((c) => c + c).join("") : h.padEnd(6, "0");
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  // luminancia relativa aproximada
  const L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return L > 0.6 ? "#0b0f19" : "#ffffff";
}

export default function TurnosDisponiblesClient({
  idClub,
  clubNombre,
  clubTheme,
  phone,
  canchas,
}: {
  idClub: number;
  clubNombre: string;
  clubTheme: ClubTheme;
  phone: string;
  canchas: Cancha[];
}) {
  const [fecha, setFecha] = useState<string>(isoTodayAR());
  const [duracion, setDuracion] = useState<number>(60);

  const [selected, setSelected] = useState<number[]>(() =>
    canchas.slice(0, 1).map((c) => c.id_cancha),
  );

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiOk | null>(null);
  const [error, setError] = useState<string>("");

  const posterRef = useRef<HTMLDivElement | null>(null);

  const selectedCanchas = useMemo(
    () => canchas.filter((c) => selected.includes(c.id_cancha)),
    [canchas, selected],
  );

  const cols = Math.min(MAX_COLS, Math.max(1, selectedCanchas.length));

  function toggleCancha(id: number) {
    setSelected((prev) => {
      const exists = prev.includes(id);
      if (exists) {
        const next = prev.filter((x) => x !== id);
        return next.length === 0 ? prev : next;
      }
      if (prev.length >= MAX_COLS) return prev;
      return [...prev, id];
    });
  }

  const canGenerate = selectedCanchas.length > 0;
  const disableAddMore = selectedCanchas.length >= MAX_COLS;

  async function generar() {
    setError("");
    setData(null);

    if (!canGenerate) {
      setError("Elegí al menos 1 cancha.");
      return;
    }

    setLoading(true);
    try {
      const canchaIds = selectedCanchas.map((c) => c.id_cancha).join(",");

      const qs = new URLSearchParams();
      qs.set("fecha", fecha);
      qs.set("duracion", String(duracion));
      qs.set("cancha_ids", canchaIds);
      qs.set("id_club", String(idClub));

      const resp = await fetch(`/api/admin/turnos-disponibles?${qs.toString()}`, {
        method: "GET",
      });

      const json = (await resp.json()) as ApiResp;

      if (!("ok" in json) || !json.ok) {
        throw new Error((json as ApiErr).error || "Error");
      }
      setData(json);
    } catch (e: any) {
      setError(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function descargarPNG() {
    if (!posterRef.current) return;

    // importante para evitar PNG vacío
    const dataUrl = await toPng(posterRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      // si querés, podés fijar un fondo sólido. Yo lo dejo como está por el gradiente.
    });

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `turnos-${clubNombre}-${fecha}.png`.replaceAll(" ", "_");
    a.click();
  }

  const primary = clampHexColor(clubTheme.primary, "#0b214a");
  const secondary = clampHexColor(clubTheme.secondary, "#f7c600");
  const secondaryText = bestTextOn(secondary);

  const phoneFinal = (phone || "").trim() || "—";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="rounded-2xl border bg-white shadow-sm p-4 flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-gray-600">Día</div>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="border rounded-lg px-3 py-2 bg-white"
          />
        </div>

        <div className="space-y-1">
          <div className="text-xs font-semibold text-gray-600">Duración</div>
          <select
            value={duracion}
            onChange={(e) => setDuracion(Number(e.target.value))}
            className="border rounded-lg px-3 py-2 bg-white"
          >
            {[30, 60, 90, 120, 150, 180].map((m) => (
              <option key={m} value={m}>
                {m} min
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={generar}
          disabled={loading}
          className="rounded-lg px-4 py-2 font-semibold text-white disabled:opacity-50 shadow-sm"
          style={{ background: "#0b0f19" }}
        >
          {loading ? "Generando..." : "Generar"}
        </button>

        <button
          onClick={descargarPNG}
          disabled={!data}
          className="rounded-lg border px-4 py-2 font-semibold disabled:opacity-50 bg-white hover:bg-gray-50"
        >
          Descargar imagen
        </button>

        <div className="ml-auto text-sm text-gray-600">
          Columnas: <b>{cols}</b>{" "}
          <span className="text-gray-400">(máx {MAX_COLS})</span>
        </div>

        {error ? (
          <div className="w-full text-sm text-red-600 font-medium">{error}</div>
        ) : null}
      </div>

      {/* Selector canchas */}
      <div className="rounded-2xl border bg-white shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Canchas</div>
          <div className="text-xs text-gray-500">
            Seleccioná hasta {MAX_COLS} (mínimo 1)
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {canchas.map((c) => {
            const on = selected.includes(c.id_cancha);
            const disabled = !on && disableAddMore;
            return (
              <button
                key={c.id_cancha}
                onClick={() => !disabled && toggleCancha(c.id_cancha)}
                className={[
                  "text-left border rounded-xl px-3 py-2 transition shadow-sm",
                  on
                    ? "bg-black text-white border-black"
                    : "bg-white hover:bg-gray-50",
                  disabled ? "opacity-40 cursor-not-allowed" : "",
                ].join(" ")}
              >
                <div className="text-sm font-semibold">{c.nombre}</div>
                <div className="text-[11px] opacity-70">
                  ID #{c.id_cancha}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview */}
      <div className="flex gap-8 flex-wrap items-start">
        <div>
          <div className="font-semibold mb-2">Vista previa (exportable)</div>
          <FlyerPoster
            ref={posterRef}
            clubNombre={clubNombre}
            theme={{ ...clubTheme, primary, secondary }}
            dayTitle={data?.dayTitle ?? "DÍA"}
            canchas={selectedCanchas}
            slots={data?.slots ?? {}}
            cols={cols}
            phone={phoneFinal}
            secondaryText={secondaryText}
          />
        </div>
      </div>
    </div>
  );
}

const FlyerPoster = React.forwardRef(function FlyerPoster(
  props: {
    clubNombre: string;
    theme: { logoUrl: string | null; primary: string; secondary: string };
    dayTitle: string;
    canchas: Cancha[];
    slots: Record<number, string[]>;
    cols: number;
    phone: string;
    secondaryText: string;
  },
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const { clubNombre, theme, dayTitle, canchas, slots, cols, phone, secondaryText } =
    props;

  const columns = canchas.slice(0, cols);

  const maxRows = Math.max(
    0,
    ...columns.map((c) => (slots[c.id_cancha] ?? []).length),
  );
  const rows = Math.max(10, maxRows);

  // ancho: 1col=340, +115 por col extra (queda más “premium” y aireado)
  const width = 340 + Math.max(0, cols - 1) * 115;

  return (
    <div
      ref={ref}
      className="rounded-[22px] overflow-hidden"
      style={{
        width,
        // Fondo premium con glow
        background: `radial-gradient(1200px 500px at 20% 0%, ${theme.secondary}33 0%, transparent 40%),
                     radial-gradient(800px 500px at 90% 10%, ${theme.secondary}22 0%, transparent 45%),
                     linear-gradient(180deg, ${theme.primary} 0%, #07142e 100%)`,
        boxShadow:
          "0 25px 60px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.08)",
      }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-center gap-3">
        {theme.logoUrl ? (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "rgba(255,255,255,0.08)",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.10)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <img
              src={theme.logoUrl}
              alt="Logo"
              style={{ width: 34, height: 34, objectFit: "contain" }}
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "rgba(255,255,255,0.08)",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.10)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.65)",
              fontWeight: 900,
            }}
          >
            {clubNombre.slice(0, 1).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="text-white text-[12px] tracking-[0.18em] font-bold opacity-90 truncate">
            {clubNombre.toUpperCase()}
          </div>
          <div className="text-white/75 text-[11px] mt-1 font-semibold tracking-wider">
            TURNOS DISPONIBLES
          </div>
        </div>

        {/* Badge */}
        <div
          className="px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest"
          style={{
            background: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.75)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.10)",
          }}
        >
          {cols} CANCHAS
        </div>
      </div>

      {/* Day Bar */}
      <div
        className="px-5 py-3"
        style={{
          background: theme.secondary,
          boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.15)",
        }}
      >
        <div
          className="text-[18px] font-extrabold tracking-wide"
          style={{ color: secondaryText }}
        >
          {dayTitle}
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 py-4">
        <div
          className="rounded-[18px] overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.05)",
            boxShadow:
              "inset 0 0 0 1px rgba(255,255,255,0.10), 0 18px 40px rgba(0,0,0,0.25)",
          }}
        >
          {/* column headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              background: "rgba(255,255,255,0.06)",
            }}
          >
            {columns.map((c, i) => (
              <div
                key={`h-${c.id_cancha}-${i}`}
                className="px-2 py-2 text-center text-[11px] font-extrabold uppercase"
                style={{
                  color: "rgba(255,255,255,0.92)",
                  borderRight:
                    i === cols - 1 ? "none" : "1px solid rgba(255,255,255,0.10)",
                  letterSpacing: "0.08em",
                }}
              >
                {c.nombre}
              </div>
            ))}
          </div>

          {/* rows */}
          <div style={{ background: "rgba(7, 20, 46, 0.55)" }}>
            {Array.from({ length: rows }).map((_, r) => {
              const isEven = r % 2 === 0;
              return (
                <div
                  key={`r-${r}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                    background: isEven
                      ? "rgba(255,255,255,0.02)"
                      : "rgba(0,0,0,0.08)",
                  }}
                >
                  {columns.map((c, i) => {
                    const label = (slots[c.id_cancha] ?? [])[r] ?? "";
                    const has = label.length > 0;

                    return (
                      <div
                        key={`c-${r}-${c.id_cancha}-${i}`}
                        className="px-2 py-[8px] text-center text-[12px] font-semibold"
                        style={{
                          color: has ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.18)",
                          borderTop: "1px solid rgba(255,255,255,0.08)",
                          borderRight:
                            i === cols - 1 ? "none" : "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        {has ? label : "—"}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Phone */}
      <div className="px-5 pb-5">
        <div
          className="rounded-[16px] px-4 py-3 text-center"
          style={{
            background: theme.secondary,
            boxShadow: "0 14px 35px rgba(0,0,0,0.25)",
          }}
        >
          <div
            className="font-extrabold text-[20px] tracking-wide"
            style={{ color: secondaryText }}
          >
            {phone}
          </div>
          <div
            className="text-[10px] font-bold tracking-[0.22em] mt-1"
            style={{ color: secondaryText, opacity: 0.75 }}
          >
            RESERVAS POR WHATSAPP / TELÉFONO
          </div>
        </div>

        <div className="pt-3 text-center select-none">
          <div className="text-[9px] font-bold tracking-[0.25em] text-white/20">
            POWERED BY VERSORI
          </div>
        </div>
      </div>
    </div>
  );
});
