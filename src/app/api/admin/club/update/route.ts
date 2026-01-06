import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // 1. Recibir FormData
    const formData = await request.formData();
    const clubId = formData.get("clubId") as string;

    if (!clubId) {
      return NextResponse.json(
        { error: "Falta el ID del club" },
        { status: 400 }
      );
    }

    // Parsear datos JSON que vienen del formulario
    const clubDataRaw = formData.get("clubData");
    const nosotrosDataRaw = formData.get("nosotrosData");

    if (!clubDataRaw || !nosotrosDataRaw) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const clubData = JSON.parse(clubDataRaw as string);
    const nosotrosData = JSON.parse(nosotrosDataRaw as string);

    // ---------------------------------------------------------
    // A. ACTUALIZAR TABLA 'CLUBES'
    // ---------------------------------------------------------
    const clubUpdates = {
      nombre: clubData.nombre,
      subdominio: clubData.subdominio,
      color_primario: clubData.color_primario,
      color_secundario: clubData.color_secundario,
      color_texto: clubData.color_texto,
      texto_bienvenida_titulo: clubData.texto_bienvenida_titulo,
      texto_bienvenida_subtitulo: clubData.texto_bienvenida_subtitulo,
      marcas: clubData.marcas,

      // Flags de activación
      activo_profesores: clubData.activo_profesores,
      activo_contacto_home: clubData.activo_contacto_home, // <--- ¡AQUÍ ESTÁ LA CLAVE!

      // Imágenes (si las hubiera, la lógica de subida de archivos va aparte y actualiza esto)
      logo_url: clubData.logo_url,
      imagen_hero_url: clubData.imagen_hero_url,

      updated_at: new Date().toISOString(),
    };

    const { error: clubError } = await supabase
      .from("clubes")
      .update(clubUpdates)
      .eq("id_club", clubId);

    if (clubError) {
      console.error("Error al actualizar club:", clubError);
      throw new Error(`Error actualizando club: ${clubError.message}`);
    }

    // ---------------------------------------------------------
    // B. ACTUALIZAR TABLA 'CONTACTO'
    // ---------------------------------------------------------
    // 1. Buscamos el ID del contacto asociado al club
    const { data: contactoData, error: contactFetchError } = await supabase
      .from("contacto")
      .select("id_contacto")
      .eq("id_club", clubId)
      .single();

    if (!contactFetchError && contactoData) {
      // 2. Actualizamos datos básicos de contacto
      await supabase
        .from("contacto")
        .update({
          email: clubData.email,
          usuario_instagram: clubData.usuario_instagram, // Asumiendo que existe la columna
          // instagram_url: ... (si lo guardas derivado)
        })
        .eq("id_contacto", contactoData.id_contacto);

      // ---------------------------------------------------------
      // C. ACTUALIZAR TABLA 'DIRECCION'
      // ---------------------------------------------------------
      const direccionUpdates = {
        calle: clubData.calle,
        altura_calle: clubData.altura, // Mapeamos 'altura' del form a la columna de la BD
        barrio: clubData.barrio,
        updated_at: new Date().toISOString(), // Si tienes columna updated_at en direccion
      };

      // Verificamos si ya existe dirección para hacer Update o Insert
      const { data: existingDir } = await supabase
        .from("direccion")
        .select("id_direccion")
        .eq("id_contacto", contactoData.id_contacto)
        .maybeSingle();

      if (existingDir) {
        await supabase
          .from("direccion")
          .update(direccionUpdates)
          .eq("id_direccion", existingDir.id_direccion);
      } else {
        await supabase.from("direccion").insert({
          ...direccionUpdates,
          id_contacto: contactoData.id_contacto,
        });
      }

      // ---------------------------------------------------------
      // D. ACTUALIZAR TABLA 'TELEFONO' (Principal)
      // ---------------------------------------------------------
      // Lógica simplificada: Actualizamos o creamos el teléfono tipo "Principal"
      const { data: existingTel } = await supabase
        .from("telefono")
        .select("id_telefono")
        .eq("id_contacto", contactoData.id_contacto)
        .eq("tipo", "Principal") // O el criterio que uses para identificar el principal
        .maybeSingle();

      if (existingTel) {
        await supabase
          .from("telefono")
          .update({ numero: clubData.telefono })
          .eq("id_telefono", existingTel.id_telefono);
      } else if (clubData.telefono) {
        await supabase.from("telefono").insert({
          id_contacto: contactoData.id_contacto,
          numero: clubData.telefono,
          tipo: "Principal",
        });
      }
    } else {
      // (Opcional) Si no existe contacto, podrías crearlo aquí
      console.warn(
        "No se encontró registro de contacto para el club ID:",
        clubId
      );
    }

    // ---------------------------------------------------------
    // E. ACTUALIZAR TABLA 'NOSOTROS'
    // ---------------------------------------------------------
    const { data: existingNosotros } = await supabase
      .from("nosotros")
      .select("id_nosotros") // Corregido 'id' a 'id_nosotros' según tu esquema
      .eq("id_club", clubId)
      .maybeSingle();

    const nosotrosUpdates = {
      activo_nosotros: nosotrosData.activo_nosotros,
      historia_titulo: nosotrosData.historia_titulo,
      hero_descripcion: nosotrosData.hero_descripcion,
      historia_contenido: nosotrosData.historia_contenido,
      frase_cierre: nosotrosData.frase_cierre,
      galeria_inicio: nosotrosData.galeria_inicio,
      valores: nosotrosData.valores,
      updated_at: new Date().toISOString(),
    };

    if (existingNosotros) {
      await supabase
        .from("nosotros")
        .update(nosotrosUpdates)
        .eq("id_club", clubId);
    } else {
      await supabase
        .from("nosotros")
        .insert({ ...nosotrosUpdates, id_club: clubId });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error en update API:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
