"use client";

import React, { useRef, useState } from "react";
import type { Cancha, ClubTheme } from "./lib/types";
import { isoTodayAR } from "./lib/color";

import { Controls } from "./components/Controls";
import { CanchasPicker } from "./components/CanchasPicker";
import { FlyerPoster } from "./components/FlyerPoster";

import { useSelectedCanchas } from "./hooks/useSelectedCanchas";
import { useTurnosDisponibles } from "./hooks/useTurnosDisponibles";
import { useFlyerTheme } from "./hooks/useFlyerTheme";
import { useDownloadPng } from "./hooks/useDownloadPng";

const MAX_COLS = 8;

export default function TurnosDisponiblesClient(props: {
  idClub: number;
  clubNombre: string;
  clubTheme: ClubTheme;
  phone: string;
  canchas: Cancha[];
}) {
  const { idClub, clubNombre, clubTheme, phone, canchas } = props;

  const [fecha, setFecha] = useState<string>(isoTodayAR());
  const [duracion, setDuracion] = useState<number>(60);

  const posterRef = useRef<HTMLDivElement | null>(null);

  const { selected, selectedCanchas, cols, disableAddMore, toggleCancha } =
    useSelectedCanchas(canchas, MAX_COLS);

  const { loading, data, error, generar } = useTurnosDisponibles({ idClub });

  const theme = useFlyerTheme(clubTheme);
  const downloadPng = useDownloadPng();

  const phoneFinal = (phone || "").trim() || "—";

  return (
    <div className="p-6 space-y-6">
      <Controls
        fecha={fecha}
        setFecha={setFecha}
        duracion={duracion}
        setDuracion={setDuracion}
        cols={cols}
        maxCols={MAX_COLS}
        loading={loading}
        onGenerar={() => generar({ fecha, duracion, selectedCanchas })}
        onDescargar={() =>
          downloadPng(
            posterRef.current,
            `turnos-${clubNombre}-${fecha}.png`.replaceAll(" ", "_"),
          )
        }
        canDownload={!!data}
        error={error}
      />

      <CanchasPicker
        canchas={canchas}
        selected={selected}
        disableAddMore={disableAddMore}
        maxCols={MAX_COLS}
        onToggle={toggleCancha}
      />

      <div className="flex gap-8 flex-wrap items-start">
        <div>
          <div className="font-semibold mb-2">Vista previa (exportable)</div>
          <FlyerPoster
            ref={posterRef}
            clubNombre={clubNombre}
            theme={{ logoUrl: theme.logoUrl, primary: theme.primary, secondary: theme.secondary }}
            dayTitle={data?.dayTitle ?? "DÍA"}
            canchas={selectedCanchas}
            slots={data?.slots ?? {}}
            cols={cols}
            phone={phoneFinal}
            secondaryText={theme.secondaryText}
          />
        </div>
      </div>
    </div>
  );
}
