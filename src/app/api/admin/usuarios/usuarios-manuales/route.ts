import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id_club = searchParams.get("id_club");
    const query = searchParams.get("q") || ""; // Por si quieres filtrar desde backend

    if (!id_club)
      return NextResponse.json({ error: "Falta id_club" }, { status: 400 });

    // Construimos la consulta sobre clientes_manuales
    let queryBuilder = supabaseAdmin
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
          fecha,
          estado
        )
      `,
      )
      .eq("id_club", id_club)
      .order("updated_at", { ascending: false });

    // Si quieres búsqueda desde backend (opcional, tu front ya filtra en memoria)
    if (query) {
      queryBuilder = queryBuilder.or(
        `nombre.ilike.%${query}%,telefono.ilike.%${query}%`,
      );
    }

    const { data: clientesRaw, error } = await queryBuilder;

    if (error) throw error;

    // Procesar datos
    const clientesProcesados = clientesRaw?.map((c: any) => {
      const reservas = c.reservas || [];
      const total_reservas = reservas.length;

      // Calcular gastado solo de reservas válidas
      const total_gastado = reservas
        .filter(
          (r: any) => r.estado !== "cancelada" && r.estado !== "rechazada",
        )
        .reduce(
          (acc: number, curr: any) => acc + Number(curr.precio_total || 0),
          0,
        );

      // Última reserva
      let ultima_reserva = null;
      if (reservas.length > 0) {
        reservas.sort((a: any, b: any) => (a.fecha < b.fecha ? 1 : -1));
        ultima_reserva = reservas[0].fecha;
      }

      return {
        id: c.id_cliente,
        nombre: c.nombre,
        telefono: c.telefono,
        email: c.email,
        notas: c.notas,
        activo: c.activo,
        total_reservas,
        total_gastado,
        ultima_reserva: ultima_reserva || c.updated_at, // Si no jugó, fecha de actualización
      };
    });

    return NextResponse.json({ ok: true, clientes: clientesProcesados });
  } catch (error: any) {
    console.error("Error fetching clientes manuales:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
