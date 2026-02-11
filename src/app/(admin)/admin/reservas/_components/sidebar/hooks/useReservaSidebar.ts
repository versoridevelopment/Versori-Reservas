"use client";

import { useEffect, useMemo, useState } from "react";

import {
  type ReservaSidebarProps,
  type Segmento,
  type FormDataState,
} from "../lib/types";

import { toISODateLocal } from "../lib/utils/date";
import { addMinutesHHMM, diffMinutesHHMM } from "../lib/utils/time";
import { normalizePhone } from "../lib/utils/phone";

import { cancelarReserva } from "../lib/api/reservas";
import { cobrarReserva } from "../lib/api/cobros";

import { useReservaFullLoader } from "./useReservaFullLoader";
import { useGrillaDisponibilidad } from "./useGrillaDisponibilidad";
import { usePrecioAutomatico } from "./usePrecioAutomatico";

export const formatMoney = (val: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(val || 0));

function isManualCliente() {
  return true;
}

const INITIAL_FORM: FormDataState = {
  idClienteManual: null,

  nombre: "",
  telefono: "",
  email: "",

  esTurnoFijo: false,
  tipoTurno: "normal",

  duracion: 90,
  horaInicio: "",

  precioManual: false,
  horaInicioManual: "",
  horaFinManual: "",

  precio: 0,
  notas: "",
  canchaId: "",

  weeksAhead: 8,
  endDate: "",
};

