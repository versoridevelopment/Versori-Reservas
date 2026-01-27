"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Clock, RotateCw, Download } from "lucide-react";
import jsPDF from "jspdf";

type Estado = "pendiente_pago" | "confirmada" | "expirada" | "rechazada";

type ReservaApi = {
  id_reserva: number;
  estado: Estado;
  expires_at?: string | null;
  confirmed_at?: string | null;

  id_club?: number;
  id_cancha?: number;

  fecha?: string | null;
  inicio?: string | null;
  fin?: string | null;
  fin_dia_offset?: 0 | 1 | null;

  precio_total?: number | null;
  anticipo_porcentaje?: number | null;
  monto_anticipo?: number | null;

  cliente_nombre?: string | null;
  cliente_telefono?: string | null;
  cliente_email?: string | null;

  club_nombre?: string | null;
  club_subdominio?: string | null;
  cancha_nombre?: string | null;

  ultimo_pago?: {
    id_pago: number;
    status: string | null;
    mp_status: string | null;
    mp_status_detail: string | null;
    mp_payment_id: number | null;
    amount: number | null;
    currency: string | null;
    created_at: string | null;
  } | null;
};

function isLocalHostName(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost")
  );
}

function buildHostWithSubdomain(baseHost: string, club: string) {
  if (baseHost.startsWith(`${club}.`)) return baseHost;
  const host = baseHost.startsWith("www.") ? baseHost.slice(4) : baseHost;
  return `${club}.${host}`;
}

function fmtMoney(n: any) {
  const v = Number(n || 0);
  if (!Number.isFinite(v)) return "-";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(v);
}

function downloadPdfFromReserva(r: ReservaApi) {
  const doc = new jsPDF();
  let y = 18;

  doc.setFontSize(16);
  doc.text("Comprobante de Reserva", 105, y, { align: "center" });
  y += 10;

  doc.setFontSize(11);

  const line = (label: string, value: string) => {
    doc.text(`${label}:`, 14, y);
    doc.text(value || "-", 60, y);
    y += 7;
  };

  line("Reserva", `#${String(r.id_reserva)}`);
  line("Club", r.club_nombre ?? "-");
  line("Cancha", r.cancha_nombre ?? "-");
  line("Fecha", r.fecha ?? "-");
  line(
    "Horario",
    `${r.inicio ?? "-"} - ${r.fin ?? "-"}${r.fin_dia_offset === 1 ? " (+1)" : ""}`
  );
  line("Estado", r.estado ?? "-");
  y += 3;

  line("Total", fmtMoney(r.precio_total));
  line("Anticipo", fmtMoney(r.monto_anticipo));

  y += 5;
  doc.setFontSize(10);
  doc.text("Datos del cliente", 14, y);
  y += 7;
  doc.setFontSize(11);
  line("Nombre", r.cliente_nombre ?? "-");
  line("Teléfono", r.cliente_telefono ?? "-");
  line("Email", r.cliente_email ?? "-");

  if (r.ultimo_pago) {
    y += 5;
    doc.setFontSize(10);
    doc.text("Pago", 14, y);
    y += 7;
    doc.setFontSize(11);
    line("MP status", r.ultimo_pago.mp_status ?? "-");
    line("Monto", fmtMoney(r.ultimo_pago.amount));
    line("Payment ID", String(r.ultimo_pago.mp_payment_id ?? "-"));
  }

  doc.save(`comprobante-reserva-${r.id_reserva}.pdf`);
}

