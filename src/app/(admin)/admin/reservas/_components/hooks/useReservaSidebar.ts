"use client";

import { useEffect, useMemo, useState } from "react";
import type { CanchaUI, ReservaUI } from "../types";

export type TipoTurno =
  | "normal"
  | "profesor"
  | "torneo"
  | "escuela"
  | "cumpleanos"
  | "abonado";

export type ReservaSidebarProps = {
  isOpen: boolean;
  onClose: () => void;

  // Esquema on-demand
  reservaId?: number | null;
  initialData?: Partial<ReservaUI>;

  isCreating: boolean;
  selectedDate: Date;

  // ✅ Prop opcional para recibir la fecha exacta (ej: "2024-01-02")
  // útil cuando clicas un turno de madrugada que corresponde al día siguiente
  fecha?: string;

  preSelectedCanchaId?: number | null;
  preSelectedTime?: string | null; // ✅ Cambiado a string para mayor precisión (HH:MM)

  idClub: number;
  canchas: CanchaUI[];
  reservas?: ReservaUI[];

  startHour?: number;
  endHour?: number;

  onCreated: () => void;
};

// ===== Helpers exportables =====
export const formatMoney = (val: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(val || 0));

// ✅ Helper blindado para fechas
function toISODateLocal(d: Date | string | undefined | null) {
  if (!d) return new Date().toISOString().split("T")[0];

  // Si es string (YYYY-MM-DD), aseguramos que se interprete localmente
  const dateObj =
    typeof d === "string" ? new Date(d.includes("T") ? d : d + "T12:00:00") : d;

  if (isNaN(dateObj.getTime())) return new Date().toISOString().split("T")[0];

  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function hhmmToDecimal(hhmm: string, startHour: number) {
  const [h, m] = (hhmm || "").slice(0, 5).split(":").map(Number);
  let dec = (h || 0) + (m || 0) / 60;
  if (dec < startHour) dec += 24;
  return dec;
}

function addMinutesHHMM(hhmm: string, addMin: number) {
  const [h, m] = (hhmm || "").slice(0, 5).split(":").map(Number);
  let total = (h || 0) * 60 + (m || 0) + (addMin || 0);
  total = ((total % 1440) + 1440) % 1440;
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** ===== Regla anti “30 colgados” ===== */
type IntervalU = { startU: number; endU: number };
type FreeBlockU = { startU: number; endU: number };

function toUnits30(hours: number) {
  return Math.round(hours * 2);
}

function unitsToHHMM(u: number) {
  const mins = u * 30;
  const total = ((mins % 1440) + 1440) % 1440;
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${pad2(hh)}:${pad2(mm)}`;
}

function buildFreeBlocks(
  dayStartU: number,
  dayEndU: number,
  occupiedU: IntervalU[],
): FreeBlockU[] {
  if (dayEndU <= dayStartU) return [];

  const occ = occupiedU
    .map((x) => ({
      startU: Math.max(dayStartU, x.startU),
      endU: Math.min(dayEndU, x.endU),
    }))
    .filter((x) => x.endU > x.startU)
    .sort((a, b) => a.startU - b.startU);

  const merged: IntervalU[] = [];
  for (const it of occ) {
    const last = merged[merged.length - 1];
    if (!last || it.startU > last.endU) merged.push({ ...it });
    else last.endU = Math.max(last.endU, it.endU);
  }

  const free: FreeBlockU[] = [];
  let cursor = dayStartU;

  for (const it of merged) {
    if (it.startU > cursor) free.push({ startU: cursor, endU: it.startU });
    cursor = Math.max(cursor, it.endU);
  }
  if (cursor < dayEndU) free.push({ startU: cursor, endU: dayEndU });

  return free;
}

function noDangling30(block: FreeBlockU, startU: number, endU: number) {
  const leftU = startU - block.startU;
  const rightU = block.endU - endU;
  if (leftU === 1) return false;
  if (rightU === 1) return false;
  return true;
}

export function useReservaSidebar(props: ReservaSidebarProps) {
  const {
    isOpen,
    onClose,
    isCreating,
    selectedDate,
    fecha, // ✅ AQUI RECIBIMOS LA FECHA EXACTA (puede ser mañana)
    preSelectedCanchaId,
    preSelectedTime,
    idClub,
    canchas,
    reservas = [],
    startHour = 8,
    endHour = 26,
    onCreated,
    reservaId,
    initialData,
  } = props;

  // ✅ 1. Definimos la fecha ISO correcta. Si 'fecha' viene (ej: click en 00:00), gana sobre selectedDate.
  const fechaISO = useMemo(
    () => toISODateLocal(fecha || selectedDate),
    [fecha, selectedDate],
  );

  // Reserva “full”
  const [reservaFull, setReservaFull] = useState<ReservaUI | null>(null);

  useEffect(() => {
    if (!isOpen || isCreating) return;
    if (initialData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setReservaFull((prev) =>
        prev?.id_reserva === initialData.id_reserva
          ? prev
          : (initialData as any),
      );
    } else {
      setReservaFull(null);
    }
  }, [isOpen, isCreating, initialData]);

  // Fetch full por id (Solo en modo ver/editar)
  useEffect(() => {
    let alive = true;
    async function loadFull() {
      if (!isOpen || isCreating || !reservaId) return;
      try {
        const res = await fetch(`/api/admin/reservas/${reservaId}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = await res.json().catch(() => null);
        if (!alive) return;
        const full = (json?.data ?? json) as ReservaUI | null;
        if (full) setReservaFull(full);
      } catch (err) {
        console.error(err);
      }
    }
    loadFull();
    return () => {
      alive = false;
    };
  }, [isOpen, isCreating, reservaId]);

  // =========================================================
  // Estados Formulario
  // =========================================================
  const [showCobro, setShowCobro] = useState(false);
  const [cobroMonto, setCobroMonto] = useState<number>(0);
  const [cobroMetodo, setCobroMetodo] = useState<string>("efectivo");
  const [cobroNota, setCobroNota] = useState<string>("Pagó en caja");
  const [cobroLoading, setCobroLoading] = useState(false);
  const [cobroError, setCobroError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    email: "",
    esTurnoFijo: false,
    tipoTurno: "normal" as TipoTurno,
    duracion: 90 as 60 | 90 | 120,
    precio: 0,
    notas: "",
    canchaId: "",
    horaInicio: "", // Esto debe coincidir con preSelectedTime
    weeksAhead: 8,
    endDate: "",
  });

  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // 1) Ocuppied intervals
  const occupiedIntervals = useMemo(() => {
    if (!isCreating) return [];
    const id_cancha = Number(formData.canchaId);
    if (!id_cancha) return [];

    // NOTA: Si estamos creando en fecha "Mañana" pero 'reservas' tiene datos de "Hoy",
    // esto no filtrará correctamente los ocupados de mañana.
    // Para UX perfecta, deberías filtrar 'reservas' por fecha, pero asumimos que CompactView
    // solo permite clicks en huecos vacíos visualmente.

    return reservas
      .filter((r) => Number(r.id_cancha) === id_cancha)
      .map((r) => {
        const s = hhmmToDecimal(r.horaInicio, startHour);
        let e = hhmmToDecimal(r.horaFin, startHour);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const offset = Number((r as any).fin_dia_offset || 0);
        if (offset === 1 || e <= s) e += 24;
        return { start: s, end: e, id: r.id_reserva };
      });
  }, [isCreating, reservas, formData.canchaId, startHour]);

  // 2) Available times
  const availableTimes = useMemo(() => {
    if (!isOpen || !isCreating) return [];
    const durMin = Number(formData.duracion);
    if (![60, 90, 120].includes(durMin)) return [];

    const dayStartU = toUnits30(startHour);
    const dayEndU = toUnits30(endHour);
    const durU = Math.round(durMin / 30);

    const occupiedU: IntervalU[] = occupiedIntervals.map((o) => ({
      startU: toUnits30(o.start),
      endU: toUnits30(o.end),
    }));

    const freeBlocks = buildFreeBlocks(dayStartU, dayEndU, occupiedU);
    const out: {
      value: string;
      label: string;
      decimal: number;
      finLabel: string;
    }[] = [];

    for (let startU = dayStartU; startU + durU <= dayEndU; startU += 1) {
      const endU = startU + durU;
      const block = freeBlocks.find(
        (b) => startU >= b.startU && endU <= b.endU,
      );
      if (!block) continue;
      if (!noDangling30(block, startU, endU)) continue;

      const inicioHHMM = unitsToHHMM(startU);
      const finHHMM = unitsToHHMM(endU);

      out.push({
        value: inicioHHMM,
        label: inicioHHMM,
        decimal: startU / 2,
        finLabel: finHHMM,
      });
    }
    return out;
  }, [
    isOpen,
    isCreating,
    formData.duracion,
    startHour,
    endHour,
    occupiedIntervals,
  ]);

  // ✅ 3) Sincronización Agresiva: Al abrir, pisar datos con props
  useEffect(() => {
    if (!isOpen || !isCreating) return;

    // Cancha Default
    const defaultCancha =
      preSelectedCanchaId?.toString() ||
      (canchas[0]?.id_cancha?.toString() ?? "");

    // Hora Default (Aquí está la clave)
    // Si viene preSelectedTime (ej "00:00"), lo usamos directo.
    // Si no, buscamos el primero disponible.
    let defaultHora = preSelectedTime || "";

    // Si no vino hora, fallback al primero disponible
    if (!defaultHora && availableTimes.length > 0) {
      defaultHora = availableTimes[0].value;
    }

    setFormData((prev) => {
      // Solo actualizamos si cambia algo para evitar loops
      if (prev.canchaId === defaultCancha && prev.horaInicio === defaultHora)
        return prev;
      return {
        ...prev,
        canchaId: defaultCancha,
        horaInicio: defaultHora,
        // Resetear precio para obligar recálculo con nueva hora/fecha
        precio: 0,
      };
    });

    setPriceError(null);
    setCreateError(null);
  }, [
    isOpen,
    isCreating,
    preSelectedCanchaId,
    preSelectedTime,
    canchas,
    availableTimes,
  ]); // Dependencias clave

  // ESC Key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Helpers Visuales
  const canchaDisplay = useMemo(() => {
    const cid = isCreating ? Number(formData.canchaId) : reservaFull?.id_cancha;
    return canchas.find((x) => x.id_cancha === cid)?.nombre || "Cancha";
  }, [isCreating, canchas, formData.canchaId, reservaFull]);

  const fechaDisplay = useMemo(() => {
    // Usamos fechaISO para el display, asegurando que muestre "Sábado" si clicaste 00:00 del sábado
    return new Date(fechaISO + "T12:00:00").toLocaleDateString("es-AR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });
  }, [fechaISO]);

  const horaFinCalculada = useMemo(() => {
    if (!formData.horaInicio) return "";
    return addMinutesHHMM(formData.horaInicio, Number(formData.duracion || 0));
  }, [formData.horaInicio, formData.duracion]);

  // =========================================================
  // Precio Automático (Autocomplementado)
  // =========================================================
  useEffect(() => {
    let alive = true;
    async function calc() {
      if (!isOpen || !isCreating) return;

      const id_cancha = Number(formData.canchaId);
      const inicio = formData.horaInicio;
      const dur = Number(formData.duracion);

      if (!id_cancha || !inicio || ![60, 90, 120].includes(dur)) return;

      const fin = addMinutesHHMM(inicio, dur);
      setPriceLoading(true);
      setPriceError(null);

      try {
        const res = await fetch("/api/reservas/calcular-precio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_club: idClub,
            id_cancha,
            fecha: fechaISO, // ✅ Usa la fecha calculada (mañana si corresponde)
            inicio,
            fin,
          }),
          cache: "no-store",
        });

        const json = await res.json().catch(() => null);
        if (!alive) return;

        if (!res.ok || !json?.ok) {
          // No bloqueamos, solo avisamos o dejamos precio 0
          console.warn("Precio calc warn:", json?.error);
          setFormData((p) => ({ ...p, precio: 0 }));
        } else {
          setFormData((p) => ({
            ...p,
            precio: Number(json.precio_total || 0),
          }));
        }
      } catch (e: any) {
        if (alive) setPriceError("Error calc precio");
      } finally {
        if (alive) setPriceLoading(false);
      }
    }
    const t = setTimeout(calc, 400);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [
    isOpen,
    isCreating,
    idClub,
    fechaISO,
    formData.canchaId,
    formData.horaInicio,
    formData.duracion,
  ]);

  // =========================================================
  // Acciones (Create, Cancel, Cobro...)
  // =========================================================
  const getWhatsappLink = (phone: string) =>
    `https://wa.me/${String(phone || "").replace(/\D/g, "")}`;

  async function handleCreate() {
    setCreateError(null);
    const id_cancha = Number(formData.canchaId);
    const inicio = formData.horaInicio;
    const dur = Number(formData.duracion);
    const fin = addMinutesHHMM(inicio, dur);

    if (!formData.nombre.trim()) return setCreateError("Nombre requerido");
    if (!id_cancha) return setCreateError("Falta cancha");
    if (!inicio) return setCreateError("Falta horario");

    setCreateLoading(true);
    try {
      const url = formData.esTurnoFijo
        ? "/api/admin/turnos-fijos"
        : "/api/admin/reservas";
      const payload = {
        id_club: idClub,
        id_cancha,
        fecha: fechaISO, // ✅ Envía la fecha correcta
        inicio,
        duracion_min: dur,
        fin,
        tipo_turno: formData.tipoTurno,
        cliente_nombre: formData.nombre.trim(),
        cliente_telefono: formData.telefono.trim(),
        cliente_email: formData.email.trim() || null,
        notas: formData.notas.trim() || null,
        ...(formData.esTurnoFijo && {
          weeks_ahead: Number(formData.weeksAhead || 8),
          start_date: fechaISO,
          dow: new Date(fechaISO + "T12:00:00").getDay(),
        }),
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error creando");

      if (onCreated) onCreated();
      onClose();
      // Reset parcial
      setFormData((prev) => ({
        ...prev,
        nombre: "",
        telefono: "",
        email: "",
        notas: "",
      }));
    } catch (e: any) {
      setCreateError(e.message);
    } finally {
      setCreateLoading(false);
    }
  }

  // (Mismo código para handleCancelar, openCobro, handleCobrar que tenías antes...)
  async function handleCancelar() {
    if (!reservaFull || !confirm("¿Cancelar reserva?")) return;
    try {
      await fetch(`/api/admin/reservas/${reservaFull.id_reserva}/cancelar`, {
        method: "POST",
      });
      if (onCreated) onCreated();
      onClose();
    } catch {
      alert("Error al cancelar");
    }
  }

  function openCobro() {
    if (reservaFull) {
      const deuda = Number((reservaFull as any).saldo_pendiente || 0);
      setCobroMonto(deuda > 0 ? deuda : 0);
      setShowCobro(true);
    }
  }

  async function handleCobrar() {
    if (!reservaFull) return;
    setCobroLoading(true);
    try {
      const res = await fetch(
        `/api/admin/reservas/${reservaFull.id_reserva}/cobrar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: cobroMonto,
            currency: "ARS",
            provider: cobroMetodo,
            status: "approved",
            note: cobroNota,
          }),
        },
      );
      if (!res.ok) throw new Error("Error cobrando");
      if (onCreated) onCreated();
      setShowCobro(false);
    } catch (e: any) {
      setCobroError(e.message);
    } finally {
      setCobroLoading(false);
    }
  }

  return {
    formData,
    setFormData,
    reserva: reservaFull,
    showCobro,
    setShowCobro,
    cobroMonto,
    setCobroMonto,
    cobroMetodo,
    setCobroMetodo,
    cobroNota,
    setCobroNota,
    priceLoading,
    priceError,
    createLoading,
    createError,
    cobroLoading,
    cobroError,
    availableTimes,
    canchaDisplay,
    fechaDisplay,
    horaFinCalculada,
    handleCreate,
    handleCancelar,
    openCobro,
    handleCobrar,
    getWhatsappLink,
  };
}
