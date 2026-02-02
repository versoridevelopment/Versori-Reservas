import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { id_club, identificador, notas } = await req.json();

    if (!id_club || !identificador) {
      return NextResponse.json({ error: "Datos faltantes" }, { status: 400 });
    }

    // Usamos UPSERT: Si existe actualiza, si no crea.
    const { error } = await supabaseAdmin
      .from("club_usuarios_manuales_info")
      .upsert(
        {
          id_club,
          identificador, // Esto es el telefono o el nombre.toLowerCase()
          notas,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id_club, identificador" },
      );

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
