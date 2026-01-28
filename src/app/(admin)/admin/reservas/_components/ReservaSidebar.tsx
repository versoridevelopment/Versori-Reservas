// components/ReservaSidebar.tsx
"use client";

import {
  X,
  Calendar,
  User,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  MessageCircle,
  DollarSign,
  Clock,
  Copy,
  AlertCircle,
  Loader2,
} from "lucide-react";

// Ajustá esta importación a la ruta donde guardaste el hook
import { 
  useReservaSidebar, 
  formatMoney, 
  type ReservaSidebarProps 
} from "../_components/hooks/useReservaSidebar"; 

export default function ReservaSidebar(props: ReservaSidebarProps) {
  // 1. Extraemos TODO el estado y la lógica del hook
  const {
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
  } = useReservaSidebar(props);

  const { isOpen, onClose, isCreating, reserva, canchas } = props;

  if (!isOpen) return null;

  return (
    <>
      {/* OVERLAY */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* SIDEBAR CONTAINER */}
      <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col">
        
        {/* === HEADER === */}
        <div className="px-6 py-4 bg-white border-b border-gray-100 flex justify-between items-start sticky top-0 z-10">
          <div>
            {isCreating ? (
              <>
                <h2 className="text-xl font-bold text-gray-800">
                  Crear Turno {formData.horaInicio ? `${formData.horaInicio}hs` : ""}
                </h2>
                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {canchaDisplay}
                  </span>
                  <span className="flex items-center gap-1 capitalize">
                    <Calendar className="w-3.5 h-3.5" /> {fechaDisplay}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    Id: {reserva?.id_reserva}
                  </span>
                  <button className="text-gray-400 hover:text-gray-600" type="button">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h2 className="text-xl font-bold text-gray-800">Turno {reserva?.horaInicio} hs</h2>
                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                  <span>{canchaDisplay}</span>
                  <span className="capitalize">
                    {new Date(reserva?.fecha || "").toLocaleDateString("es-AR", {
                      weekday: "short",
                      day: "numeric",
                    })}
                  </span>
                  <LinkAction text="Modificar día/hora" />
                </div>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* === CONTENIDO SCROLLABLE === */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
          {isCreating ? (
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              
              {/* SECCIÓN JUGADOR */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-gray-800">Jugador</h3>

                {/* Nombre */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full pl-3 pr-10 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="Nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    />
                    <button
                      type="button"
                      className="absolute right-0 top-0 bottom-0 px-3 bg-green-600 rounded-r-lg text-white hover:bg-green-700"
                    >
                      <User className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-100 text-gray-500 text-sm">
                      🇦🇷 +54
                    </span>
                    <input
                      type="tel"
                      className="flex-1 pl-3 pr-10 py-2 bg-gray-50 border border-gray-300 rounded-r-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="11 2345-6789"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    />
                    <button
                      type="button"
                      className="absolute right-0 top-0 bottom-0 px-3 bg-green-600 rounded-r-lg text-white hover:bg-green-700"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Email (opcional)</label>
                  <div className="relative">
                    <input
                      type="email"
                      className="w-full pl-3 pr-10 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <div className="absolute right-0 top-0 bottom-0 px-3 flex items-center bg-green-600 rounded-r-lg text-white">
                      <Mail className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* SECCIÓN DATOS DEL TURNO */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-800">Características del Turno</h3>

                {/* Cancha */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Cancha</label>
                  <select
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"
                    value={formData.canchaId}
                    onChange={(e) => setFormData({ ...formData, canchaId: e.target.value })}
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
                  <label className="block text-xs font-bold text-gray-600 mb-1">Hora inicio</label>
                  <select
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none disabled:opacity-60"
                    value={formData.horaInicio}
                    onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
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
                    <p className="text-xs text-slate-500 mt-1">
                      Fin estimado: <span className="font-bold">{horaFinCalculada}</span>
                    </p>
                  )}
                  <p className="text-[11px] text-slate-500 mt-1">
                    Solo horarios libres. Además, se evita dejar 30’ sueltos en los bordes.
                  </p>
                </div>

                {/* Fijo Checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="fijo"
                    checked={formData.esTurnoFijo}
                    onChange={(e) => setFormData({ ...formData, esTurnoFijo: e.target.checked })}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <label htmlFor="fijo" className="text-sm text-gray-600">
                    Turno fijo
                  </label>
                </div>

                {/* Tipo de Turno */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">Tipo de turno</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Normal", "Profesor", "Torneo", "Escuela", "Cumpleaños", "Abonado"].map((tipo) => {
                      const v = tipo.toLowerCase().replace("ñ", "n");
                      return (
                        <button
                          key={tipo}
                          type="button"
                          onClick={() => setFormData({ ...formData, tipoTurno: v })}
                          className={`py-1.5 px-2 rounded-md text-xs font-medium border transition-all
                            ${
                              formData.tipoTurno === v
                                ? "bg-gray-200 border-gray-300 text-gray-800 shadow-inner"
                                : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
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
                  <label className="block text-xs font-bold text-gray-600 mb-1">Duración</label>
                  <select
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"
                    value={formData.duracion}
                    onChange={(e) => setFormData({ ...formData, duracion: Number(e.target.value) as any })}
                  >
                    <option value={60}>60 minutos</option>
                    <option value={90}>90 minutos</option>
                    <option value={120}>120 minutos</option>
                  </select>
                </div>

                {/* Precio */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Precio</label>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-bold text-gray-800">{formatMoney(formData.precio)}</div>
                    {priceLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                  </div>
                  {priceError && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> {priceError}
                    </div>
                  )}
                  <p className="mt-1 text-[11px] text-slate-500">
                    El precio se calcula automáticamente según el tarifario y reglas.
                  </p>
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Notas</label>
                  <textarea
                    rows={2}
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>

                {/* Error Global */}
                {createError && (
                  <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
                    {createError}
                  </div>
                )}
              </div>
            </form>
          ) : reserva ? (
            /* === VISTA DETALLE RESERVA === */
            <div className="space-y-6">
              <div className="relative">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-base font-semibold text-gray-800">Jugador</h3>
                  <button className="text-xs text-green-700 border border-green-700 px-2 py-0.5 rounded hover:bg-green-50">
                    Editar
                  </button>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{reserva.cliente_nombre}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{reserva.cliente_telefono}</span>
                  </div>
                  <a
                    href={getWhatsappLink(reserva.cliente_telefono)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-green-600 font-medium hover:underline cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Contactar por WhatsApp
                  </a>
                </div>
              </div>

              <hr className="border-gray-100" />

              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Historial</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <XCircle className="w-4 h-4 text-gray-400" /> No tiene deudas
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle2 className="w-4 h-4" /> No se presentó veces: 0
                  </div>
                  <p className="text-xs text-green-600 mt-2 hover:underline cursor-pointer">
                    Ver historial completo
                  </p>
                </div>
              </div>

              <hr className="border-gray-100" />

              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-3">Turno</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>
                      {reserva.horaInicio} - {reserva.horaFin}
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span>
                      Precio <span className="text-green-600 font-bold">{formatMoney(reserva.precio_total)}</span>
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span>
                      Pagado: <strong>{formatMoney(reserva.pagos_aprobados_total)}</strong> — Saldo:{" "}
                      <strong>{formatMoney(reserva.saldo_pendiente)}</strong>
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          ) : null}
        </div>

        {/* === FOOTER DE ACCIONES === */}
        <div className="p-4 bg-white border-t border-gray-200">
          {isCreating ? (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-full text-sm font-bold hover:bg-gray-50"
                disabled={createLoading}
              >
                Cerrar
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 py-2.5 bg-green-500 text-white rounded-full text-sm font-bold hover:bg-green-600 shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
                disabled={
                  createLoading ||
                  priceLoading ||
                  !formData.precio ||
                  !formData.horaInicio ||
                  availableTimes.length === 0
                }
              >
                {createLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Crear
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button className="py-2.5 bg-pink-600 text-white rounded-full text-sm font-bold hover:bg-pink-700">
                Reportar
              </button>

              <button
                onClick={handleCancelar}
                className="py-2.5 bg-pink-600 text-white rounded-full text-sm font-bold hover:bg-pink-700 disabled:opacity-60"
                disabled={!reserva}
              >
                Cancelar
              </button>

              <button
                onClick={openCobro}
                className="col-span-2 py-2.5 bg-green-500 text-white rounded-full text-sm font-bold hover:bg-green-600 shadow-lg disabled:opacity-60"
                disabled={!reserva}
              >
                Cobrar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* === MODAL DE COBRO === */}
      {showCobro && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-100">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-black text-slate-800">Cobrar</div>
              <button className="p-2 rounded-lg hover:bg-gray-100" onClick={() => setShowCobro(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="text-sm text-slate-600">
                {reserva ? (
                  <>
                    Reserva #{reserva.id_reserva} — Saldo: <strong>{formatMoney(reserva.saldo_pendiente)}</strong>
                  </>
                ) : (
                  <>Seleccioná una reserva</>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Monto</label>
                <input
                  type="number"
                  className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"
                  value={cobroMonto}
                  onChange={(e) => setCobroMonto(Number(e.target.value))}
                  min={0}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Método</label>
                <select
                  className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"
                  value={cobroMetodo}
                  onChange={(e) => setCobroMetodo(e.target.value as any)}
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Nota (opcional)</label>
                <input
                  type="text"
                  className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none"
                  value={cobroNota}
                  onChange={(e) => setCobroNota(e.target.value)}
                  placeholder="Ej: Pagó en caja"
                />
              </div>

              {cobroError && (
                <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
                  {cobroError}
                </div>
              )}
            </div>

            <div className="p-4 border-t flex gap-3">
              <button
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-full text-sm font-bold hover:bg-gray-50"
                onClick={() => setShowCobro(false)}
                disabled={cobroLoading}
              >
                Cerrar
              </button>
              <button
                className="flex-1 py-2.5 bg-green-500 text-white rounded-full text-sm font-bold hover:bg-green-600 shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
                onClick={handleCobrar}
                disabled={cobroLoading || !reserva}
              >
                {cobroLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar cobro
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helper UI Component
const LinkAction = ({ text }: { text: string }) => (
  <span className="text-green-600 hover:underline cursor-pointer text-xs font-medium">{text}</span>
);