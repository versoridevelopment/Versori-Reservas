import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id_usuario = params.id;
    if (!id_usuario) return NextResponse.json({ error: "id es requerido" }, { status: 400 });

    // Trae todas las filas por rol desde tu vista "simple"
    const { data, error } = await supabaseAdmin
      .from("v_club_usuarios_roles")
      .select("*")
      .eq("id_usuario", id_usuario);

    if (error) {
      console.error("[ADMIN GET /usuarios/:id] error:", error);
      return NextResponse.json({ error: "Error al obtener usuario" }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[ADMIN GET /usuarios/:id] ex:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
