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
    // (Nota: Podrías usar .or() si quisieras buscar también por teléfono, pero mantenemos tu lógica original)
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

    if (!reservas || reservas.length === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    // 2. Calcular Estadísticas y Datos Recientes
    const totalReservas = reservas.length;
    const totalGastado = reservas.reduce(
      (acc, curr) => acc + Number(curr.precio_total),
      0,
    );

    // Obtener datos de contacto más recientes (el primero del array porque ordenamos descendente)
    const ultimoDato = reservas[0];
    const telefono = ultimoDato.cliente_telefono || "";
    const email = ultimoDato.cliente_email || "";

    // ---------------------------------------------------------
    // ✅ PASO 3 (NUEVO): BUSCAR LA NOTA EN LA TABLA NUEVA
    // ---------------------------------------------------------
    // La "key" para buscar la nota debe ser idéntica a la lógica del listado:
    // Si tiene teléfono, usamos el teléfono. Si no, el nombre en minúsculas.
    const key = telefono ? telefono : decodedName.toLowerCase();

    const { data: notaData } = await supabaseAdmin
      .from("club_usuarios_manuales_info")
      .select("notas")
      .eq("id_club", id_club)
      .eq("identificador", key)
      .maybeSingle();
    // ---------------------------------------------------------

    return NextResponse.json({
      ok: true,
      perfil: {
        nombre: decodedName,
        telefono: telefono || "Sin teléfono",
        email: email || "Sin email",
        total_reservas: totalReservas,
        total_gastado: totalGastado,
        notas: notaData?.notas || "", // ✅ Aquí inyectamos la nota recuperada
      },
      historial: reservas,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
