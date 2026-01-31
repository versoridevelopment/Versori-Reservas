"use client";

import { useState } from "react";
import {
  User,
  Phone,
  Mail,
  AlertCircle,
  Loader2,
  CalendarDays,
  Check,
  RefreshCw,
} from "lucide-react";
import { formatMoney } from "../hooks/useReservaSidebar";
import type { CanchaUI } from "../types";
import ClientSearchInput from "./ClientSearchInput";

// --- FUNCIÓN HELPER (Fuera del componente) ---
const normalizePhone = (input: string) => {
  if (!input) return "";

  // 1. Dejar solo números
  let clean = input.replace(/\D/g, "");

  // 2. Quitar prefijos internacionales comunes de Argentina
  if (clean.startsWith("549")) {
    clean = clean.slice(3);
  } else if (clean.startsWith("54")) {
    clean = clean.slice(2);
  }

  // 3. Quitar el 0 del código de área (ej: 0379 -> 379)
  if (clean.startsWith("0")) {
    clean = clean.slice(1);
  }

  return clean;
};

// --- INTERFAZ PROPS ---
interface Props {
  formData: any;
  setFormData: (d: any) => void;
  canchas: CanchaUI[];
  availableTimes: { value: string; label: string; finLabel: string }[];
  horaFinCalculada: string;
  priceLoading: boolean;
  priceError: string | null;
  createError: string | null;
  idClub: number;
}

