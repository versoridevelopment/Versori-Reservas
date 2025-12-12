// src/app/api/admin/canchas/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { uploadCanchaImage } from "@/lib/storage/uploadCanchaImage";

export const runtime = "nodejs";

/**
 * GET /api/admin/canchas?id_club=1
 * Lista TODAS las canchas del club (estado true y false)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idClubParam = searchParams.get("id_club");

    if (!idClubParam) {
      return NextResponse.json({ error: "id_club es requerido" }, { status: 400 });
    }

    const id_club = Number(idClubParam);
    if (Number.isNaN(id_club)) {
      return NextResponse.json({ error: "id_club debe ser numérico" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("v_canchas_detalle")
      .select("*")
      .eq("id_club", id_club)
      .order("id_cancha", { ascending: true });

    if (error) {
      console.error("[ADMIN GET /canchas] error:", error);
      return NextResponse.json({ error: "Error al obtener canchas" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[ADMIN GET /canchas] ex:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

/**
 * POST /api/admin/canchas
 * Soporta:
 * - JSON (sin archivo)
 * - multipart/form-data (con file "imagen")
 */
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let id_club: number | null = null;
    let id_tipo_cancha: number | null = null;
    let nombre: string | null = null;
    let descripcion: string | null = null;
    let precio_hora: number | null = null;
    let imagen_url: string | null = null;
    let es_exterior: boolean = true;
    let activa: boolean = true;

    // 1) multipart/form-data (con archivo)
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();

      id_club = Number(form.get("id_club"));
      id_tipo_cancha = Number(form.get("id_tipo_cancha"));
      nombre = (form.get("nombre") as string) ?? null;
      descripcion = (form.get("descripcion") as string) ?? null;
      precio_hora = Number(form.get("precio_hora"));

      // booleanos pueden venir como "true"/"false"
      const esExteriorRaw = form.get("es_exterior");
      const activaRaw = form.get("activa");
      if (esExteriorRaw !== null) es_exterior = String(esExteriorRaw) === "true";
      if (activaRaw !== null) activa = String(activaRaw) === "true";

      const file = form.get("imagen");
      if (file && file instanceof File && file.size > 0) {
        if (!id_club || Number.isNaN(id_club)) {
          return NextResponse.json(
            { error: "id_club es requerido y numérico para subir imagen" },
            { status: 400 }
          );
        }
        const uploaded = await uploadCanchaImage({ id_club, file });
        imagen_url = uploaded.publicUrl;
      } else {
        // opcional si querés permitir también una URL manual
        const imagenUrlRaw = form.get("imagen_url");
        imagen_url = imagenUrlRaw ? String(imagenUrlRaw) : null;
      }
    } else {
      // 2) JSON tradicional
      const body = await req.json();
      id_club = body.id_club ?? null;
      id_tipo_cancha = body.id_tipo_cancha ?? null;
      nombre = body.nombre ?? null;
      descripcion = body.descripcion ?? null;
      precio_hora = body.precio_hora ?? null;
      imagen_url = body.imagen_url ?? null;
      es_exterior = body.es_exterior ?? true;
      activa = body.activa ?? true;
    }

    if (!id_club || !id_tipo_cancha || !nombre || !precio_hora) {
      return NextResponse.json(
        { error: "id_club, id_tipo_cancha, nombre y precio_hora son obligatorios" },
        { status: 400 }
      );
    }

    if (Number.isNaN(Number(id_club)) || Number.isNaN(Number(id_tipo_cancha)) || Number.isNaN(Number(precio_hora))) {
      return NextResponse.json(
        { error: "id_club, id_tipo_cancha y precio_hora deben ser numéricos" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("canchas")
      .insert([
        {
          id_club,
          id_tipo_cancha,
          nombre,
          descripcion,
          precio_hora,
          imagen_url,
          es_exterior,
          activa,
          estado: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("[ADMIN POST /canchas] error:", error);
      return NextResponse.json({ error: "Error al crear la cancha" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[ADMIN POST /canchas] ex:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