export function useReservaSidebar(props: ReservaSidebarProps) {
  const {
    isOpen,
    onClose,
    isCreating,
    selectedDate,
    fecha,
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

  const fechaISO = useMemo(
    () => toISODateLocal(fecha || selectedDate),
    [fecha, selectedDate],
  );

  // ---- Reserva full loader (view/edit)
  const { reservaFull, reloadFull } = useReservaFullLoader({
    isOpen,
    isCreating,
    reservaId,
    initialData,
  });

  // ---- Estados Cobro
  const [showCobro, setShowCobro] = useState(false);
  const [cobroMonto, setCobroMonto] = useState<number>(0);
  const [cobroMetodo, setCobroMetodo] = useState<string>("efectivo");
  const [cobroNota, setCobroNota] = useState<string>("Pagó en caja");
  const [cobroLoading, setCobroLoading] = useState(false);
  const [cobroError, setCobroError] = useState<string | null>(null);

  // ---- Form state
  const [formData, setFormData] = useState<FormDataState>(INITIAL_FORM);

  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // ---- Grilla disponibilidad
  const {
    availableTimes,
    manualDesdeOptions,
    manualHastaOptions,
    duracionManualCalculada,
  } = useGrillaDisponibilidad({
    isOpen,
    isCreating,
    reservas,
    canchas,
    canchaId: formData.canchaId,
    precioManual: formData.precioManual,
    duracion: formData.duracion,
    horaInicioManual: formData.horaInicioManual,
    horaFinManual: formData.horaFinManual,
    startHour,
    endHour,
  });

  // Si está en manual y cambia rango, sincroniza duración
  useEffect(() => {
    if (!isOpen || !isCreating) return;
    if (!formData.precioManual) return;
    if (!duracionManualCalculada) return;

    setFormData((p) =>
      p.duracion === duracionManualCalculada
        ? p
        : { ...p, duracion: duracionManualCalculada },
    );
  }, [isOpen, isCreating, formData.precioManual, duracionManualCalculada]);

  // ---- Sync abrir: cancha + hora
  useEffect(() => {
    if (!isOpen || !isCreating) return;

    const defaultCancha =
      preSelectedCanchaId?.toString() || (canchas[0]?.id_cancha?.toString() ?? "");

    let defaultHoraAuto = preSelectedTime || "";
    if (!defaultHoraAuto && availableTimes.length > 0)
      defaultHoraAuto = availableTimes[0].value;

    setFormData((prev) => {
      const canchaChanged = prev.canchaId !== defaultCancha;
      const horaAutoChanged = defaultHoraAuto && prev.horaInicio !== defaultHoraAuto;

      const needsManualDefaults =
        prev.precioManual &&
        (!prev.horaInicioManual || !prev.horaFinManual) &&
        (defaultHoraAuto || prev.horaInicio);

      if (!canchaChanged && !horaAutoChanged && !needsManualDefaults) return prev;

      const baseHora = defaultHoraAuto || prev.horaInicio;

      return {
        ...prev,
        canchaId: defaultCancha,
        horaInicio: horaAutoChanged ? defaultHoraAuto : prev.horaInicio,
        ...(needsManualDefaults
          ? {
              horaInicioManual: baseHora,
              horaFinManual: addMinutesHHMM(baseHora, Number(prev.duracion || 90)),
            }
          : {}),
        precio: 0,
      };
    });

    setPriceError(null);
    setCreateError(null);
  }, [isOpen, isCreating, preSelectedCanchaId, preSelectedTime, canchas, availableTimes]);

  // ---- ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // ---- Display helpers
  const canchaDisplay = useMemo(() => {
    const cid = isCreating ? Number(formData.canchaId) : reservaFull?.id_cancha;
    return canchas.find((x) => x.id_cancha === cid)?.nombre || "Cancha";
  }, [isCreating, canchas, formData.canchaId, reservaFull]);

  const fechaDisplay = useMemo(() => {
    return new Date(fechaISO + "T12:00:00").toLocaleDateString("es-AR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });
  }, [fechaISO]);

  const horaFinCalculada = useMemo(() => {
    if (formData.precioManual) return formData.horaFinManual || "";
    if (!formData.horaInicio) return "";
    return addMinutesHHMM(formData.horaInicio, Number(formData.duracion || 0));
  }, [formData.precioManual, formData.horaInicio, formData.horaFinManual, formData.duracion]);

  // ---- Precio automático (hook dedicado)
  usePrecioAutomatico({
    isOpen,
    isCreating,
    idClub,
    fechaISO,
    id_cancha: Number(formData.canchaId),
    inicio: formData.horaInicio,
    duracion: Number(formData.duracion),
    precioManual: !!formData.precioManual,
    tipoTurno: formData.tipoTurno,
    setPrecio: (precio) => setFormData((p) => ({ ...p, precio })),
    setPriceLoading,
    setPriceError,
  });

  // ---- Acciones
  const getWhatsappLink = (phone: string) =>
    `https://wa.me/${String(phone || "").replace(/\D/g, "")}`;

  async function handleCreate() {
    setCreateError(null);

    const id_cancha = Number(formData.canchaId);
    const precioManual = !!formData.precioManual;

    const inicio = precioManual ? formData.horaInicioManual : formData.horaInicio;

    let fin = "";
    let dur = 0;
    let precioNum = 0;

    if (precioManual) {
      if (!inicio) return setCreateError("Falta horario desde");
      if (!formData.horaFinManual) return setCreateError("Falta horario hasta");

      fin = formData.horaFinManual;
      dur = diffMinutesHHMM(inicio, fin);

      if (!Number.isFinite(dur) || dur <= 0 || dur % 30 !== 0) {
        return setCreateError("Rango horario inválido (múltiplos de 30)");
      }

      precioNum = Number(formData.precio);
      if (!Number.isFinite(precioNum) || precioNum < 0) {
        return setCreateError("Precio manual inválido");
      }
    } else {
      if (!inicio) return setCreateError("Falta horario");
      dur = Number(formData.duracion);
      if (!Number.isFinite(dur) || dur <= 0 || dur % 30 !== 0) {
        return setCreateError("Duración inválida (múltiplos de 30)");
      }
      fin = addMinutesHHMM(inicio, dur);
    }

    const nombre = formData.nombre.trim();
    const telefonoRaw = formData.telefono.trim();
    const telefonoNorm = normalizePhone(telefonoRaw);
    const email = formData.email.trim();

    if (!id_cancha) return setCreateError("Falta cancha");

    if (!formData.idClienteManual) {
      if (!nombre) return setCreateError("Nombre requerido");
      if (isManualCliente()) {
        if (!telefonoNorm) return setCreateError("Teléfono requerido");
        if (telefonoNorm.length < 6) return setCreateError("Teléfono inválido");
      }
    }

    setCreateLoading(true);

    try {
      const url = formData.esTurnoFijo ? "/api/admin/turnos-fijos" : "/api/admin/reservas";

      const payload: any = {
        id_club: idClub,
        id_cancha,
        fecha: fechaISO,
        inicio,
        fin,
        duracion_min: dur,

        tipo_turno: formData.tipoTurno,
        notas: formData.notas.trim() || null,

        id_cliente_manual: formData.idClienteManual ?? null,

        cliente_nombre: nombre || null,
        cliente_telefono: telefonoRaw || null,
        cliente_email: email ? email : null,

        precio_manual: precioManual,
        precio_total_manual: precioManual ? precioNum : null,
      };

      if (formData.esTurnoFijo) {
        payload.weeks_ahead = Number(formData.weeksAhead || 8);
        payload.start_date = fechaISO;
        payload.end_date = formData.endDate ? String(formData.endDate) : null;
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = String(json?.error || "");
        if (msg.includes("TEL_REQUERIDO")) throw new Error("Teléfono requerido");
        if (msg.includes("duplicate") || msg.includes("UNIQUE"))
          throw new Error("Ya existe un cliente con ese teléfono");
        throw new Error(msg || "Error creando");
      }

      onCreated?.();
      onClose();

      setFormData((prev) => ({
        ...prev,
        idClienteManual: null,
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

  async function handleCancelar(motivo?: string | null) {
    if (!reservaFull) return;
    const estado = (reservaFull as any).estado;
    if (estado === "cancelada") return;

    try {
      await cancelarReserva(reservaFull.id_reserva, motivo || null);
      onCreated?.();
      await reloadFull();
    } catch (e: any) {
      alert(e?.message || "Error al cancelar");
    }
  }

  function openCobro() {
    if (!reservaFull) return;
    const deuda = Number((reservaFull as any).saldo_pendiente || 0);
    setCobroMonto(deuda > 0 ? deuda : 0);
    setShowCobro(true);
  }

  async function handleCobrar() {
    if (!reservaFull) return;
    setCobroLoading(true);

    try {
      await cobrarReserva({
        id_reserva: reservaFull.id_reserva,
        amount: cobroMonto,
        currency: "ARS",
        provider: cobroMetodo,
        status: "approved",
        note: cobroNota,
      });

      onCreated?.();
      setShowCobro(false);
      await reloadFull();
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
    manualDesdeOptions,
    manualHastaOptions,
    duracionManualCalculada,

    canchaDisplay,
    fechaDisplay,
    horaFinCalculada,

    handleCreate,
    handleCancelar,
    openCobro,
    handleCobrar,
    getWhatsappLink,

    reloadFull,
  };
}
