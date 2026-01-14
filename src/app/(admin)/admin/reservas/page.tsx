"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  ArrowLeft,
  MoreVertical,
  Plus,
  X,
  User,
  Phone,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit,
  CreditCard,
} from "lucide-react";

// --- TIPOS ---

type Cancha = {
  id: number;
  nombre: string;
  tipo: string;
  superficie: string;
  imagenUrl: string;
  esExterior: boolean;
};

type Reserva = {
  id: number;
  fechaInicio: string; // ISO String
  fechaFin: string; // ISO String
  cliente: string;
  telefono: string;
  estado: "Confirmada" | "Pendiente" | "Finalizada" | "Cancelada";
  pagoEstado: "Pagado" | "Parcial" | "Pendiente";
  montoTotal: number;
  montoSenia: number;
  notas?: string;
  color: string;
};

// --- MOCK DATA ---
const MOCK_CANCHAS: Cancha[] = [
  {
    id: 1,
    nombre: "Cancha Central",
    tipo: "Pádel",
    superficie: "Césped Sintético",
    imagenUrl: "/reserva/cancha_interior.jpg",
    esExterior: false,
  },
  {
    id: 2,
    nombre: "Cancha Panorámica",
    tipo: "Pádel",
    superficie: "Césped Sintético",
    imagenUrl: "/reserva/cancha_interior.jpg",
    esExterior: true,
  },
  {
    id: 3,
    nombre: "Cancha 3",
    tipo: "Pádel",
    superficie: "Cemento",
    imagenUrl: "/reserva/cancha_interior.jpg",
    esExterior: true,
  },
];

const MOCK_RESERVAS: Reserva[] = [
  {
    id: 101,
    fechaInicio: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
    fechaFin: new Date(new Date().setHours(11, 30, 0, 0)).toISOString(),
    cliente: "Juan Pérez",
    telefono: "+54 9 11 1234 5678",
    estado: "Confirmada",
    pagoEstado: "Pagado",
    montoTotal: 15000,
    montoSenia: 15000,
    color: "bg-blue-100 border-blue-300 text-blue-800",
  },
  {
    id: 102,
    fechaInicio: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
    fechaFin: new Date(new Date().setHours(15, 0, 0, 0)).toISOString(),
    cliente: "Clase Prof. Miguel",
    telefono: "-",
    estado: "Confirmada",
    pagoEstado: "Pendiente",
    montoTotal: 12000,
    montoSenia: 0,
    notas: "Cobrar al finalizar la clase.",
    color: "bg-purple-100 border-purple-300 text-purple-800",
  },
  {
    id: 103,
    fechaInicio: new Date(new Date().setHours(19, 0, 0, 0)).toISOString(),
    fechaFin: new Date(new Date().setHours(20, 30, 0, 0)).toISOString(),
    cliente: "Torneo Local",
    telefono: "+54 9 11 9876 5432",
    estado: "Pendiente",
    pagoEstado: "Parcial",
    montoTotal: 20000,
    montoSenia: 5000,
    color: "bg-orange-100 border-orange-300 text-orange-800",
  },
];

// --- HELPERS ---
const formatMoney = (amount: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    amount
  );

const formatTime = (isoString: string) =>
  new Date(isoString).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

