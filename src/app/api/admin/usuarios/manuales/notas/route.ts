import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { id_cliente, notas } = await req.json();

    if (!id_cliente) {
      return NextResponse.json({ error: "Falta id_cliente" }, { status: 400 });
    }

    // Actualizamos el campo 'notas' en la tabla del cliente
    const { error } = await supabaseAdmin
      .from("clientes_manuales")
      .update({
        notas: notas, // Guardamos el texto nuevo
        updated_at: new Date().toISOString(),
      })
      .eq("id_cliente", id_cliente);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
