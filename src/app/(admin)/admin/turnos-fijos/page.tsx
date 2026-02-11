import Link from "next/link";
import { cookies } from "next/headers";
import { getCurrentClub } from "@/lib/ObetenerClubUtils/getCurrentClub";
import { DesactivarTurnoFijoButton } from "./DesactivarTurnoFijoButton";
import { Calendar, Clock, User, Phone, ChevronRight } from "lucide-react";

type TurnoFijoRow = {
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
  cliente_nombre: string | null;
  cliente_telefono: string | null;
  start_date: string;
  end_date: string | null;
  future_count?: number;
};

function dowLabel(dow: number) {
  return ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][dow] ?? `DOW ${dow}`;
}

async function fetchTurnosFijos(id_club: number) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  // ✅ FIX: Await cookies
  const cookieStore = await cookies();

  const res = await fetch(
    `${baseUrl}/api/admin/turnos-fijos?id_club=${id_club}&include_future_count=true`,
    {
      cache: "no-store",
      headers: { cookie: cookieStore.toString() },
    },
  );

  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error || "Error listando turnos fijos");
  return (json?.data || []) as TurnoFijoRow[];
}

export default async function TurnosFijosPage() {
  const club = await getCurrentClub();

  if (!club?.id_club) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold text-slate-900">Turnos fijos</h1>
        <p className="text-sm text-slate-600 mt-2">
          No se pudo resolver el club actual.
        </p>
      </div>
    );
  }

  const id_club = Number(club.id_club);
  const rows = await fetchTurnosFijos(id_club);

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-24 sm:pb-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Turnos fijos
        </h1>
        <p className="text-sm text-slate-500">
          Templates semanales y reservas generadas automáticamente.
        </p>
      </div>

      <div className="grid gap-4">
        {rows.map((tf) => (
          <div
            key={tf.id_turno_fijo}
            className="group relative rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              {/* Información Principal */}
              <div className="space-y-3 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest ${
                      tf.activo
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    {tf.activo ? "Activo" : "Inactivo"}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-full">
                    {tf.tipo_turno} · {tf.segmento}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span className="text-blue-600">{dowLabel(tf.dow)}</span>
                    <span>
                      {tf.inicio} → {tf.fin}
                    </span>
                    {tf.fin_dia_offset === 1 && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                        +1d
                      </span>
                    )}
                  </h3>
                  <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-bold">
                      <User size={14} className="text-slate-400" />
                      <span className="truncate">
                        {tf.cliente_nombre || "Sin nombre"}
                      </span>
                    </div>
                    {tf.cliente_telefono && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Phone size={12} />
                        <span>{tf.cliente_telefono}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {tf.start_date}{" "}
                    {tf.end_date ? `al ${tf.end_date}` : "(Sin fin)"}
                  </span>
                  <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg">
                    <Clock size={12} /> {tf.future_count || 0} reservas activas
                  </span>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center md:flex-col gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                <Link
                  href={`/admin/turnos-fijos/${tf.id_turno_fijo}`}
                  className="flex-1 md:w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors"
                >
                  Ver detalle
                  <ChevronRight size={16} className="md:hidden" />
                </Link>

                {tf.activo && (
                  <div className="shrink-0">
                    <DesactivarTurnoFijoButton
                      idClub={id_club}
                      idTurnoFijo={tf.id_turno_fijo}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {rows.length === 0 && (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
            <Calendar size={24} />
          </div>
          <p className="text-sm font-bold text-slate-900">
            No hay turnos fijos
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Los templates semanales que crees aparecerán aquí.
          </p>
        </div>
      )}
    </div>
  );
}
