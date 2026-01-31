import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id_club = searchParams.get("id_club");

    if (!id_club) {
      return NextResponse.json({ error: "Falta id_club" }, { status: 400 });
    }

    // Auth check
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Obtener todas las reservas manuales (sin id_usuario) de este club
    // Traemos campos clave para agrupar y calcular totales
    const { data: reservas, error } = await supabaseAdmin
      .from("reservas")
      .select(
        "cliente_nombre, cliente_telefono, cliente_email, precio_total, created_at, fecha",
      )
      .eq("id_club", id_club)
      .is("id_usuario", null)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // 2. Agrupar y procesar en memoria
    // Usaremos un Map donde la clave será el TELÉFONO (si existe) o el NOMBRE.
    const clientesMap = new Map();

    reservas?.forEach((r) => {
      // Normalizamos datos
      const nombre = r.cliente_nombre?.trim() || "Sin Nombre";
      const telefono = r.cliente_telefono?.trim() || "";
      const email = r.cliente_email?.trim() || "";

      // Clave única: Preferimos teléfono, sino nombre
      const key = telefono ? telefono : nombre.toLowerCase();

      if (!clientesMap.has(key)) {
        clientesMap.set(key, {
          id: key, // ID ficticio para el frontend
          nombre,
          telefono,
          email,
          total_reservas: 0,
          total_gastado: 0,
          ultima_reserva: r.fecha, // Como viene ordenado desc, el primero es el último
        });
      }

      const cliente = clientesMap.get(key);
      cliente.total_reservas += 1;
      cliente.total_gastado += Number(r.precio_total || 0);
    });

    const listaClientes = Array.from(clientesMap.values());

    return NextResponse.json({
      ok: true,
      clientes: listaClientes,
    });
  } catch (error: any) {
    console.error("Error fetching manual users:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
