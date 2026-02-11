import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export async function POST(req: Request) {
  try {
    // Recibimos el ID real y los nuevos datos
    const { id_cliente, nombre, telefono, email } = await req.json();

    if (!id_cliente) {
      return NextResponse.json(
        { error: "Falta el ID del cliente" },
        { status: 400 },
      );
    }

    // Actualizamos directamente la tabla maestra 'clientes_manuales'
    const { error } = await supabaseAdmin
      .from("clientes_manuales")
      .update({
        nombre,
        telefono,
        email,
        updated_at: new Date().toISOString(), // Marcamos que hubo un cambio
      })
      .eq("id_cliente", id_cliente);

    if (error) throw error;

    // OPCIONAL: Si quieres que el historial de reservas "viejas" (snapshots) también se actualice visualmente:
    /*
    await supabaseAdmin
      .from("reservas")
      .update({ 
        cliente_nombre: nombre,
        cliente_telefono: telefono,
        cliente_email: email
      })
      .eq("id_cliente_manual", id_cliente);
    */

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
