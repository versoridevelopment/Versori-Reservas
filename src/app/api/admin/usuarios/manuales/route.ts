import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id_club = searchParams.get("id_club");

    if (!id_club)
      return NextResponse.json({ error: "Falta id_club" }, { status: 400 });

    // 1. Consultar clientes_manuales y unir con reservas para estadísticas
    // Usamos el !inner o left join implícito de Supabase
    const { data: clientesRaw, error } = await supabaseAdmin
      .from("clientes_manuales")
      .select(
        `
        id_cliente,
        nombre,
        telefono,
        email,
        notas,
        activo,
        updated_at,
        reservas (
          precio_total,
          fecha
        )
      `,
      )
      .eq("id_club", id_club)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    // 2. Procesar los datos para el frontend
    // Calculamos totales en memoria (es rápido para listas de < 5000 clientes)
    const clientesProcesados = clientesRaw?.map((c: any) => {
      const reservas = c.reservas || [];

      const total_reservas = reservas.length;

      const total_gastado = reservas.reduce(
        (acc: number, curr: any) => acc + Number(curr.precio_total || 0),
        0,
      );

      // Encontrar la fecha más reciente
      // Ordenamos las fechas y tomamos la primera (o usamos reduce para max)
      let ultima_reserva = null;
      if (reservas.length > 0) {
        // Asumiendo formato YYYY-MM-DD, string comparison funciona
        reservas.sort((a: any, b: any) => (a.fecha < b.fecha ? 1 : -1));
        ultima_reserva = reservas[0].fecha;
      }

      return {
        id: c.id_cliente, // Usamos el ID real de la base de datos
        nombre: c.nombre,
        telefono: c.telefono,
        email: c.email,
        notas: c.notas,
        activo: c.activo,
        total_reservas,
        total_gastado,
        ultima_reserva: ultima_reserva || c.updated_at, // Fallback a fecha de creación/update si no jugó
      };
    });

    return NextResponse.json({ ok: true, clientes: clientesProcesados });
  } catch (error: any) {
    console.error("Error fetching clientes manuales:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
