import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { PUBLIC_MEDIA_BUCKET } from "@/lib/storage/paths";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const clubId = formData.get("clubId") as string;
    const action = formData.get("action") as string;
    const file = formData.get("file") as File | null;

    if (!clubId) {
      return NextResponse.json({ error: "Falta Club ID" }, { status: 400 });
    }

    // --- OBTENER URL ACTUAL ---
    const { data: nosotrosData, error: fetchError } = await supabaseAdmin
      .from("nosotros")
      .select("equipo_imagen_url")
      .eq("id_club", clubId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116: single row not found, which is ok
      throw fetchError;
    }

    const currentUrl = nosotrosData?.equipo_imagen_url;

    // --- SUBIR FOTO ---
    if (action === "upload") {
      if (!file) {
        return NextResponse.json({ error: "Falta archivo" }, { status: 400 });
      }

      // Eliminar foto anterior si existe
      if (currentUrl) {
        const oldPath = currentUrl.split(`/${PUBLIC_MEDIA_BUCKET}/`)[1];
        if (oldPath) {
          await supabaseAdmin.storage
            .from(PUBLIC_MEDIA_BUCKET)
            .remove([oldPath]);
        }
      }

      const fileName = file.name || "team-photo.jpg";
      const fileExt = fileName.split(".").pop() || "jpg";
      const path = `club_${clubId}/profesores/team-${Date.now()}.${fileExt}`;

      const arrayBuffer = await file.arrayBuffer();

      const { error: uploadError } = await supabaseAdmin.storage
        .from(PUBLIC_MEDIA_BUCKET)
        .upload(path, new Uint8Array(arrayBuffer), {
          upsert: true,
          contentType: file.type || "image/jpeg",
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabaseAdmin.storage
        .from(PUBLIC_MEDIA_BUCKET)
        .getPublicUrl(path);

      const publicUrl = urlData.publicUrl;

      // Actualizar DB (Tabla 'nosotros')
      const { error: dbError } = await supabaseAdmin
        .from("nosotros")
        .upsert(
          { id_club: clubId, equipo_imagen_url: publicUrl },
          { onConflict: "id_club" }
        );

      if (dbError) throw dbError;

      return NextResponse.json({ success: true, url: publicUrl });
    }

    // --- ELIMINAR FOTO ---
    if (action === "delete") {
      // Eliminar de Storage si existe
      if (currentUrl) {
        const pathToDelete = currentUrl.split(`/${PUBLIC_MEDIA_BUCKET}/`)[1];
        if (pathToDelete) {
          await supabaseAdmin.storage
            .from(PUBLIC_MEDIA_BUCKET)
            .remove([pathToDelete]);
        }
      }

      // Actualizar DB
      const { error: dbError } = await supabaseAdmin
        .from("nosotros")
        .upsert(
          { id_club: clubId, equipo_imagen_url: null },
          { onConflict: "id_club" }
        );

      if (dbError) throw dbError;

      return NextResponse.json({ success: true, url: null });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error: any) {
    console.error("API Error:", error);
    // Devolvemos JSON incluso en error 500 para evitar el error de parseo en el cliente
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
