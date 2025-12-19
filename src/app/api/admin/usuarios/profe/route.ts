// src/app/api/admin/usuarios/profe/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export const runtime = "nodejs";

function parseBody(body: any) {
  const id_usuario = body?.id_usuario as string | undefined;
  const id_club = Number(body?.id_club);

  if (!id_usuario || !id_club || Number.isNaN(id_club)) {
    return { error: "id_usuario (uuid) e id_club (number) son requeridos" as const };
  }

  return { id_usuario, id_club };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = parseBody(body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.rpc("admin_asignar_rol_profe", {
      p_id_usuario: parsed.id_usuario,
      p_id_club: parsed.id_club,
    });

    if (error) {
      console.error("[POST /api/admin/usuarios/profe] rpc error:", error);
      return NextResponse.json({ error: "No se pudo asignar rol profe" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[POST /api/admin/usuarios/profe] ex:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = parseBody(body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.rpc("admin_quitar_rol_profe", {
      p_id_usuario: parsed.id_usuario,
      p_id_club: parsed.id_club,
    });

    if (error) {
      console.error("[DELETE /api/admin/usuarios/profe] rpc error:", error);
      return NextResponse.json({ error: "No se pudo quitar rol profe" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[DELETE /api/admin/usuarios/profe] ex:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

