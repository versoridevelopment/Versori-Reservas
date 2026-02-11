import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import {
  startOfMonth,
  endOfMonth,
  format,
  parseISO,
  getDay,
  differenceInMinutes,
  differenceInHours,
  getHours,
} from "date-fns";
import { es } from "date-fns/locale";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get("clubId");
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    if (!clubId)
      return NextResponse.json({ error: "Falta Club ID" }, { status: 400 });

    const now = new Date();
    const startDate = fromParam ? new Date(fromParam) : startOfMonth(now);
    const endDate = toParam ? new Date(toParam) : endOfMonth(now);

    // 1. Obtener Reservas (Solo columnas existentes)
    const { data: reservas, error } = await supabaseAdmin
      .from("reservas")
      .select(
        `
        id_reserva, id_cancha, fecha, inicio, fin, precio_total, monto_anticipo, 
        estado, id_usuario, id_cliente_manual, created_at,
        canchas (nombre)
      `,
      )
      .eq("id_club", clubId)
      .gte("fecha", startDate.toISOString().split("T")[0])
      .lte("fecha", endDate.toISOString().split("T")[0]);

    if (error) throw error;

    // 2. Obtener Identidades de Clientes de forma robusta
    const userIds = Array.from(
      new Set(reservas?.map((r) => r.id_usuario).filter(Boolean)),
    );
    const manualIds = Array.from(
      new Set(reservas?.map((r) => r.id_cliente_manual).filter(Boolean)),
    );

    const [profilesRes, manualesRes] = await Promise.all([
      userIds.length > 0
        ? supabaseAdmin
            .from("profiles")
            .select("id_usuario, nombre, apellido")
            .in("id_usuario", userIds)
        : Promise.resolve({ data: [] }),
      manualIds.length > 0
        ? supabaseAdmin
            .from("clientes_manuales")
            .select("id_cliente, nombre")
            .in("id_cliente", manualIds)
        : Promise.resolve({ data: [] }),
    ]);

    const profilesMap = new Map(
      profilesRes.data?.map((p) => [p.id_usuario, p]),
    );
    const manualesMap = new Map(
      manualesRes.data?.map((m) => [m.id_cliente, m]),
    );

    // 3. Procesamiento de KPIs y Gráficos
    let totalIngresos = 0,
      totalSaldoCobrar = 0,
      totalCobrado = 0;
    let totalReservasValidas = 0,
      totalCanceladas = 0,
      minutosVendidos = 0,
      sumaLeadTimeHoras = 0;

    const performanceCanchas = new Map();
    const clientesStats = new Map();
    const ingresosPorDia = new Map();
    const reservasPorDiaSemana = new Array(7).fill(0);
    const actividadPorHora = new Array(24).fill(0);

    reservas?.forEach((r: any) => {
      if (r.estado === "cancelada" || r.estado === "rechazada") {
        totalCanceladas++;
        return;
      }

      totalReservasValidas++;
      const ingresoTotal = Number(r.precio_total || 0);
      const anticipo = Number(r.monto_anticipo || 0);

      totalIngresos += ingresoTotal;
      totalSaldoCobrar += ingresoTotal - anticipo;
      totalCobrado += anticipo;

      // Procesar Horas y Lead Time
      if (r.inicio && r.fin) {
        const startDateTime = parseISO(`${r.fecha}T${r.inicio}`);
        const endDateTime = parseISO(`${r.fecha}T${r.fin}`);
        const createdDateTime = parseISO(r.created_at);

        const duracion = differenceInMinutes(endDateTime, startDateTime);
        if (duracion > 0) minutosVendidos += duracion;

        const leadTime = differenceInHours(startDateTime, createdDateTime);
        if (leadTime > 0) sumaLeadTimeHoras += leadTime;

        const horaInicio = getHours(startDateTime);
        actividadPorHora[horaInicio] += 1;
      }

      // Por Cancha
      const nombreCancha = r.canchas?.nombre || `Cancha ${r.id_cancha}`;
      if (!performanceCanchas.has(nombreCancha)) {
        performanceCanchas.set(nombreCancha, {
          name: nombreCancha,
          ingresos: 0,
          reservas: 0,
        });
      }
      const pc = performanceCanchas.get(nombreCancha);
      pc.ingresos += ingresoTotal;
      pc.reservas += 1;

      // Por Cliente (Identidad Limpia)
      let clienteKey = "anonimo";
      let clienteNombre = "Anónimo";

      if (r.id_usuario) {
        clienteKey = r.id_usuario;
        const p = profilesMap.get(r.id_usuario);
        clienteNombre = p ? `${p.nombre} ${p.apellido}` : "Usuario Web";
      } else if (r.id_cliente_manual) {
        clienteKey = `manual-${r.id_cliente_manual}`;
        clienteNombre =
          manualesMap.get(r.id_cliente_manual)?.nombre || "Cliente Manual";
      }

      if (!clientesStats.has(clienteKey)) {
        clientesStats.set(clienteKey, {
          id: clienteKey,
          name: clienteNombre,
          reservas: 0,
          gastado: 0,
        });
      }
      const cs = clientesStats.get(clienteKey);
      cs.reservas += 1;
      cs.gastado += ingresoTotal;

      // Por Fecha
      const fechaStr = format(parseISO(r.fecha), "dd MMM", { locale: es });
      ingresosPorDia.set(
        fechaStr,
        (ingresosPorDia.get(fechaStr) || 0) + ingresoTotal,
      );
      reservasPorDiaSemana[getDay(parseISO(r.fecha))] += 1;
    });

    return NextResponse.json({
      kpis: {
        ingresos: totalIngresos,
        saldoCobrar: totalSaldoCobrar,
        reservas: totalReservasValidas,
        horasVendidas: Math.round(minutosVendidos / 60),
        anticipacion: totalReservasValidas
          ? Math.round(sumaLeadTimeHoras / totalReservasValidas)
          : 0,
        tasaCancelacion:
          totalReservasValidas + totalCanceladas > 0
            ? (totalCanceladas / (totalReservasValidas + totalCanceladas)) * 100
            : 0,
        ticketPromedio: totalReservasValidas
          ? totalIngresos / totalReservasValidas
          : 0,
        clientesNuevos: Array.from(clientesStats.values()).filter(
          (c: any) => c.reservas === 1,
        ).length,
        clientesRecurrentes: Array.from(clientesStats.values()).filter(
          (c: any) => c.reservas > 1,
        ).length,
      },
      charts: {
        revenue: Array.from(ingresosPorDia).map(([name, value]) => ({
          name,
          value,
        })),
        weekDays: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(
          (name, i) => ({ name, reservas: reservasPorDiaSemana[i] }),
        ),
        hourly: actividadPorHora
          .map((reservas, i) => ({ name: `${i}:00`, reservas }))
          .filter((h) => h.reservas > 0),
        payments: [
          { name: "Cobrado", value: totalCobrado },
          { name: "Pendiente", value: totalSaldoCobrar },
        ],
        topClientes: Array.from(clientesStats.values())
          .sort((a: any, b: any) => b.gastado - a.gastado)
          .slice(0, 5),
      },
      comparativaCanchas: Array.from(performanceCanchas.values()).sort(
        (a, b) => b.ingresos - a.ingresos,
      ),
    });
  } catch (error: any) {
    console.error("Error Dashboard Stats:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
