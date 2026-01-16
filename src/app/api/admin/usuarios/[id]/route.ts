import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } } // <--- CAMBIO IMPORTANTE: debe coincidir con el nombre de la carpeta [id]
) {
  try {
    const { id } = params; // Aquí obtenemos el ID del usuario desde la URL
    const searchParams = req.nextUrl.searchParams;
    const clubId = searchParams.get("clubId");

    if (!id || !clubId) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    // 1. Obtener Perfil Base
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id_usuario", id) // Usamos 'id'
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // 2. Obtener Roles en este Club
    const { data: rolesData, error: rolesError } = await supabaseAdmin
      .from("club_usuarios")
      .select(
        `
        id_rol,
        roles ( nombre )
      `
      )
      .eq("id_usuario", id) // Usamos 'id'
      .eq("id_club", clubId);

    const roles = rolesData?.map((r: any) => r.roles?.nombre) || [];

    // 3. Obtener Historial de Reservas
    const { data: reservas, error: reservasError } = await supabaseAdmin
      .from("reservas")
      .select(
        `
        id_reserva,
        fecha,
        inicio,
        fin,
        precio_total,
        estado,
        canchas (
          nombre,
          tipos_cancha (
            nombre,
            deportes ( nombre )
          )
        )
      `
      )
      .eq("id_usuario", id) // Usamos 'id'
      .eq("id_club", clubId)
      .order("fecha", { ascending: false });

    if (reservasError) {
      console.error("Error fetching reservas:", reservasError);
    }

    const responseData = {
      ...profile,
      roles: roles,
      reservas: reservas || [],
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Error en GET usuario:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
