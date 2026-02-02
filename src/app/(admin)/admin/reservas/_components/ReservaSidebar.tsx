"use client";

import { X, Calendar, Copy, Clock, Loader2, Printer } from "lucide-react";
import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { printReservaTicket } from "@/lib/printTicket"; // ✅ Importamos la función compartida
import {
  useReservaSidebar,
  type ReservaSidebarProps,
} from "./hooks/useReservaSidebar";

import CreateReservaForm from "./sidebar/CreateReservaForm";
import ReservaDetails from "./sidebar/ReservaDetails";
import CobroModal from "./sidebar/CobroModal";
import EditReservaMoveForm from "./sidebar/EditReservaMoveForm";

export default function ReservaSidebar(props: ReservaSidebarProps) {
  // 1. Instancia de Supabase para buscar datos del club
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    ),
  );

  const {
    formData,
    setFormData,
    reserva,
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
  } = useReservaSidebar(props);

  const { isOpen, onClose, isCreating, onCreated, idClub } = props;
  const [isEditingMove, setIsEditingMove] = useState(false);

  // 2. Estado para guardar info del club real
  const [clubData, setClubData] = useState<{
    nombre: string;
    direccion: string;
  }>({
    nombre: "",
    direccion: "",
  });

  // 3. Efecto para cargar datos del club al montar
  useEffect(() => {
    async function fetchClubInfo() {
      if (!idClub) return;

      try {
        const { data: club } = await supabase
          .from("clubes")
          .select("nombre")
          .eq("id_club", idClub)
          .single();

        const { data: contacto } = await supabase
          .from("contacto")
          .select("id_contacto")
          .eq("id_club", idClub)
          .single();

        let direccionStr = "";
        if (contacto) {
          const { data: dir } = await supabase
            .from("direccion")
            .select("calle, altura_calle, barrio, id_localidad(nombre)")
            .eq("id_contacto", contacto.id_contacto)
            .single();

          if (dir) {
            // @ts-ignore
            const loc = dir.id_localidad?.nombre || "";
            direccionStr = `${dir.calle || ""} ${dir.altura_calle || ""} ${dir.barrio ? `- ${dir.barrio}` : ""} ${loc ? `(${loc})` : ""}`;
          }
        }

        setClubData({
          nombre: club?.nombre || "Club Deportivo",
          direccion: direccionStr || "",
        });
      } catch (err) {
        console.error("Error cargando datos del club", err);
      }
    }

    if (isOpen) fetchClubInfo();
  }, [idClub, isOpen, supabase]);

  // Sincronización de datos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawTime = (props as any).inicio || (props as any).selectedStart || "";
  const incomingTime = rawTime.length > 5 ? rawTime.slice(0, 5) : rawTime;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const incomingCanchaId = (props as any).preSelectedCanchaId;

  useEffect(() => {
    if (isOpen && isCreating) {
      setFormData((prev) => {
        const timeChanged = incomingTime && prev.horaInicio !== incomingTime;
        const canchaChanged =
          incomingCanchaId && prev.canchaId !== incomingCanchaId.toString();

        if (timeChanged || canchaChanged) {
          return {
            ...prev,
            horaInicio: incomingTime || prev.horaInicio,
            canchaId: incomingCanchaId
              ? incomingCanchaId.toString()
              : prev.canchaId,
          };
        }
        return prev;
      });
    }
    if (!isOpen) setIsEditingMove(false);
  }, [isOpen, isCreating, incomingTime, incomingCanchaId, setFormData]);

  // --- FUNCIÓN DE IMPRESIÓN ---
  const handlePrintTicket = () => {
    if (!reserva) return;

    // Casteamos 'as any' para acceder a props que vienen del backend
    // aunque no estén en la interfaz estricta del frontend
    const r = reserva as any;

    printReservaTicket({
      id_reserva: reserva.id_reserva,
      club_nombre: clubData.nombre,
      club_direccion: clubData.direccion,
      cliente_nombre: r.cliente_nombre,
      cancha_nombre: canchaDisplay,
      fecha: reserva.fecha,
      inicio: reserva.horaInicio,
      fin: reserva.horaFin,
      fin_dia_offset: 0,
      precio_total: r.precio_total,
      pagado: r.pagos_aprobados_total,
      saldo: r.saldo_pendiente,
    });
  };

  if (!isOpen) return null;

  const inViewMode = !isCreating && !!reserva;
  const showEditForm = inViewMode && isEditingMove;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col">
        {/* HEADER */}
        <div className="px-6 py-4 bg-white border-b border-gray-100 flex justify-between items-start sticky top-0 z-10">
          <div>
            {isCreating ? (
              <>
                <h2 className="text-xl font-bold text-gray-800">
                  Crear Turno{" "}
                  {formData.horaInicio ? `${formData.horaInicio}hs` : ""}
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
                  <button
                    className="text-gray-400 hover:text-gray-600"
                    type="button"
                    title="Copiar ID"
                    onClick={() => {
                      if (reserva?.id_reserva)
                        navigator.clipboard.writeText(
                          String(reserva.id_reserva),
                        );
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  {isEditingMove
                    ? "Editar turno"
                    : `Turno ${reserva?.horaInicio} hs`}
                </h2>
                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                  <span>{canchaDisplay}</span>
                  <span className="capitalize">
                    {new Date(reserva?.fecha || "").toLocaleDateString(
                      "es-AR",
                      { weekday: "short", day: "numeric" },
                    )}
                  </span>
                </div>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
            title="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
          {isCreating ? (
            <CreateReservaForm
              idClub={idClub}
              formData={formData}
              setFormData={setFormData}
              canchas={props.canchas}
              availableTimes={availableTimes}
              manualDesdeOptions={manualDesdeOptions}
              manualHastaOptions={manualHastaOptions}
              duracionManualCalculada={duracionManualCalculada}
              horaFinCalculada={horaFinCalculada}
              priceLoading={priceLoading}
              priceError={priceError}
              createError={createError}
            />
          ) : reserva ? (
            showEditForm ? (
              <EditReservaMoveForm
                reserva={reserva}
                idClub={props.idClub}
                canchas={props.canchas}
                reservas={props.reservas || []}
                startHour={props.startHour ?? 8}
                endHour={props.endHour ?? 26}
                onCancel={() => setIsEditingMove(false)}
                onSaved={() => {
                  setIsEditingMove(false);
                  if (onCreated) onCreated();
                }}
              />
            ) : (
              <ReservaDetails
                reserva={reserva}
                getWhatsappLink={getWhatsappLink}
                onEdit={() => setIsEditingMove(true)}
              />
            )
          ) : null}
        </div>

        {/* FOOTER */}
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
                  !formData.horaInicio ||
                  (!formData.esTurnoFijo &&
                    (!formData.precioManual
                      ? priceLoading || !formData.precio
                      : !formData.precio || Number(formData.precio) <= 0))
                }
              >
                {createLoading && <Loader2 className="w-4 h-4 animate-spin" />}{" "}
                Crear
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePrintTicket}
                className="py-2.5 border border-gray-300 text-gray-700 rounded-full text-sm font-bold hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
                title="Generar Comprobante"
              >
                <Printer className="w-4 h-4" /> Ticket
              </button>
              <button
                onClick={handleCancelar}
                className="py-2.5 bg-pink-600 text-white rounded-full text-sm font-bold hover:bg-pink-700 disabled:opacity-60 transition-colors"
                disabled={!reserva}
              >
                Cancelar
              </button>
              <button
                onClick={openCobro}
                className="col-span-2 py-2.5 bg-green-500 text-white rounded-full text-sm font-bold hover:bg-green-600 shadow-lg disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                disabled={!reserva}
              >
                Cobrar
              </button>
            </div>
          )}
        </div>
      </div>

      <CobroModal
        isOpen={showCobro}
        onClose={() => setShowCobro(false)}
        reserva={reserva}
        monto={cobroMonto}
        setMonto={setCobroMonto}
        metodo={cobroMetodo}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setMetodo={setCobroMetodo as any}
        nota={cobroNota}
        setNota={setCobroNota}
        loading={cobroLoading}
        error={cobroError}
        onConfirm={handleCobrar}
      />
    </>
  );
}
