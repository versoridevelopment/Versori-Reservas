// src/app/(admin)/admin/turnos-disponibles/_components/FlyerPoster.tsx
"use client";

import React from "react";
import type { Cancha } from "../lib/types";

export type FlyerTheme = {
  logoUrl: string | null;
  primary: string; // ya “clamp” aplicado
  secondary: string; // ya “clamp” aplicado
};

export type FlyerPosterProps = {
  clubNombre: string;
  theme: FlyerTheme;
  dayTitle: string;
  canchas: Cancha[];
  slots: Record<number, string[]>;
  cols: number;
  phone: string;
  secondaryText: string; // ya calculado con bestTextOn(secondary)
};

export const FlyerPoster = React.forwardRef<HTMLDivElement, FlyerPosterProps>(
  function FlyerPoster(props, ref) {
    const {
      clubNombre,
      theme,
      dayTitle,
      canchas,
      slots,
      cols,
      phone,
      secondaryText,
    } = props;

    const columns = canchas.slice(0, cols);

    const maxRows = Math.max(
      0,
      ...columns.map((c) => (slots[c.id_cancha] ?? []).length),
    );
    const rows = Math.max(10, maxRows);

    // ancho: 1col=342, +118 por col extra (aireado)
    const width = 342 + Math.max(0, cols - 1) * 118;

    const clubUpper = clubNombre.toUpperCase();
    const badgeBg = "rgba(255,255,255,0.10)";
    const stroke = "rgba(255,255,255,0.10)";

    return (
      <div
        ref={ref}
        className="rounded-[26px] overflow-hidden"
        style={{
          width,
          position: "relative",
          // Fondo más premium (mesh + depth)
          background: `
            radial-gradient(1100px 520px at 18% 0%, ${theme.secondary}44 0%, transparent 42%),
            radial-gradient(900px 520px at 92% 8%, ${theme.secondary}22 0%, transparent 50%),
            radial-gradient(700px 520px at 50% 110%, ${theme.primary}55 0%, transparent 60%),
            linear-gradient(180deg, ${theme.primary} 0%, #07142e 72%, #060f22 100%)
          `,
          boxShadow:
            "0 28px 70px rgba(0,0,0,0.40), inset 0 0 0 1px rgba(255,255,255,0.10)",
        }}
      >
        {/* Noise overlay (sutil, sin assets) */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: 0.12,
            mixBlendMode: "overlay",
            backgroundImage: `
              url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.45'/%3E%3C/svg%3E")
            `,
            backgroundSize: "180px 180px",
          }}
        />

        {/* Top gloss */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.00) 22%)",
          }}
        />

        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex items-center gap-3 relative">
          {theme.logoUrl ? (
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 16,
                background: "rgba(255,255,255,0.08)",
                boxShadow:
                  "inset 0 0 0 1px rgba(255,255,255,0.14), 0 10px 24px rgba(0,0,0,0.22)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
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
                width: 46,
                height: 46,
                borderRadius: 16,
                background: "rgba(255,255,255,0.08)",
                boxShadow:
                  "inset 0 0 0 1px rgba(255,255,255,0.14), 0 10px 24px rgba(0,0,0,0.22)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,0.78)",
                fontWeight: 950,
                letterSpacing: "0.04em",
              }}
            >
              {clubNombre.slice(0, 1).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="text-white text-[12px] tracking-[0.22em] font-extrabold truncate opacity-95">
              {clubUpper}
            </div>
            <div className="text-white/70 text-[11px] mt-1 font-semibold tracking-[0.18em]">
              TURNOS DISPONIBLES
            </div>
          </div>

          {/* Badge */}
          <div
            className="px-3 py-1.5 rounded-full text-[10px] font-extrabold tracking-[0.20em]"
            style={{
              background: badgeBg,
              color: "rgba(255,255,255,0.80)",
              boxShadow: `inset 0 0 0 1px ${stroke}`,
              backdropFilter: "blur(6px)",
            }}
          >
            {cols} CANCHAS
          </div>
        </div>

        {/* Separator line */}
        <div
          aria-hidden
          style={{
            height: 1,
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 20%, rgba(255,255,255,0.10) 80%, transparent 100%)",
          }}
        />

        {/* Day Bar */}
        <div
          className="px-5 py-3 relative"
          style={{
            background: theme.secondary,
            boxShadow:
              "inset 0 -1px 0 rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.12)",
          }}
        >
          {/* subtle shine */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.00) 55%)",
              opacity: 0.25,
            }}
          />
          <div
            className="text-[18px] font-extrabold tracking-wide relative"
            style={{ color: secondaryText }}
          >
            {dayTitle}
          </div>
        </div>

        {/* Grid */}
        <div className="px-4 py-4">
          <div
            className="rounded-[20px] overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.05)",
              boxShadow:
                "inset 0 0 0 1px rgba(255,255,255,0.10), 0 18px 45px rgba(0,0,0,0.30)",
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
                      i === cols - 1
                        ? "none"
                        : "1px solid rgba(255,255,255,0.10)",
                    letterSpacing: "0.10em",
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
                        : "rgba(0,0,0,0.10)",
                    }}
                  >
                    {columns.map((c, i) => {
                      const label = (slots[c.id_cancha] ?? [])[r] ?? "";
                      const has = label.length > 0;

                      return (
                        <div
                          key={`c-${r}-${c.id_cancha}-${i}`}
                          className="px-2 py-[9px] text-center text-[12px] font-semibold"
                          style={{
                            borderTop: "1px solid rgba(255,255,255,0.08)",
                            borderRight:
                              i === cols - 1
                                ? "none"
                                : "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          {/* “pill” para turnos: sube mucho el look */}
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              minWidth: 64,
                              padding: "6px 10px",
                              borderRadius: 999,
                              lineHeight: 1,
                              letterSpacing: "0.02em",
                              color: has
                                ? "rgba(255,255,255,0.94)"
                                : "rgba(255,255,255,0.22)",
                              background: has
                                ? "rgba(255,255,255,0.09)"
                                : "rgba(255,255,255,0.04)",
                              boxShadow: has
                                ? "inset 0 0 0 1px rgba(255,255,255,0.14)"
                                : "inset 0 0 0 1px rgba(255,255,255,0.08)",
                              backdropFilter: "blur(6px)",
                            }}
                          >
                            {has ? label : "—"}
                          </div>
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
            className="rounded-[18px] px-4 py-3 text-center relative"
            style={{
              background: theme.secondary,
              boxShadow:
                "0 16px 40px rgba(0,0,0,0.28), inset 0 0 0 1px rgba(255,255,255,0.14)",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 18,
                pointerEvents: "none",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.00) 55%)",
                opacity: 0.22,
              }}
            />

            <div
              className="font-extrabold text-[20px] tracking-wide relative"
              style={{ color: secondaryText }}
            >
              {phone}
            </div>
            <div
              className="text-[10px] font-bold tracking-[0.22em] mt-1 relative"
              style={{ color: secondaryText, opacity: 0.78 }}
            >
              RESERVAS POR WHATSAPP / TELÉFONO
            </div>
          </div>

          <div className="pt-3 text-center select-none">
            <div className="text-[9px] font-bold tracking-[0.28em] text-white/20">
              POWERED BY VERSORI
            </div>
          </div>
        </div>
      </div>
    );
  },
);

FlyerPoster.displayName = "FlyerPoster";
