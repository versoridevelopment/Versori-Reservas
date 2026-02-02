"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Calendar as CalendarIcon, RefreshCw } from "lucide-react";

import CompactView from "./_components/CompactView";
import DateSelector from "./_components/DateSelector";
import ReservaSidebar from "./_components/ReservaSidebar";
import type { AgendaApiResponse, ReservaUI } from "./_components/types";

function toISODateAR(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ReservasPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [agenda, setAgenda] = useState<AgendaApiResponse | null>(null);
  const [idClub, setIdClub] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sidebarState, setSidebarState] = useState<{
    isOpen: boolean;
    mode: "view" | "create";
    reservaId?: number | null;
    initialData?: Partial<ReservaUI>;
    preSelectedCanchaId?: number | null;
    preSelectedTime?: string | null;
    preSelectedDate?: string | null;
  }>({ isOpen: false, mode: "view" });

  const fechaISO = useMemo(() => toISODateAR(selectedDate), [selectedDate]);

  async function loadAgenda() {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/admin/agenda?fecha=${fechaISO}`;
      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json?.ok)
        throw new Error(json?.error || "Error cargando agenda");
      setAgenda(json);
      setIdClub(json.id_club);
    } catch (e: any) {
      setAgenda(null);
      setIdClub(null);
      setError(e?.message || "Error interno");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAgenda();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaISO]);

  const handleReservaClick = (r: ReservaUI) => {
    setSidebarState({
      isOpen: true,
      mode: "view",
      reservaId: r.id_reserva,
      initialData: r,
      preSelectedDate: r.fecha,
    });
  };

  const handleEmptySlotClick = (
    canchaId: number,
    timeStr: string,
    dateStr: string,
  ) => {
    setSidebarState({
      isOpen: true,
      mode: "create",
      reservaId: null,
      initialData: undefined,
      preSelectedCanchaId: canchaId,
      preSelectedTime: timeStr,
      preSelectedDate: dateStr,
    });
  };

  return (
    <div className="h-[100dvh] bg-slate-50/50 flex flex-col overflow-hidden font-sans">
      {/* --- HEADER MEJORADO --- */}
      {/* z-50 es clave para que el calendario tape a la grilla y no al revés */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 z-50 relative shadow-sm">
        {/* Título y Botón Móvil */}
        <div className="flex items-center justify-between w-full md:w-auto gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 p-2 rounded-lg text-slate-700">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">
                Agenda
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Gestión de Turnos
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              setSidebarState({
                isOpen: true,
                mode: "create",
                reservaId: null,
                preSelectedDate: fechaISO,
              })
            }
            className="md:hidden bg-slate-900 text-white p-2.5 rounded-xl active:bg-slate-700 transition-colors shadow-lg shadow-slate-900/10"
            aria-label="Nuevo Turno"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Fecha (Central) */}
        <div className="w-full md:w-auto flex justify-center">
          <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <DateSelector
              selectedDate={selectedDate}
              onChange={setSelectedDate}
            />
          </div>
        </div>

        {/* Acciones Escritorio */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => loadAgenda()}
            className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
            title="Recargar"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>

          <div className="h-8 w-px bg-slate-200 mx-1" />

          <button
            onClick={() =>
              setSidebarState({
                isOpen: true,
                mode: "create",
                reservaId: null,
                preSelectedDate: fechaISO,
              })
            }
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-slate-900/10 transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Nuevo Turno
          </button>
        </div>
      </header>

      {/* --- MAIN CONTENT (GRILLA) --- */}
      {/* z-0 para que quede debajo del header */}
      <main className="flex-1 relative overflow-hidden z-0">
        {loading && (
          <div className="absolute inset-0 z-20 bg-white/50 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white px-6 py-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-bold text-slate-700">
                Cargando agenda...
              </span>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="h-full grid place-items-center p-6">
            <div className="bg-white border border-red-100 rounded-2xl p-8 shadow-xl shadow-red-500/5 max-w-md w-full text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div className="font-bold text-slate-800 text-lg mb-2">
                No se pudo cargar la agenda
              </div>
              <div className="text-sm text-slate-500 mb-6">{error}</div>
              <button
                onClick={loadAgenda}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* GRILLA COMPACTA */}
        {/* Renderizamos siempre si hay data, aunque esté cargando (para evitar saltos visuales) */}
        {agenda && (
          <div
            className={`h-full transition-opacity duration-300 ${loading ? "opacity-50 pointer-events-none" : "opacity-100"}`}
          >
            <CompactView
              canchas={agenda.canchas}
              reservas={agenda.reservas || []} // ✅ Array seguro
              startHour={agenda.startHour}
              endHour={agenda.endHour}
              date={selectedDate}
              onReservaClick={handleReservaClick}
              onEmptySlotClick={handleEmptySlotClick}
            />
          </div>
        )}
      </main>

      <ReservaSidebar
        isOpen={sidebarState.isOpen}
        onClose={() => setSidebarState((prev) => ({ ...prev, isOpen: false }))}
        reservaId={sidebarState.reservaId}
        initialData={sidebarState.initialData}
        isCreating={sidebarState.mode === "create"}
        selectedDate={selectedDate}
        fecha={sidebarState.preSelectedDate || fechaISO}
        preSelectedCanchaId={sidebarState.preSelectedCanchaId}
        preSelectedTime={sidebarState.preSelectedTime}
        idClub={idClub ?? agenda?.id_club ?? 0}
        canchas={agenda?.canchas || []}
        reservas={agenda?.reservas || []}
        startHour={agenda?.startHour ?? 8}
        endHour={agenda?.endHour ?? 26}
        onCreated={() => {
          setSidebarState((prev) => ({ ...prev, isOpen: false }));
          loadAgenda();
        }}
      />
    </div>
  );
}