// --- COMPONENTE: SIDEBAR DE DETALLES (NUEVO) ---
const ReservaSidebar = ({
  reserva,
  isOpen,
  onClose,
}: {
  reserva: Reserva | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  // Manejo de cierre con tecla ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!reserva) return null;

  return (
    <>
      {/* Backdrop (Fondo oscuro) */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full md:w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header Sidebar */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Detalle de Reserva
            </h2>
            <p className="text-sm text-gray-500 font-mono mt-1">
              ID: #{reserva.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Sidebar (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* 1. Información Principal */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  reserva.estado === "Confirmada"
                    ? "bg-green-100 text-green-700"
                    : reserva.estado === "Pendiente"
                    ? "bg-orange-100 text-orange-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {reserva.estado}
              </span>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {formatTime(reserva.fechaInicio)}
                </p>
                <p className="text-xs text-gray-500">
                  hasta {formatTime(reserva.fechaFin)}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Datos del Cliente */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" /> Datos del Cliente
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Nombre</span>
                <span className="text-sm font-medium text-gray-900">
                  {reserva.cliente}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Teléfono</span>
                <a
                  href={`https://wa.me/${reserva.telefono.replace(/\D/g, "")}`}
                  target="_blank"
                  className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" /> {reserva.telefono}
                </a>
              </div>
            </div>
          </div>

          {/* 3. Estado de Pagos */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" /> Finanzas
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total a Pagar</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatMoney(reserva.montoTotal)}
                </span>
              </div>

              {/* Barra de progreso de pago */}
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${
                    reserva.pagoEstado === "Pagado"
                      ? "bg-green-500"
                      : "bg-orange-400"
                  }`}
                  style={{
                    width: `${
                      (reserva.montoSenia / reserva.montoTotal) * 100
                    }%`,
                  }}
                ></div>
              </div>

              <div className="flex justify-between text-xs pt-1">
                <span className="text-green-700 font-medium">
                  Pagado: {formatMoney(reserva.montoSenia)}
                </span>
                <span className="text-red-600 font-medium">
                  Resta: {formatMoney(reserva.montoTotal - reserva.montoSenia)}
                </span>
              </div>

              <div className="pt-2 border-t border-gray-200 mt-2">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded ${
                    reserva.pagoEstado === "Pagado"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {reserva.pagoEstado === "Pagado" ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <AlertCircle className="w-3 h-3" />
                  )}
                  Estado: {reserva.pagoEstado}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Notas */}
          {reserva.notas && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Notas Internas
              </h4>
              <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-100 italic">
                "{reserva.notas}"
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-white space-y-3">
          <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all">
            <CreditCard className="w-4 h-4" /> Registrar Pago / Seña
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2.5 rounded-xl transition-all">
              <Edit className="w-4 h-4" /> Editar
            </button>
            <button className="flex items-center justify-center gap-2 bg-white border border-red-100 hover:bg-red-50 text-red-600 font-medium py-2.5 rounded-xl transition-all">
              <Trash2 className="w-4 h-4" /> Cancelar
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// --- COMPONENTE: TARJETA DE CANCHA ---
const CanchaCard = ({
  cancha,
  onSelect,
}: {
  cancha: Cancha;
  onSelect: (c: Cancha) => void;
}) => (
  <div
    onClick={() => onSelect(cancha)}
    className="group bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-blue-400 transition-all duration-300"
  >
    <div className="relative h-48 w-full bg-gray-100">
      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
        <Image
          src={cancha.imagenUrl || "/placeholder.jpg"}
          alt={cancha.nombre}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
        />
        {/* Overlay gradiente para texto legible */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-gray-800 shadow-sm flex items-center gap-1">
        {cancha.esExterior ? "☀️ Exterior" : "🏠 Techada"}
      </div>
      <div className="absolute bottom-4 left-4 text-white">
        <h3 className="text-xl font-bold leading-tight">{cancha.nombre}</h3>
        <p className="text-sm text-gray-200 opacity-90">{cancha.tipo}</p>
      </div>
    </div>
    <div className="p-4 flex items-center justify-between bg-white">
      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <MapPin className="w-4 h-4 text-blue-500" />
        {cancha.superficie}
      </div>
      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md group-hover:bg-blue-600 group-hover:text-white transition-colors">
        Ver Agenda →
      </span>
    </div>
  </div>
);

// --- COMPONENTE: CRONOGRAMA ---
const CronogramaCancha = ({
  cancha,
  onBack,
}: {
  cancha: Cancha;
  onBack: () => void;
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  // Estado para controlar qué reserva se muestra en el sidebar
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);

  // Constantes de diseño
  const START_HOUR = 8;
  const END_HOUR = 23;
  const HOURS_COUNT = END_HOUR - START_HOUR + 1;
  const PIXELS_PER_HOUR = 130;

  const hours = Array.from({ length: HOURS_COUNT }, (_, i) => START_HOUR + i);

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const getEventStyle = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startHour = startDate.getHours() + startDate.getMinutes() / 60;
    const endHour = endDate.getHours() + endDate.getMinutes() / 60;
    const top = (startHour - START_HOUR) * PIXELS_PER_HOUR;
    const height = (endHour - startHour) * PIXELS_PER_HOUR;
    return { top: `${top}px`, height: `${height}px` };
  };

  const getCurrentTimePosition = () => {
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    return (currentHour - START_HOUR) * PIXELS_PER_HOUR;
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <div className="relative h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
      {/* 1. SIDEBAR (Se renderiza condicionalmente o siempre visible controlando CSS) */}
      <ReservaSidebar
        reserva={selectedReserva}
        isOpen={!!selectedReserva}
        onClose={() => setSelectedReserva(null)}
      />

      {/* 2. HEADER CRONOGRAMA */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white bg-gray-100 rounded-full transition-all border border-transparent hover:border-gray-300 shadow-sm active:scale-95"
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              {cancha.nombre}
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {cancha.tipo}
              </span>
              <span>•</span>
              <span>{cancha.superficie}</span>
            </div>
          </div>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 hover:bg-gray-50 rounded-lg text-gray-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="px-4 text-center min-w-[160px] cursor-pointer hover:bg-gray-50 rounded-lg py-1 transition-colors group">
            <span className="block text-xs font-bold text-blue-600 uppercase tracking-wider group-hover:text-blue-700">
              {isToday
                ? "Hoy"
                : selectedDate.toLocaleDateString("es-AR", { weekday: "long" })}
            </span>
            <span className="block text-base font-bold text-gray-800">
              {selectedDate.toLocaleDateString("es-AR", {
                day: "numeric",
                month: "long",
              })}
            </span>
          </div>
          <button
            onClick={() => changeDate(1)}
            className="p-2 hover:bg-gray-50 rounded-lg text-gray-600 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-slate-900/20 transition-all active:scale-95">
          <Plus className="w-5 h-5" /> Nueva Reserva
        </button>
      </div>

      {/* 3. CALENDARIO GRID */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[650px] overflow-hidden relative">
        <div className="overflow-y-auto flex-1 relative custom-scrollbar bg-dots-pattern">
          <div
            className="relative min-h-full"
            style={{ height: HOURS_COUNT * PIXELS_PER_HOUR }}
          >
            {/* Grid Lines */}
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute w-full border-b border-gray-100 flex items-start group hover:bg-gray-50/50 transition-colors"
                style={{
                  top: (hour - START_HOUR) * PIXELS_PER_HOUR,
                  height: PIXELS_PER_HOUR,
                }}
              >
                <div className="w-16 text-right pr-3 text-xs font-semibold text-gray-400 -mt-2.5 sticky left-0 z-10 select-none">
                  {hour}:00
                </div>
                {/* Media hora dash */}
                <div className="absolute left-16 right-0 top-1/2 border-t border-gray-50 border-dashed" />
              </div>
            ))}

            {/* Current Time Indicator */}
            {isToday && (
              <div
                className="absolute left-16 right-0 border-t-2 border-red-500 z-30 pointer-events-none flex items-center"
                style={{ top: getCurrentTimePosition() }}
              >
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full -ml-1.5 shadow-sm"></div>
              </div>
            )}

            {/* RESERVAS RENDER */}
            {MOCK_RESERVAS.map((reserva) => {
              const style = getEventStyle(
                reserva.fechaInicio,
                reserva.fechaFin
              );

              return (
                <div
                  key={reserva.id}
                  onClick={(e) => {
                    e.stopPropagation(); // Evitar triggers no deseados
                    setSelectedReserva(reserva);
                  }}
                  className={`absolute left-16 right-4 md:right-12 rounded-xl p-3 border-l-[6px] shadow-sm cursor-pointer 
                    hover:shadow-md hover:brightness-95 transition-all z-20 flex flex-col justify-between group
                    ${reserva.color} bg-opacity-90 backdrop-blur-sm`}
                  style={style}
                >
                  {/* Header Reserva */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm md:text-base text-gray-800">
                        {reserva.cliente}
                      </span>
                      {reserva.pagoEstado !== "Pagado" && (
                        <span
                          className="w-2 h-2 rounded-full bg-red-500 animate-pulse"
                          title="Pago pendiente"
                        ></span>
                      )}
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/10 rounded transition-opacity">
                      <MoreVertical className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  {/* Info Reserva */}
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium opacity-80">
                      <Clock className="w-3 h-3" />
                      {formatTime(reserva.fechaInicio)} -{" "}
                      {formatTime(reserva.fechaFin)}
                    </div>
                    <div className="text-xs font-bold bg-white/60 px-2 py-0.5 rounded text-gray-700">
                      {formatMoney(reserva.montoTotal)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- PÁGINA PRINCIPAL ---

export default function ReservasPage() {
  const [selectedCourt, setSelectedCourt] = useState<Cancha | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedCourt]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb o Título simple */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Gestión de Reservas
            </h1>
            <p className="text-slate-500 mt-1">
              {selectedCourt
                ? "Gestiona los turnos en tiempo real."
                : "Selecciona una cancha para comenzar."}
            </p>
          </div>
        </div>

        {selectedCourt ? (
          <CronogramaCancha
            cancha={selectedCourt}
            onBack={() => setSelectedCourt(null)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {MOCK_CANCHAS.map((cancha) => (
              <CanchaCard
                key={cancha.id}
                cancha={cancha}
                onSelect={setSelectedCourt}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
