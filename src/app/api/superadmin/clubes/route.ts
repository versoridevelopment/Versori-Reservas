import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { ensureClubBaseFolders } from "@/lib/storage/clubFolders";

export const runtime = "nodejs";

function getDefaultLogoUrl() {
  return process.env.DEFAULT_CLUB_LOGO_URL || "https://example.com/logo.png";
}

function getDefaultHeroUrl() {
  return process.env.DEFAULT_CLUB_HERO_URL || "https://example.com/hero.jpg";
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("clubes")
      .select(
        "id_club, nombre, subdominio, logo_url, color_primario, color_secundario, imagen_hero_url, color_texto, texto_bienvenida_titulo, texto_bienvenida_subtitulo, estado, created_at"
      )
      .order("id_club", { ascending: true });

    if (error) {
      console.error("[SUPERADMIN GET /clubes] error:", error);
      return NextResponse.json(
        { error: "Error al obtener clubes" },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[SUPERADMIN GET /clubes] ex:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      nombre,
      subdominio,
      color_primario,
      color_secundario,
      color_texto,
      texto_bienvenida_titulo,
      texto_bienvenida_subtitulo,
    } = body;

    // ✅ Ya NO exigimos logo_url ni imagen_hero_url
    if (
      !nombre ||
      !subdominio ||
      !color_primario ||
      !color_secundario ||
      !color_texto ||
      !texto_bienvenida_titulo ||
      !texto_bienvenida_subtitulo
    ) {
      return NextResponse.json(
        { error: "Todos los campos (excepto imágenes) son obligatorios." },
        { status: 400 }
      );
    }

    const logo_url = getDefaultLogoUrl();
    const imagen_hero_url = getDefaultHeroUrl();

    const { data, error } = await supabaseAdmin
      .from("clubes")
      .insert([
        {
          nombre,
          subdominio,
          logo_url, // placeholder NOT NULL
          imagen_hero_url, // placeholder NOT NULL
          color_primario,
          color_secundario,
          color_texto,
          texto_bienvenida_titulo,
          texto_bienvenida_subtitulo,
          estado: true,
        },
      ])
      .select(
        "id_club, nombre, subdominio, logo_url, color_primario, color_secundario, imagen_hero_url, color_texto, texto_bienvenida_titulo, texto_bienvenida_subtitulo, estado, created_at"
      )
      .single();

    if (error || !data) {
      console.error("[SUPERADMIN POST /clubes] error:", error);
      return NextResponse.json(
        { error: error?.message || "Error al crear el club" },
        { status: 500 }
      );
    }

    // Estructura base en Storage (tu raíz correcta club_{id})
    try {
      await ensureClubBaseFolders(data.id_club);
    } catch (storageError) {
      console.error(
        "[SUPERADMIN POST /clubes] Error al crear carpetas de Storage:",
        storageError
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[SUPERADMIN POST /clubes] ex:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
