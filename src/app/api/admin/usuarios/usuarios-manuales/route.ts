import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id_club = searchParams.get("id_club");

    if (!id_club)
      return NextResponse.json({ error: "Falta id_club" }, { status: 400 });

    // 1. Traemos reservas
    const { data: reservas, error } = await supabaseAdmin
      .from("reservas")
      .select(
        "cliente_nombre, cliente_telefono, cliente_email, precio_total, created_at, fecha, cliente_manual_activo",
      )
      .eq("id_club", id_club)
      .is("id_usuario", null)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // 2. Traemos las notas guardadas para este club
    const { data: notasData } = await supabaseAdmin
      .from("club_usuarios_manuales_info")
      .select("identificador, notas")
      .eq("id_club", id_club);

    // Creamos un mapa rápido para acceder a las notas
    const notasMap = new Map();
    notasData?.forEach((n) => {
      notasMap.set(n.identificador, n.notas);
    });

    // 3. Agrupar
    const clientesMap = new Map();

    reservas?.forEach((r) => {
      const nombre = r.cliente_nombre?.trim() || "Sin Nombre";
      const telefono = r.cliente_telefono?.trim() || "";
      const email = r.cliente_email?.trim() || "";

      // CLAVE ÚNICA (Debe coincidir con la lógica del POST)
      const key = telefono ? telefono : nombre.toLowerCase();

      if (!clientesMap.has(key)) {
        // Recuperamos nota si existe
        const notaGuardada = notasMap.get(key) || "";

        clientesMap.set(key, {
          id: key, // El ID es el identificador (tel o nombre)
          nombre,
          telefono,
          email,
          total_reservas: 0,
          total_gastado: 0,
          ultima_reserva: r.fecha,
          activo: r.cliente_manual_activo !== false,
          notas: notaGuardada, // <--- CAMPO NUEVO
        });
      }

      const cliente = clientesMap.get(key);
      cliente.total_reservas += 1;
      cliente.total_gastado += Number(r.precio_total || 0);
    });

    const listaClientes = Array.from(clientesMap.values());

    return NextResponse.json({ ok: true, clientes: listaClientes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
