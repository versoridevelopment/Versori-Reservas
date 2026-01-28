// hooks/useReservaSidebar.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import type { CanchaUI, ReservaUI } from "../types"; // Ajustá la ruta según tu estructura

// ==========================================
// 1. HELPER FUNCTIONS (Lógica pura)
// ==========================================

export const formatMoney = (val: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(val || 0));

function toISODateLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
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
  const [h, m] = hhmm.split(":").map(Number);
  let total = (h || 0) * 60 + (m || 0) + addMin;
  total = ((total % 1440) + 1440) % 1440;
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

// Lógica de "Unidades de 30 minutos"
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

function buildFreeBlocks(dayStartU: number, dayEndU: number, occupiedU: IntervalU[]): FreeBlockU[] {
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

// ==========================================
// 2. TYPES
// ==========================================

export interface ReservaSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  reserva: ReservaUI | null;
  isCreating: boolean;
  selectedDate: Date;
  preSelectedCanchaId?: number | null;
  preSelectedTime?: number | null;
  idClub: number;
  canchas: CanchaUI[];
  reservas?: ReservaUI[];
  startHour?: number;
  endHour?: number;
  onCreated: () => void;
}

// ==========================================
// 3. CUSTOM HOOK (La Lógica)
// ==========================================

export function useReservaSidebar({
  isOpen,
  onClose,
  reserva,
  isCreating,
  selectedDate,
  preSelectedCanchaId,
  preSelectedTime,
  idClub,
  canchas,
  reservas = [],
  startHour = 8,
  endHour = 26,
  onCreated,
}: ReservaSidebarProps) {
  
  const fechaISO = useMemo(() => toISODateLocal(selectedDate), [selectedDate]);

  // --- ESTADOS COBRO ---
  const [showCobro, setShowCobro] = useState(false);
  const [cobroMonto, setCobroMonto] = useState<number>(0);
  const [cobroMetodo, setCobroMetodo] = useState<"efectivo" | "transferencia">("efectivo");
  const [cobroNota, setCobroNota] = useState<string>("Pagó en caja");
  const [cobroLoading, setCobroLoading] = useState(false);
  const [cobroError, setCobroError] = useState<string | null>(null);

  // --- ESTADOS CREAR ---
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    email: "",
    esTurnoFijo: false,
    tipoTurno: "normal",
    duracion: 90 as 60 | 90 | 120,
    precio: 0,
    notas: "",
    canchaId: "",
    horaInicio: "",
  });

  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // 1) Intervalos ocupados
  const occupiedIntervals = useMemo(() => {
    if (!isCreating) return [];
    const id_cancha = Number(formData.canchaId);
    if (!id_cancha) return [];

    const relevant = reservas.filter((r) => Number(r.id_cancha) === id_cancha);

    return relevant
      .map((r) => {
        const s = hhmmToDecimal(r.horaInicio, startHour);
        let e = hhmmToDecimal(r.horaFin, startHour);
        const offset = Number((r as any).fin_dia_offset || 0);
        if (offset === 1 || e <= s) e += 24;
        return { start: s, end: e, id: r.id_reserva };
      })
      .filter((x) => Number.isFinite(x.start) && Number.isFinite(x.end));
  }, [isCreating, reservas, formData.canchaId, startHour]);

  // 2) Horarios disponibles + lógica anti-30-colgados
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
    const out: { value: string; label: string; decimal: number; finLabel: string }[] = [];

    for (let startU = dayStartU; startU + durU <= dayEndU; startU += 1) {
      const endU = startU + durU;
      const block = freeBlocks.find((b) => startU >= b.startU && endU <= b.endU);
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
  }, [isOpen, isCreating, formData.duracion, startHour, endHour, occupiedIntervals]);

  // 3) Preselección al abrir
  useEffect(() => {
    if (!isOpen || !isCreating) return;
    const defaultCancha = preSelectedCanchaId?.toString() || (canchas[0]?.id_cancha?.toString() ?? "");
    setFormData((prev) => ({
      ...prev,
      canchaId: defaultCancha,
      duracion: prev.duracion || 90,
    }));
    setPriceError(null);
    setCreateError(null);
  }, [isOpen, isCreating, preSelectedCanchaId, canchas]);

  // 4) Asegurar hora válida
  useEffect(() => {
    if (!isOpen || !isCreating) return;
    if (availableTimes.length === 0) {
      setFormData((prev) => ({ ...prev, horaInicio: "" }));
      return;
    }
    const stillValid = formData.horaInicio && availableTimes.some((t) => t.value === formData.horaInicio);
    if (stillValid) return;

    if (preSelectedTime != null) {
      const desired = preSelectedTime;
      const found = availableTimes.find((t) => t.decimal >= desired) || availableTimes[0];
      setFormData((prev) => ({ ...prev, horaInicio: found.value }));
      return;
    }
    setFormData((prev) => ({ ...prev, horaInicio: availableTimes[0].value }));
  }, [isOpen, isCreating, availableTimes, preSelectedTime, formData.horaInicio]);

  // 5) Manejo de tecla ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // 6) Calcular precio automático
  useEffect(() => {
    async function calc() {
      if (!isOpen || !isCreating) return;
      setPriceError(null);
      const id_cancha = Number(formData.canchaId);
      const inicio = formData.horaInicio;
      const dur = Number(formData.duracion);
      if (!id_cancha || !inicio || ![60, 90, 120].includes(dur)) return;

      const fin = addMinutesHHMM(inicio, dur);
      setPriceLoading(true);

      try {
        const res = await fetch("/api/reservas/calcular-precio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_club: idClub,
            id_cancha,
            fecha: fechaISO,
            inicio,
            fin,
          }),
          cache: "no-store",
        });

        const json = await res.json();
        if (!res.ok || !json?.ok) throw new Error(json?.error || "No se pudo calcular");
        setFormData((prev) => ({ ...prev, precio: Number(json.precio_total || 0) }));
      } catch (e: any) {
        setFormData((prev) => ({ ...prev, precio: 0 }));
        setPriceError(e?.message || "Error");
      } finally {
        setPriceLoading(false);
      }
    }
    calc();
  }, [isOpen, isCreating, idClub, fechaISO, formData.canchaId, formData.horaInicio, formData.duracion]);

  // --- HANDLERS ---

  const getWhatsappLink = (phone: string) =>
    `https://wa.me/${String(phone || "").replace(/\D/g, "")}`;

  async function handleCreate() {
    setCreateError(null);
    const id_cancha = Number(formData.canchaId);
    const inicio = formData.horaInicio;
    const dur = Number(formData.duracion);
    const fin = addMinutesHHMM(inicio, dur);

    if (!formData.nombre.trim()) return setCreateError("Nombre es requerido");
    if (!formData.telefono.trim()) return setCreateError("Teléfono es requerido");
    if (!id_cancha) return setCreateError("Seleccioná una cancha");
    if (!inicio) return setCreateError("Seleccioná un horario");
    if (![60, 90, 120].includes(dur)) return setCreateError("Duración inválida");
    if (!Number.isFinite(Number(formData.precio)) || Number(formData.precio) <= 0) {
      return setCreateError("No hay precio válido");
    }

    const stillAvailable = availableTimes.some((t) => t.value === inicio);
    if (!stillAvailable) return setCreateError("Ese horario ya no está disponible.");

    setCreateLoading(true);
    try {
      const res = await fetch("/api/admin/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_club: idClub,
          id_cancha,
          fecha: fechaISO,
          inicio,
          fin,
          duracion_min: dur,
          cliente_nombre: formData.nombre.trim(),
          cliente_telefono: formData.telefono.trim(),
          cliente_email: formData.email.trim() || null,
          tipo_turno: formData.tipoTurno,
          notas: formData.notas.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Falló creación");
      onCreated();
    } catch (e: any) {
      setCreateError(e?.message || "Error creando");
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleCancelar() {
    if (!reserva) return;
    if (!confirm("¿Cancelar esta reserva?")) return;
    try {
      const res = await fetch(`/api/admin/reservas/${reserva.id_reserva}/cancelar`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Falló cancelación");
      onCreated();
    } catch (e: any) {
      alert(e?.message);
    }
  }

  function openCobro() {
    if (!reserva) return;
    setCobroError(null);
    setCobroMetodo("efectivo");
    setCobroNota("Pagó en caja");
    const sugerido = Number(reserva.saldo_pendiente ?? 0) > 0 ? Number(reserva.saldo_pendiente) : 0;
    setCobroMonto(sugerido);
    setShowCobro(true);
  }

  async function handleCobrar() {
    if (!reserva) return;
    const amount = Number(cobroMonto || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      setCobroError("Monto inválido");
      return;
    }
    setCobroLoading(true);
    setCobroError(null);
    try {
      const res = await fetch(`/api/admin/reservas/${reserva.id_reserva}/cobrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency: "ARS",
          provider: cobroMetodo,
          status: "approved",
          note: cobroNota?.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Falló cobro");
      setShowCobro(false);
      onCreated();
    } catch (e: any) {
      setCobroError(e?.message);
    } finally {
      setCobroLoading(false);
    }
  }

  // Datos derivados para la vista
  const canchaDisplay = useMemo(() => {
    if (isCreating) {
      const c = canchas.find((x) => x.id_cancha === Number(formData.canchaId));
      return c?.nombre || "Sin Cancha";
    }
    return canchas.find((x) => x.id_cancha === reserva?.id_cancha)?.nombre || "Cancha";
  }, [isCreating, canchas, formData.canchaId, reserva?.id_cancha]);

  const fechaDisplay = selectedDate.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });

  const horaFinCalculada = useMemo(() => {
    if (!formData.horaInicio) return "";
    return addMinutesHHMM(formData.horaInicio, Number(formData.duracion || 0));
  }, [formData.horaInicio, formData.duracion]);

  return {
    // State
    formData,
    setFormData,
    showCobro,
    setShowCobro,
    cobroMonto,
    setCobroMonto,
    cobroMetodo,
    setCobroMetodo,
    cobroNota,
    setCobroNota,
    
    // Loading/Errors
    priceLoading,
    priceError,
    createLoading,
    createError,
    cobroLoading,
    cobroError,

    // Computed
    availableTimes,
    canchaDisplay,
    fechaDisplay,
    horaFinCalculada,

    // Actions
    handleCreate,
    handleCancelar,
    openCobro,
    handleCobrar,
    getWhatsappLink,
  };
}