// --- COMPONENTE ---
export default function CreateReservaForm({
  formData,
  setFormData,
  canchas,
  availableTimes,
  horaFinCalculada,
  priceLoading,
  priceError,
  createError,
  idClub,
}: Props) {
  const [checking, setChecking] = useState(false);
  const [matchFound, setMatchFound] = useState<string | null>(null);

  const esFijo = !!formData.esTurnoFijo;

  const toggleFijo = (checked: boolean) => {
    setFormData((p: any) => ({
      ...p,
      esTurnoFijo: checked,
      weeksAhead:
        Number.isFinite(Number(p.weeksAhead)) && Number(p.weeksAhead) > 0
          ? Number(p.weeksAhead)
          : 8,
      endDate: p.endDate || "",
    }));
  };

  const handleClientSelect = (cliente: {
    nombre: string;
    telefono: string;
    email: string;
  }) => {
    // Al seleccionar del autocompletado, guardamos el teléfono limpio
    setFormData((prev: any) => ({
      ...prev,
      nombre: cliente.nombre,
      telefono: normalizePhone(cliente.telefono || prev.telefono),
      email: cliente.email || prev.email,
    }));
    setMatchFound(null);
  };

  // Validación inteligente al salir del campo
  const checkExistingUser = async (
    field: "nombre" | "telefono",
    value: string,
  ) => {
    if (!value || value.length < 3) return;

    // Normalizamos siempre antes de buscar
    const queryValue =
      field === "telefono" ? normalizePhone(value) : value.toLowerCase();

    if (field === "telefono" && queryValue.length < 4) return;

    setChecking(true);
    try {
      // Buscamos en la BD usando el valor limpio
      const res = await fetch(
        `/api/admin/clientes/search?q=${encodeURIComponent(queryValue)}&id_club=${idClub}&type=manual`,
      );
      const json = await res.json();

      const results = json.results || [];

      if (results.length > 0) {
        const match =
          results.find((r: any) => {
            if (field === "telefono") {
              // Comparamos peras con peras (ambos normalizados)
              return normalizePhone(r.telefono) === queryValue;
            }
            return r.nombre.toLowerCase().includes(queryValue);
          }) || results[0];

        if (match) {
          // Autocompletar NOMBRE si buscó por teléfono
          if (field === "telefono" && match.nombre) {
            setFormData((prev: any) => ({
              ...prev,
              nombre: match.nombre,
              email: match.email || prev.email,
              telefono: normalizePhone(match.telefono), // Aseguramos formato limpio
            }));
            setMatchFound(`Cliente encontrado: ${match.nombre}`);
          }

          // Autocompletar TELÉFONO si buscó por nombre
          if (field === "nombre" && match.telefono && !formData.telefono) {
            setFormData((prev: any) => ({
              ...prev,
              telefono: normalizePhone(match.telefono),
              email: match.email || prev.email,
            }));
            setMatchFound(`Datos cargados de: ${match.nombre}`);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChecking(false);
      setTimeout(() => setMatchFound(null), 3000);
    }
  };

  return (
    <form className="space-y-6 pb-20" onSubmit={(e) => e.preventDefault()}>
      {/* SECCIÓN JUGADOR */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4 relative">
        {checking && (
          <div className="absolute top-4 right-4 text-xs text-orange-500 flex items-center gap-1 font-medium animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" /> Verificando...
          </div>
        )}

        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400" /> Datos del Jugador
        </h3>

        <div className="space-y-3">
          {/* Buscador */}
          <ClientSearchInput
            idClub={idClub}
            initialValue={formData.nombre}
            onSelect={handleClientSelect}
          />

          {/* Teléfono */}
          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
              Teléfono <span className="text-orange-500">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => {
                  // Permitimos escribir caracteres pero limpiamos símbolos básicos
                  const val = e.target.value.replace(/[^0-9+\-\s]/g, "");
                  setFormData({ ...formData, telefono: val });
                }}
                onBlur={(e) => {
                  // AL SALIR DEL INPUT: Se limpia agresivamente y se valida
                  const finalClean = normalizePhone(e.target.value);
                  setFormData((prev: any) => ({
                    ...prev,
                    telefono: finalClean,
                  }));
                  checkExistingUser("telefono", finalClean);
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm font-mono"
                placeholder="Ej: 3794123456"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <Phone className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 ml-1">
              Se guardará solo el número (sin +54, 9, ni guiones).
            </p>
          </div>

          {/* Email */}
          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
              Email (Opcional)
            </label>
            <div className="relative">
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                placeholder="cliente@email.com"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <Mail className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Alerta de Coincidencia */}
        {matchFound && (
          <div className="flex items-center gap-2 p-3 bg-green-100 border border-green-200 rounded-lg text-xs font-bold text-green-800 animate-in fade-in slide-in-from-top-1 shadow-sm">
            <div className="bg-white p-1 rounded-full">
              <Check className="w-3 h-3 text-green-600" />
            </div>
            {matchFound}
          </div>
        )}
      </div>

      <hr className="border-gray-100" />

      {/* SECCIÓN DATOS DEL TURNO */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-800">
          Características del Turno
        </h3>

        {/* Cancha */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">
            Cancha
          </label>
          <select
            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={formData.canchaId}
            onChange={(e) =>
              setFormData({ ...formData, canchaId: e.target.value })
            }
          >
            <option value="">Seleccionar cancha</option>
            {canchas.map((c) => (
              <option key={c.id_cancha} value={String(c.id_cancha)}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Horarios */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">
            Hora inicio
          </label>
          <select
            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none disabled:opacity-60 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={formData.horaInicio}
            onChange={(e) =>
              setFormData({ ...formData, horaInicio: e.target.value })
            }
            disabled={!formData.canchaId || availableTimes.length === 0}
          >
            {!formData.canchaId && <option value="">Elegí una cancha</option>}
            {formData.canchaId && availableTimes.length === 0 && (
              <option value="">No hay horarios disponibles</option>
            )}
            {availableTimes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label} (fin {t.finLabel})
              </option>
            ))}
          </select>

          {horaFinCalculada && (
            <p className="text-xs text-slate-500 mt-1 pl-1">
              Fin estimado:{" "}
              <span className="font-bold text-slate-700">
                {horaFinCalculada}
              </span>
            </p>
          )}
        </div>

        {/* Turno fijo */}
        <div className="space-y-2 pt-1">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={esFijo}
              onChange={(e) => toggleFijo(e.target.checked)}
              className="w-4 h-4 text-green-600 rounded focus:ring-green-500 cursor-pointer"
            />
            Turno fijo (semanal)
          </label>

          {esFijo && (
            <div className="rounded-xl border border-green-200 bg-green-50/50 p-3 space-y-3 animate-in slide-in-from-top-2 fade-in duration-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-1">
                    Semanas a generar
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={52}
                    value={Number(formData.weeksAhead || 8)}
                    onChange={(e) =>
                      setFormData((p: any) => ({
                        ...p,
                        weeksAhead: Math.max(
                          1,
                          Math.min(52, Number(e.target.value || 8)),
                        ),
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                  />
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-1">
                    Hasta (opcional)
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.endDate || ""}
                      onChange={(e) =>
                        setFormData((p: any) => ({
                          ...p,
                          endDate: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white pr-9 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                    />
                    <CalendarDays className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-green-800 bg-green-100/50 p-2 rounded-lg border border-green-100">
                <span className="font-bold">Nota:</span> El precio se calculará
                individualmente.
              </div>
            </div>
          )}
        </div>

        {/* Tipo de Turno */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-2 ml-1">
            Tipo de turno
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              "Normal",
              "Profesor",
              "Torneo",
              "Escuela",
              "Cumpleaños",
              "Abonado",
            ].map((tipo) => {
              const v = tipo.toLowerCase().replace("ñ", "n");
              const isSelected = formData.tipoTurno === v;
              return (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setFormData({ ...formData, tipoTurno: v })}
                  className={`py-2 px-2 rounded-lg text-xs font-medium border transition-all active:scale-95
                    ${
                      isSelected
                        ? "bg-slate-800 border-slate-800 text-white shadow-md"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  {tipo}
                </button>
              );
            })}
          </div>
        </div>

        {/* Duración */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1 ml-1">
            Duración
          </label>
          <select
            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={formData.duracion}
            onChange={(e) =>
              setFormData({
                ...formData,
                duracion: Number(e.target.value) as any,
              })
            }
          >
            <option value={60}>60 minutos</option>
            <option value={90}>90 minutos</option>
            <option value={120}>120 minutos</option>
          </select>
        </div>

        {/* Precio */}
        <div
          className={`bg-slate-50 p-3 rounded-xl border border-slate-100 ${esFijo ? "opacity-70 grayscale" : ""}`}
        >
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
            Precio {esFijo ? "(Referencia)" : ""}
          </label>

          <div className="flex items-center gap-3">
            <div className="text-xl font-black text-slate-800 tracking-tight">
              {formatMoney(formData.precio)}
            </div>
            {!esFijo && priceLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            )}
          </div>

          {!esFijo && priceError && (
            <div className="mt-2 text-xs text-red-600 flex items-center gap-1.5 bg-red-50 p-2 rounded-lg border border-red-100">
              <AlertCircle className="w-3.5 h-3.5" /> {priceError}
            </div>
          )}
        </div>

        {/* Notas */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1 ml-1">
            Notas Internas
          </label>
          <textarea
            rows={3}
            value={formData.notas}
            onChange={(e) =>
              setFormData({ ...formData, notas: e.target.value })
            }
            className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
            placeholder="Detalles adicionales del turno..."
          />
        </div>

        {/* Error Global */}
        {createError && (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{createError}</span>
          </div>
        )}
      </div>
    </form>
  );
}
