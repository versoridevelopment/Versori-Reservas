import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ nombre: string }> };

export async function GET(req: Request, { params }: Ctx) {
  try {
    const { nombre } = await params;
    const { searchParams } = new URL(req.url);
    const id_club = searchParams.get("id_club");

    // Decodificamos el nombre (viene como URL encoded, ej: Juan%20Perez)
    const decodedName = decodeURIComponent(nombre);

    if (!id_club)
      return NextResponse.json({ error: "Falta id_club" }, { status: 400 });

    // 1. Buscar todas las reservas de este nombre exacto
    const { data: reservas, error } = await supabaseAdmin
      .from("reservas")
      .select(
        `
        id_reserva, fecha, inicio, fin, precio_total, estado,
        canchas(nombre),
        cliente_telefono, cliente_email, notas, created_at
      `,
      )
      .eq("id_club", id_club)
      .eq("cliente_nombre", decodedName) // Buscamos por nombre exacto
      .is("id_usuario", null) // Solo manuales
      .order("fecha", { ascending: false });

    if (error) throw error;

    // 2. Calcular Estadísticas
    const totalReservas = reservas.length;
    const totalGastado = reservas.reduce(
      (acc, curr) => acc + Number(curr.precio_total),
      0,
    );

    // Obtener datos de contacto más recientes (por si cambiaron)
    const ultimoDato = reservas[0] || {};

    return NextResponse.json({
      ok: true,
      perfil: {
        nombre: decodedName,
        telefono: ultimoDato.cliente_telefono || "Sin teléfono",
        email: ultimoDato.cliente_email || "Sin email",
        total_reservas: totalReservas,
        total_gastado: totalGastado,
      },
      historial: reservas,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
