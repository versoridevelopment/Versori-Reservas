"use client";

import { CanchaUI, ReservaUI, THEME_COLORS } from "./types";

interface Props {
  canchas: CanchaUI[];
  reservas: ReservaUI[];
  startHour: number;
  endHour: number;
  date: Date; // ✅ RECIBIMOS LA FECHA BASE
  onReservaClick: (r: ReservaUI) => void;
  // ✅ AHORA DEVUELVE TAMBIÉN LA FECHA CALCULADA (YYYY-MM-DD)
  onEmptySlotClick: (canchaId: number, timeStr: string, dateStr: string) => void;
}

const PIXELS_PER_HOUR = 140;
const GRID_TOP_OFFSET = 30;

// Helper para sumar días y formatear localmente sin líos de UTC
function getTargetDateISO(baseDate: Date, extraDays: number) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + extraDays);

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ---- Tipo turno helpers (UI) ----
function normalizeTipoTurno(tipo?: string | null) {
  return String(tipo || "normal")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");
}

function prettyTipoTurno(tipo?: string | null) {
  const t = normalizeTipoTurno(tipo);

  switch (t) {
    case "normal":
      return "Normal";
    case "profesor":
      return "Profesor";
    case "torneo":
      return "Torneo";
    case "escuela":
      return "Escuela";
    case "cumpleanos":
    case "cumpleaños":
      return "Cumpleaños";
    case "abonado":
      return "Abonado";
    default:
      // fallback: capitalize + reemplaza "_" por espacio
      return t
        .replace(/_/g, " ")
        .replace(/^./, (c) => c.toUpperCase());
  }
}

function tipoTurnoBadgeClass(tipo?: string | null) {
  const t = normalizeTipoTurno(tipo);

  switch (t) {
    case "profesor":
      return "bg-indigo-600 text-white";
    case "torneo":
      return "bg-fuchsia-600 text-white";
    case "escuela":
      return "bg-cyan-700 text-white";
    case "cumpleanos":
    case "cumpleaños":
      return "bg-amber-500 text-white";
    case "abonado":
      return "bg-slate-900 text-white";
    default:
      return "bg-slate-200 text-slate-800";
  }
}

