import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export const runtime = "nodejs";

function parseId(params: { id?: string }) {
  const idParam = params.id;
  if (!idParam) return { error: "id es requerido" as const };
  const id = Number(idParam);
  if (Number.isNaN(id)) return { error: "id debe ser numérico" as const };
  return { id };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const parsed = parseId(params);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const body = await req.json().catch(() => null);
    const allowed = ["nombre", "descripcion", "activo"];
    const updateData: any = {};

    for (const k of allowed) if (body?.[k] !== undefined) updateData[k] = body[k];

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No se enviaron campos para actualizar" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("canchas_tarifarios")
      .update(updateData)
      .eq("id_tarifario", parsed.id)
      .select()
      .single();

    if (error) {
      console.error("[PATCH /tarifarios/:id] error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[PATCH /tarifarios/:id] ex:", err);
    return NextResponse.json({ error: err?.message || "Error interno" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const parsed = parseId(params);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    // soft delete: activo=false
    const { data, error } = await supabaseAdmin
      .from("canchas_tarifarios")
      .update({ activo: false })
      .eq("id_tarifario", parsed.id)
      .select()
      .single();

    if (error) {
      console.error("[DELETE /tarifarios/:id] error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, tarifario: data });
  } catch (err: any) {
    console.error("[DELETE /tarifarios/:id] ex:", err);
    return NextResponse.json({ error: err?.message || "Error interno" }, { status: 500 });
  }
}
