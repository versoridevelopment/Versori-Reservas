import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { id_club, fecha, accion } = body;

    const supabase = await getSupabaseServerClient();
    const { data: authRes } = await supabase.auth.getUser();
    if (!authRes?.user)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    // Upsert en la tabla de excepciones
    const { error } = await supabaseAdmin
      .from("turnos_fijos_excepciones")
      .upsert(
        {
          id_turno_fijo: id,
          fecha,
          accion,
          notas: body.notas || null,
          id_cancha_override: body.id_cancha || null,
          inicio_override: body.inicio || null,
        },
        { onConflict: "id_turno_fijo,fecha" },
      );

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
