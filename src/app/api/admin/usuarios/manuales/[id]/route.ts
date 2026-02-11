import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const id_club = searchParams.get("id_club");

    if (!id || !id_club) {
      return NextResponse.json(
        { error: "Datos insuficientes" },
        { status: 400 },
      );
    }

    // ----------------------------------------------------------------------
    // PASO 1: Buscar Cliente en la tabla MAESTRA (clientes_manuales)
    // ----------------------------------------------------------------------
    const { data: cliente, error: clienteError } = await supabaseAdmin
      .from("clientes_manuales")
      .select("*")
      .eq("id_cliente", id)
      .eq("id_club", id_club)
      .single();

    if (clienteError || !cliente) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    // ----------------------------------------------------------------------
    // PASO 2: Buscar Historial de Reservas
    // ----------------------------------------------------------------------
    // ⚠️ CAMBIO IMPORTANTE: Eliminadas las columnas borradas (cliente_nombre, etc)
    const { data: reservas, error: reservasError } = await supabaseAdmin
      .from("reservas")
      .select(
        `
        id_reserva, fecha, inicio, fin, precio_total, estado, notas, 
        created_at, cancelado_at, origen,
        canchas(nombre),
        creado_por, cancelado_por,
        motivo_cancelacion
      `,
      )
      .eq("id_cliente_manual", id) // Usamos la relación con la nueva tabla
      .order("fecha", { ascending: false });

    if (reservasError) throw reservasError;

    // ----------------------------------------------------------------------
    // PASO 3: Auditoría (Nombres de responsables staff/admin)
    // ----------------------------------------------------------------------
    const userIds = new Set<string>();
    reservas.forEach((r) => {
      if (r.creado_por) userIds.add(r.creado_por);
      if (r.cancelado_por) userIds.add(r.cancelado_por);
    });

    const namesMap: Record<string, string> = {};
    if (userIds.size > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id_usuario, nombre, apellido")
        .in("id_usuario", Array.from(userIds));

      profiles?.forEach((p) => {
        namesMap[p.id_usuario] = `${p.nombre} ${p.apellido}`;
      });
    }

    // ----------------------------------------------------------------------
    // PASO 4: Formateo final
    // ----------------------------------------------------------------------
    const historialFormateado = reservas.map((r: any) => {
      let accion = "Creado";
      let fechaAccion = r.created_at;
      let responsable = "Sistema";

      if (r.estado === "cancelada" || r.estado === "rechazada") {
        accion = "Cancelado";
        fechaAccion = r.cancelado_at || r.created_at;
        responsable = r.cancelado_por
          ? namesMap[r.cancelado_por] || "Admin"
          : "Admin";
      } else {
        accion = "Creado";
        fechaAccion = r.created_at;
        responsable = r.creado_por
          ? namesMap[r.creado_por] || "Admin"
          : "Admin";
      }

      return {
        id_reserva: r.id_reserva,
        fecha: r.fecha,
        inicio: r.inicio,
        fin: r.fin,
        precio_total: r.precio_total,
        estado: r.estado,
        canchas: r.canchas,
        notas: r.notas,
        motivo_cancelacion: r.motivo_cancelacion,
        audit_accion: accion,
        audit_fecha: fechaAccion,
        audit_responsable: responsable,
      };
    });

    // ----------------------------------------------------------------------
    // PASO 5: Estadísticas (Calculadas al vuelo con los datos frescos)
    // ----------------------------------------------------------------------
    const totalReservas = reservas.length;

    // Sumamos solo las reservas no canceladas para el total gastado real
    const totalGastado = reservas
      .filter((r: any) => r.estado !== "cancelada" && r.estado !== "rechazada")
      .reduce((acc: number, curr: any) => acc + Number(curr.precio_total), 0);

    return NextResponse.json({
      ok: true,
      perfil: {
        id: cliente.id_cliente,
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        email: cliente.email,
        notas: cliente.notas,
        total_reservas: totalReservas,
        total_gastado: totalGastado,
      },
      historial: historialFormateado,
    });
  } catch (error: any) {
    console.error("Error API Detalle Manual:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
