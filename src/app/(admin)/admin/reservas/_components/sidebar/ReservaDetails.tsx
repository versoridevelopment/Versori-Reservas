import {
  User,
  Phone,
  MessageCircle,
  Clock,
  DollarSign,
  XCircle,
  CheckCircle2,
  Mail,
  StickyNote,
  Globe,
  UserCog,
  CreditCard,
  CalendarDays,
  Wallet,
} from "lucide-react";
import { formatMoney } from "../hooks/useReservaSidebar";
import type { ReservaUI } from "../types";

interface Props {
  reserva: ReservaUI;
  getWhatsappLink: (phone: string) => string;
  onEdit: () => void;
}

export default function ReservaDetails({
  reserva,
  getWhatsappLink,
  onEdit,
}: Props) {
  // --- Lógica Segura (Sin cambios funcionales) ---
  const notas = reserva.notas || "";
  const email = reserva.cliente_email || "";
  const origen = reserva.origen || "web";
  const telefono = reserva.cliente_telefono || "";
  const tieneTelefono = telefono && telefono !== "Sin teléfono";

  const saldo = Number(reserva.saldo_pendiente || 0);
  const total = Number(reserva.precio_total || 0);
  const pagado = Number(reserva.pagos_aprobados_total || 0);

  const estadoPago = saldo > 0 ? "pendiente" : "pagado";

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header: Perfil Jugador */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:border-slate-200 transition-colors">
        <div className="p-4 flex justify-between items-start">
          <div className="flex gap-3">
            {/* Avatar Placeholder */}
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
              <User className="w-6 h-6" />
            </div>

            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-slate-800 leading-tight">
                {reserva.cliente_nombre || "Cliente Anónimo"}
              </h3>

              {/* Datos de contacto */}
              <div className="mt-1 space-y-1">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{telefono || "Sin teléfono"}</span>
                </div>
                {email && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[200px]" title={email}>
                      {email}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onEdit}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 border border-slate-200 px-3 py-1 rounded-full hover:bg-slate-50 transition-all"
          >
            Editar
          </button>
        </div>

        {/* Acciones Rápidas (Solo si tiene teléfono) */}
        {tieneTelefono && (
          <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 flex justify-end">
            <a
              href={getWhatsappLink(telefono)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Enviar WhatsApp
            </a>
          </div>
        )}
      </div>

      {/* 2. Detalles del Turno (Cards Grid) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Horario */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Horario
            </span>
          </div>
          <div className="text-slate-800 font-bold text-lg">
            {reserva.horaInicio}{" "}
            <span className="text-slate-400 text-sm">a</span> {reserva.horaFin}
          </div>
        </div>

        {/* Origen */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              Origen
            </span>
          </div>
          <div className="flex items-center gap-2">
            {origen === "admin" ? (
              <div className="flex items-center gap-1.5 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded text-sm">
                <UserCog className="w-4 h-4" /> Admin
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded text-sm">
                <Globe className="w-4 h-4" /> Web/App
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Sección Económica (Ticket style) */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-slate-400" />
            Detalle de Pago
          </h4>
          {estadoPago === "pagado" ? (
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded-full tracking-wide">
              Pagado
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold uppercase rounded-full tracking-wide">
              Pendiente
            </span>
          )}
        </div>

        <div className="p-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-300" /> Precio Total
            </span>
            <span className="font-bold text-slate-800 text-base">
              {formatMoney(total)}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-slate-300" /> Pagado
            </span>
            <span className="font-semibold text-emerald-600">
              {formatMoney(pagado)}
            </span>
          </div>

          <div className="h-px bg-slate-100 my-2" />

          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-slate-400" /> Resta Pagar
            </span>
            <span
              className={`text-xl font-black ${saldo > 0 ? "text-rose-600" : "text-slate-400"}`}
            >
              {formatMoney(saldo)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Notas */}
      {notas && (
        <div className="relative group">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-400 rounded-l-md" />
          <div className="bg-amber-50 p-4 rounded-r-md border border-amber-100 text-amber-900 text-sm">
            <div className="flex items-center gap-2 mb-1 text-amber-700/60 font-bold text-xs uppercase tracking-wider">
              <StickyNote className="w-3 h-3" /> Notas Internas
            </div>
            <p className="italic">"{notas}"</p>
          </div>
        </div>
      )}

      {/* 5. Historial (Static for now) */}
      <div className="pt-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
          Historial del Jugador
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Sin deudas
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
            <CalendarDays className="w-4 h-4 text-blue-500" />
            Asistencia perfecta
          </div>
        </div>
      </div>
    </div>
  );
}