export default function PagoResultadoPage() {
  const params = useSearchParams();
  const router = useRouter();

  const id_reserva = Number(params.get("id_reserva"));
  const club = params.get("club") || null;

  const [estado, setEstado] = useState<Estado | null>(null);
  const [reserva, setReserva] = useState<ReservaApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollError, setPollError] = useState<string | null>(null);

  const clubHomeUrl = useMemo(() => {
    if (!club) return null;
    if (typeof window === "undefined") return null;

    const protocolEnv = process.env.NEXT_PUBLIC_SITE_PROTOCOL || "https";
    const rootDomainEnv = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "";

    const { protocol, hostname, port } = window.location;

    // Local dev: ferpadel.localhost:3000
    if (isLocalHostName(hostname)) {
      const targetHost = `${club}.localhost`;
      return `${protocol}//${targetHost}${port ? `:${port}` : ""}/`;
    }

    // Ngrok dev
    if (hostname.includes("ngrok-free.dev")) {
      return `${protocol}//${hostname}/?club=${encodeURIComponent(club)}`;
    }

    // Producción: forzar SIEMPRE el dominio raíz oficial
    if (rootDomainEnv) {
      return `${protocolEnv}://${club}.${rootDomainEnv}/`;
    }

    // Fallback
    const targetHost = buildHostWithSubdomain(hostname, club);
    return `${protocol}//${targetHost}${port ? `:${port}` : ""}/`;
  }, [club]);

  /**
   * ✅ 1) Redirect automático al subdominio del club
   * Así el resultado se ve con el tenant/layout del club y no el navbar genérico.
   */
  useEffect(() => {
    if (!club) return;
    if (typeof window === "undefined") return;

    const protocolEnv = process.env.NEXT_PUBLIC_SITE_PROTOCOL || "https";
    const rootDomainEnv = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "";
    if (!rootDomainEnv) return;

    const { hostname, search } = window.location;

    // No forzar en local/ngrok
    if (isLocalHostName(hostname) || hostname.includes("ngrok-free.dev")) return;

    const expectedHost = `${club}.${rootDomainEnv}`;
    const alreadyOnClubHost = hostname === expectedHost;

    if (!alreadyOnClubHost) {
      const targetUrl = `${protocolEnv}://${expectedHost}/pago/resultado${search}`;
      window.location.replace(targetUrl);
    }
  }, [club]);

  /**
   * ✅ 2) Polling de estado
   * Nota: si te redirige al subdominio, el polling ocurre ya en el host del club.
   */
  useEffect(() => {
    if (!id_reserva) return;

    let alive = true;
    let timer: any = null;

    async function poll() {
      try {
        setPollError(null);

        const res = await fetch(`/api/reservas/${id_reserva}`, { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as ReservaApi | null;

        if (!alive) return;

        if (!res.ok || !data) {
          setPollError((data as any)?.error || "No se pudo verificar el estado.");
          setLoading(false);
          timer = setTimeout(poll, 2500);
          return;
        }

        setReserva(data);

        const nextEstado = (data.estado || null) as Estado | null;
        setEstado(nextEstado);
        setLoading(false);

        if (nextEstado === "pendiente_pago") {
          timer = setTimeout(poll, 2500);
        }
      } catch (e: any) {
        if (!alive) return;
        setPollError(e?.message || "Error de red verificando estado.");
        setLoading(false);
        timer = setTimeout(poll, 2500);
      }
    }

    poll();

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [id_reserva]);

  if (!id_reserva) {
    return <p className="text-white p-10">Reserva inválida</p>;
  }

  const showPending = loading && !estado;

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#001a33] to-[#002b5b] text-white px-6">
      <div className="bg-[#0b2545] border border-[#1b4e89] rounded-3xl p-10 max-w-md w-full text-center">
        {showPending && (
          <>
            <Clock className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Verificando pago…</h1>
            <p className="text-neutral-300 mb-6">
              Estamos consultando el estado de la operación.
            </p>
          </>
        )}

        {!showPending && pollError && (
          <>
            <RotateCw className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Estamos verificando</h1>
            <p className="text-neutral-300 mb-6">{pollError}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold"
            >
              Reintentar
            </button>
          </>
        )}

        {!showPending && !pollError && estado === "confirmada" && (
          <>
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Reserva confirmada</h1>
            <p className="text-neutral-300 mb-6">El pago fue aprobado correctamente.</p>

            {/* Comprobante visible */}
            <div className="text-left bg-[#071b33] border border-[#1b4e89] rounded-2xl p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold">Comprobante</p>
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-600/20 text-emerald-200">
                  Confirmada
                </span>
              </div>

              <div className="space-y-2 text-sm text-neutral-200">
                <div className="flex justify-between gap-4">
                  <span className="text-neutral-400">Reserva</span>
                  <span>#{id_reserva}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-neutral-400">Club</span>
                  <span className="text-right">{reserva?.club_nombre ?? "-"}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-neutral-400">Cancha</span>
                  <span className="text-right">{reserva?.cancha_nombre ?? "-"}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-neutral-400">Fecha</span>
                  <span>{reserva?.fecha ?? "-"}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-neutral-400">Horario</span>
                  <span>
                    {(reserva?.inicio ?? "-")} - {(reserva?.fin ?? "-")}
                    {reserva?.fin_dia_offset === 1 ? " (+1)" : ""}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-neutral-400">Total</span>
                  <span>{fmtMoney(reserva?.precio_total)}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-neutral-400">Anticipo</span>
                  <span>{fmtMoney(reserva?.monto_anticipo)}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-neutral-400">Confirmada</span>
                  <span className="text-right">
                    {reserva?.confirmed_at ? String(reserva.confirmed_at) : "-"}
                  </span>
                </div>

                {(reserva?.cliente_nombre ||
                  reserva?.cliente_telefono ||
                  reserva?.cliente_email) && (
                  <>
                    <div className="pt-3 mt-3 border-t border-white/10 text-neutral-300 font-semibold">
                      Cliente
                    </div>
                    <div className="text-sm text-neutral-200 space-y-1">
                      <div>{reserva?.cliente_nombre ?? "-"}</div>
                      <div>{reserva?.cliente_telefono ?? "-"}</div>
                      <div>{reserva?.cliente_email ?? "-"}</div>
                    </div>
                  </>
                )}

                {reserva?.ultimo_pago && (
                  <>
                    <div className="pt-3 mt-3 border-t border-white/10 text-neutral-300 font-semibold">
                      Pago
                    </div>
                    <div className="text-sm text-neutral-200 space-y-1">
                      <div>
                        <span className="text-neutral-400">MP status:</span>{" "}
                        {reserva.ultimo_pago.mp_status ?? "-"}
                      </div>
                      <div>
                        <span className="text-neutral-400">Monto:</span>{" "}
                        {fmtMoney(reserva.ultimo_pago.amount)}
                      </div>
                      <div>
                        <span className="text-neutral-400">Payment ID:</span>{" "}
                        {reserva.ultimo_pago.mp_payment_id ?? "-"}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {/* ✅ Descargar PDF (cliente) */}
              <button
                onClick={() => reserva && downloadPdfFromReserva(reserva)}
                className="bg-white/10 hover:bg-white/15 px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Descargar comprobante (PDF)
              </button>

              <button
                onClick={() => router.push("/mis-reservas")}
                className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-xl font-semibold"
              >
                Ver mis reservas
              </button>

              {clubHomeUrl && (
                <button
                  onClick={() => (window.location.href = clubHomeUrl)}
                  className="bg-gray-700/70 hover:bg-gray-600 px-6 py-3 rounded-xl font-semibold"
                >
                  Volver al club
                </button>
              )}
            </div>
          </>
        )}

        {!showPending && !pollError && estado === "pendiente_pago" && (
          <>
            <Clock className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Pago pendiente</h1>
            <p className="text-neutral-300 mb-6">
              Estamos esperando confirmación del pago.
            </p>

            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold"
            >
              Actualizar
            </button>
          </>
        )}

        {!showPending && !pollError && estado === "rechazada" && (
          <>
            <XCircle className="w-16 h-16 text-rose-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Pago rechazado</h1>
            <p className="text-neutral-300 mb-6">El pago no pudo completarse.</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push("/reserva")}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold"
              >
                Reintentar reserva
              </button>

              {clubHomeUrl && (
                <button
                  onClick={() => (window.location.href = clubHomeUrl)}
                  className="bg-gray-700/70 hover:bg-gray-600 px-6 py-3 rounded-xl font-semibold"
                >
                  Volver al club
                </button>
              )}
            </div>
          </>
        )}

        {!showPending && !pollError && estado === "expirada" && (
          <>
            <RotateCw className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Reserva expirada</h1>
            <p className="text-neutral-300 mb-6">No se recibió el pago a tiempo.</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push("/reserva")}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold"
              >
                Volver a reservar
              </button>

              {clubHomeUrl && (
                <button
                  onClick={() => (window.location.href = clubHomeUrl)}
                  className="bg-gray-700/70 hover:bg-gray-600 px-6 py-3 rounded-xl font-semibold"
                >
                  Volver al club
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
