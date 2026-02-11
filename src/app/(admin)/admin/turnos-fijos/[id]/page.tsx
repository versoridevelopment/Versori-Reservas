import Link from "next/link";
import { cookies } from "next/headers";
import { getCurrentClub } from "@/lib/ObetenerClubUtils/getCurrentClub";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { User, Calendar, MapPin, Clock } from "lucide-react";

type ReservaRow = {
  id_reserva: number;
  fecha: string;
  inicio: string;
  fin: string;
  fin_dia_offset: 0 | 1;
  estado: string;
  precio_total: number;
  // Ya no usamos cliente_nombre de la reserva, lo traeremos del template o relación
};

type TemplateRow = {
  id_turno_fijo: number;
  id_cancha: number;
  dow: number;
  inicio: string;
  duracion_min: number;
  fin: string;
  fin_dia_offset: 0 | 1;
  activo: boolean;
  segmento: "publico" | "profe";
  tipo_turno: string;
  start_date: string;
  end_date: string | null;
  // ✅ Usamos la relación con clientes_manuales
  clientes_manuales?: {
    nombre: string;
    telefono: string;
    email: string;
  };
};

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

async function fetchTemplate(idTurnoFijo: number, idClub: number) {
  // ✅ FIX: await cookies()
  const cookieStore = await cookies();
  const res = await fetch(
    `${BASE_URL}/api/admin/turnos-fijos/${idTurnoFijo}?id_club=${idClub}`,
    {
      cache: "no-store",
      headers: { cookie: cookieStore.toString() },
    },
  );

  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error || "Error leyendo turno fijo");
  return json?.data as TemplateRow;
}

async function fetchReservas(idTurnoFijo: number, idClub: number) {
  const cookieStore = await cookies();
  const res = await fetch(
    `${BASE_URL}/api/admin/turnos-fijos/${idTurnoFijo}/reservas?id_club=${idClub}`,
    {
      cache: "no-store",
      headers: { cookie: cookieStore.toString() },
    },
  );

  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error || "Error listando reservas");
  // Retornamos la data (manejando si viene como .data o directamente el array)
  return (json?.data || json || []) as ReservaRow[];
}

export default async function TurnoFijoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const id_turno_fijo = Number(id);

  const club = await getCurrentClub();
  const id_club = Number(club?.id_club || 0);

  if (!id_turno_fijo || !id_club) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-600">
          No se pudo resolver el club o el ID.
        </p>
      </div>
    );
  }

  const [tf, reservas] = await Promise.all([
    fetchTemplate(id_turno_fijo, id_club),
    fetchReservas(id_turno_fijo, id_club),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-6">
      <div className="flex flex-col gap-4">
        <Link
          href="/admin/turnos-fijos"
          className="text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center gap-2 transition-colors"
        >
          <ArrowLeft size={16} /> Volver al listado
        </Link>

        {/* Card de Configuración */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Turno Fijo: {tf.inicio} → {tf.fin}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-bold border ${tf.activo ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-200"}`}
                >
                  {tf.activo ? "ACTIVO" : "INACTIVO"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-slate-500 text-sm">
                <span className="flex items-center gap-1.5 font-medium">
                  <User size={16} className="text-slate-400" />
                  {tf.clientes_manuales?.nombre || "Sin cliente"}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={16} className="text-slate-400" /> Cancha #
                  {tf.id_cancha}
                </span>
                <span className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Clock size={16} className="text-slate-400" />{" "}
                  {tf.duracion_min} minutos
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Listado de Reservas Generadas */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
          <Calendar size={20} className="text-slate-400" /> Reservas en Agenda
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reservas.map((r) => {
            const fechaObj = new Date(r.fecha + "T12:00:00");
            return (
              <div
                key={r.id_reserva}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    #{r.id_reserva}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase">
                    {r.estado}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-800">
                    {format(fechaObj, "dd")}
                  </span>
                  <span className="text-sm font-bold text-slate-500 uppercase">
                    {format(fechaObj, "MMMM", { locale: es })}
                  </span>
                </div>

                <p className="text-sm font-medium text-slate-600 mt-1">
                  {r.inicio} hs — {r.fin} hs{" "}
                  {r.fin_dia_offset ? "(+1 día)" : ""}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-medium">
                    Monto
                  </span>
                  <span className="font-black text-slate-800">
                    ${r.precio_total.toLocaleString("es-AR")}
                  </span>
                </div>
              </div>
            );
          })}

          {reservas.length === 0 && (
            <div className="col-span-full bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center">
              <Calendar className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-500 font-medium">
                No hay reservas generadas para este turno todavía.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Icono faltante
function ArrowLeft({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 19-7-7 7-7M5 12h14" />
    </svg>
  );
}