export default function CompactView({
  canchas,
  reservas,
  startHour,
  endHour,
  date,
  onReservaClick,
  onEmptySlotClick,
}: Props) {
  const timeSlots: number[] = [];
  for (let i = startHour; i <= endHour; i += 0.5) timeSlots.push(i);

  const timeStringToDecimal = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    let decimal = h + m / 60;
    if (decimal < startHour) decimal += 24;
    return decimal;
  };

  const getTopPosition = (startStr: string) => {
    const hours = timeStringToDecimal(startStr);
    return (hours - startHour) * PIXELS_PER_HOUR + GRID_TOP_OFFSET;
  };

  const getHeight = (startStr: string, endStr: string) => {
    const startDec = timeStringToDecimal(startStr);
    const endDec = timeStringToDecimal(endStr);
    return (endDec - startDec) * PIXELS_PER_HOUR;
  };

  const formatHourLabel = (val: number) => {
    let h = Math.floor(val);
    const m = val % 1 === 0.5 ? "30" : "00";
    if (h >= 24) h -= 24; // Convertimos 24->00, 25->01
    return `${h.toString().padStart(2, "0")}:${m}`;
  };

  const totalHeight =
    (endHour - startHour) * PIXELS_PER_HOUR + GRID_TOP_OFFSET + 50;

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden select-none">
      <div className="flex-1 overflow-auto relative custom-scrollbar">
        <div className="flex min-w-max" style={{ height: totalHeight }}>
          {/* COLUMNA HORAS */}
          <div className="w-14 sticky left-0 z-30 bg-white border-r border-gray-200 flex-shrink-0 shadow-[4px_0_10px_rgba(0,0,0,0.05)]">
            <div className="h-12 border-b border-gray-200 bg-gray-50 sticky top-0 z-40" />
            <div className="relative h-full bg-slate-50/50">
              {timeSlots.map((time) => {
                if (!Number.isInteger(time)) return null;
                return (
                  <div
                    key={time}
                    className="absolute w-full text-center -mt-3"
                    style={{
                      top: (time - startHour) * PIXELS_PER_HOUR + GRID_TOP_OFFSET,
                    }}
                  >
                    <span className="text-xs font-black text-slate-400 block">
                      {formatHourLabel(time)}
                    </span>
                    {/* Indicador visual de día siguiente si aplica */}
                    {time >= 24 && (
                      <span className="text-[9px] text-slate-300 block leading-none">
                        +1 día
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLUMNAS CANCHAS */}
          {canchas.map((cancha) => {
            const theme = THEME_COLORS[cancha.theme];

            return (
              <div
                key={cancha.id_cancha}
                className="flex-1 min-w-[160px] md:min-w-[200px] border-r border-gray-200 relative"
              >
                <div
                  className={`h-12 sticky top-0 z-20 flex items-center justify-center border-b border-gray-200 shadow-sm ${theme.header}`}
                >
                  <div className="text-center px-2">
                    <h3 className="text-xs md:text-sm font-black uppercase tracking-wide leading-none truncate w-full">
                      {cancha.nombre}
                    </h3>
                    <p className="text-[9px] opacity-80 font-medium mt-0.5">
                      {cancha.es_exterior ? "Exterior" : "Interior"}
                    </p>
                  </div>
                </div>

                <div className="relative w-full h-full bg-white">
                  {/* Slots Vacíos */}
                  {timeSlots.map((time) => {
                    if (time === endHour && !Number.isInteger(time)) return null;

                    // ✅ LÓGICA DE DÍA SIGUIENTE
                    // Si la hora visual es >= 24 (ej. 00:00, 01:00), es mañana.
                    const isNextDay = time >= 24;
                    const slotDateISO = getTargetDateISO(date, isNextDay ? 1 : 0);

                    return (
                      <div
                        key={time}
                        onClick={() =>
                          onEmptySlotClick(
                            cancha.id_cancha,
                            formatHourLabel(time),
                            slotDateISO,
                          )
                        }
                        className={`absolute w-full cursor-pointer hover:bg-slate-50 transition-colors ${
                          Number.isInteger(time)
                            ? "border-b border-gray-200"
                            : "border-b border-gray-100 border-dashed"
                        }`}
                        style={{
                          top: (time - startHour) * PIXELS_PER_HOUR + GRID_TOP_OFFSET,
                          height: PIXELS_PER_HOUR / 2,
                        }}
                      />
                    );
                  })}

                  {/* Reservas */}
                  {reservas
                    .filter((r) => r.id_cancha === cancha.id_cancha)
                    .map((reserva) => {
                      const tipoLabel = prettyTipoTurno(reserva.tipo_turno);

                      return (
                        <div
                          key={reserva.id_reserva}
                          onClick={(e) => {
                            e.stopPropagation();
                            onReservaClick(reserva);
                          }}
                          className={`absolute left-1 right-1 rounded-xl border-l-[6px] shadow-sm cursor-pointer
                            hover:shadow-lg hover:z-20 hover:scale-[1.02] transition-all p-2.5 flex flex-col justify-center
                            ${theme.bg} ${theme.border} bg-opacity-95 backdrop-blur-sm
                          `}
                          style={{
                            top: getTopPosition(reserva.horaInicio),
                            height: getHeight(reserva.horaInicio, reserva.horaFin) - 3,
                          }}
                        >
                          {/* Estado dot */}
                          <div
                            className={`absolute top-2.5 right-2.5 w-2 h-2 rounded-full ring-2 ring-white/60 ${
                              reserva.estado === "confirmada"
                                ? "bg-green-500"
                                : "bg-orange-400"
                            }`}
                            title={
                              reserva.estado === "confirmada"
                                ? "Confirmada"
                                : "Pendiente de pago"
                            }
                          />

                          {/* Tipo turno badge (arriba a la derecha) */}
                          <div className="absolute top-2.5 right-6 flex items-center gap-1">
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-sm ${tipoTurnoBadgeClass(
                                reserva.tipo_turno,
                              )}`}
                              title={`Tipo de turno: ${tipoLabel}`}
                            >
                              {tipoLabel}
                            </span>
                          </div>

                          {/* Horario */}
                          <div className="flex items-center justify-between gap-2 mb-0.5 pr-20">
                            <span className="text-[10px] font-bold opacity-70">
                              {reserva.horaInicio} - {reserva.horaFin}
                            </span>
                          </div>

                          {/* Cliente */}
                          <h4 className="font-bold text-xs md:text-sm text-slate-800 leading-tight truncate pr-2">
                            {reserva.cliente_nombre}
                          </h4>

                          {/* Footer */}
                          <div className="mt-1.5 flex justify-between items-end">
                            <span className="text-[10px] bg-white/70 px-1.5 py-0.5 rounded-md text-slate-800 font-extrabold tracking-tight shadow-sm">
                              $
                              {Number(reserva.precio_total || 0).toLocaleString(
                                "es-AR",
                              )}
                            </span>

                            {Number(reserva.saldo_pendiente || 0) > 0 && (
                              <span className="text-[8px] font-black text-white bg-red-500 px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
                                DEBE
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
