"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  CreditCard,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Printer,
  RotateCcw,
  MapPin,
  FileJson,
} from "lucide-react";

// --- TIPOS (Mapeo DB) ---
type PagoDetalle = {
  id_pago: number;
  provider: string;
  status: string; // 'approved', 'rejected', etc.
  status_detail: string; // 'accredited', 'cc_rejected_other_reason'
  amount: number;
  currency: string;
  mp_payment_id: string;
  created_at: string;
  approved_at: string | null;
  method: string; // 'credit_card', 'account_money'
  card_last4?: string; // Dato derivado del JSON raw

  // Relaciones
  cliente: {
    id_usuario: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
  };
  reserva: {
    id_reserva: number;
    fecha: string; // "2025-10-20"
    inicio: string; // "18:00:00"
    fin: string; // "19:30:00"
    cancha: string;
    precio_total_reserva: number; // Para comparar si pagó total o seña
  };
  raw: any; // El JSON completo de MP
};

// --- COMPONENTES UI ---

function StatusBadgeLarge({ status }: { status: string }) {
  const styles = {
    approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
    in_process: "bg-amber-100 text-amber-800 border-amber-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    refunded: "bg-gray-100 text-gray-800 border-gray-200",
  };

  const icons = {
    approved: CheckCircle2,
    in_process: AlertCircle,
    rejected: XCircle,
    refunded: RotateCcw,
  };

  const style = styles[status as keyof typeof styles] || styles.in_process;
  const Icon = icons[status as keyof typeof icons] || AlertCircle;

  // Traducción simple
  const label =
    status === "approved"
      ? "Aprobado"
      : status === "rejected"
      ? "Rechazado"
      : status === "in_process"
      ? "En revisión"
      : status;

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${style} w-fit`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-semibold text-sm uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

// --- PÁGINA ---

export default function DetallePagoPage({
  params,
}: {
  params: { id: string };
}) {
  const [loading, setLoading] = useState(true);
  const [pago, setPago] = useState<PagoDetalle | null>(null);

  useEffect(() => {
    // Simulación de Fetch a tu API
    // En producción: fetch(`/api/admin/pagos/${params.id}`)
    async function load() {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 500));

      // Mock Data basado en tu DB
      setPago({
        id_pago: 1024,
        provider: "mercadopago",
        status: "approved",
        status_detail: "accredited",
        amount: 7500, // Fue una seña del 50%
        currency: "ARS",
        mp_payment_id: "5829102938",
        created_at: "2025-10-20T14:30:00",
        approved_at: "2025-10-20T14:30:05",
        method: "credit_card",
        card_last4: "4242",
        cliente: {
          id_usuario: "u-123",
          nombre: "Neil",
          apellido: "Sims",
          email: "neil.sims@example.com",
          telefono: "+54 9 11 1234 5678",
        },
        reserva: {
          id_reserva: 885,
          fecha: "2025-10-22",
          inicio: "19:00",
          fin: "20:30",
          cancha: "Cancha 3 (Panorámica)",
          precio_total_reserva: 15000,
        },
        raw: {
          // Simulación de lo que guarda MP
          payment_method_id: "visa",
          payment_type_id: "credit_card",
          status_detail: "accredited",
          description: "Reserva Cancha 3 - Versori",
        },
      });
      setLoading(false);
    }
    load();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // Toast notification here
  };

  if (loading)
    return (
      <div className="p-10 text-center text-gray-500">
        Cargando detalles de la transacción...
      </div>
    );
  if (!pago)
    return (
      <div className="p-10 text-center text-red-500">
        No se encontró el pago.
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navegación y Título */}
        <div className="flex items-center gap-4">
          <Link
            href="/admin/pagos"
            className="p-2 rounded-lg hover:bg-white hover:shadow-sm text-gray-500 transition-all"
            aria-label="Volver al listado de pagos"
            title="Volver atrás"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Pago #{pago.id_pago}
              <span className="text-sm font-normal text-gray-400 font-mono">
                MP: {pago.mp_payment_id}
              </span>
            </h1>
          </div>
          <div className="ml-auto flex gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              aria-label="Imprimir comprobante"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
            {/* Botón Reembolsar (Solo si está aprobado) */}
            {pago.status === "approved" && (
              <button
                className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors shadow-sm"
                aria-label="Solicitar reembolso"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reembolsar</span>
              </button>
            )}
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda (Principal) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tarjeta de Estado y Monto */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6 mb-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    Estado de la transacción
                  </p>
                  <StatusBadgeLarge status={pago.status} />
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Monto Cobrado</p>
                  <span className="text-4xl font-bold text-gray-900 tracking-tight">
                    ${pago.amount.toLocaleString("es-AR")}
                  </span>
                  <span className="text-sm text-gray-400 ml-1">
                    {pago.currency}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Método de Pago
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {pago.method.replace("_", " ")}
                      </p>
                      {pago.card_last4 && (
                        <p className="text-xs text-gray-500">
                          Terminada en •••• {pago.card_last4}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Fechas
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>
                        Creado:{" "}
                        {new Date(pago.created_at).toLocaleString("es-AR")}
                      </span>
                    </div>
                    {pago.approved_at && (
                      <div className="flex items-center gap-2 text-sm text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          Acreditado:{" "}
                          {new Date(pago.approved_at).toLocaleString("es-AR")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjeta: Qué se está pagando (La Reserva) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900 text-sm">
                  Concepto del Pago
                </h3>
                <Link
                  href={`/admin/reservas`}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  aria-label="Ver reserva original"
                >
                  Ver Reserva <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-100 rounded-lg text-gray-500">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-gray-900">
                      Reserva de Pista
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {pago.reserva.cancha}
                    </p>

                    <div className="flex flex-wrap gap-4 mt-3">
                      <div className="flex items-center gap-1.5 text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(pago.reserva.fecha).toLocaleDateString(
                          "es-AR"
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {pago.reserva.inicio} - {pago.reserva.fin} hs
                      </div>
                    </div>

                    {/* Barra de progreso de pago (Si fue seña) */}
                    {pago.amount < pago.reserva.precio_total_reserva && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-emerald-700">
                            Pagado: ${pago.amount}
                          </span>
                          <span className="text-gray-500">
                            Total: ${pago.reserva.precio_total_reserva}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full"
                            style={{
                              width: `${
                                (pago.amount /
                                  pago.reserva.precio_total_reserva) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Resta abonar en el club:{" "}
                          <strong>
                            ${pago.reserva.precio_total_reserva - pago.amount}
                          </strong>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sección Técnica: JSON RAW (Con <details> para evitar error ARIA) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <details className="group">
                <summary className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors list-none">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FileJson className="w-4 h-4 text-gray-400" />
                    Datos técnicos (Mercado Pago Raw)
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-400 transition-transform group-open:-rotate-90" />
                </summary>
                <div className="p-4 bg-gray-900 text-gray-100 text-xs font-mono overflow-x-auto">
                  <pre>{JSON.stringify(pago.raw, null, 2)}</pre>
                </div>
              </details>
            </div>
          </div>

          {/* Columna Derecha (Lateral) */}
          <div className="space-y-6">
            {/* Info del Cliente */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                Datos del Cliente
              </h3>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                  {pago.cliente.nombre.charAt(0)}
                  {pago.cliente.apellido.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {pago.cliente.nombre} {pago.cliente.apellido}
                  </p>
                  <Link
                    href={`/admin/usuarios/${pago.cliente.id_usuario}`}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Ver perfil
                  </Link>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">{pago.cliente.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Teléfono</p>
                  <p className="text-sm text-gray-900">
                    {pago.cliente.telefono}
                  </p>
                </div>
              </div>
            </div>

            {/* IDs de Referencia */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">
                IDs de Referencia
              </h3>

              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Mercado Pago ID</p>
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono font-medium text-gray-800">
                      {pago.mp_payment_id}
                    </code>
                    <button
                      onClick={() => handleCopy(pago.mp_payment_id)}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="Copiar ID"
                      aria-label="Copiar ID Mercado Pago"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">ID Interno (DB)</p>
                  <code className="text-sm font-mono font-medium text-gray-800">
                    #{pago.id_pago}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
