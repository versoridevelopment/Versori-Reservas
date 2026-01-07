import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  try {
    // 1. Obtener la sesión del usuario que hace la petición
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 2. Parsear los datos del body
    const body = await request.json();
    const { nombre, apellido, telefono, apodo, bio, fecha_nacimiento, genero } =
      body;

    // 3. Instanciar cliente con SERVICE ROLE (Si es necesario para saltar RLS o permisos estrictos)
    // Nota: Si tus políticas RLS permiten que el usuario se edite a sí mismo, el cliente normal 'supabase' sirve.
    // Pero si mencionas la "role_key", aquí es donde se usaría para asegurar permisos de escritura totales.

    // OPCIÓN A: Usar el cliente normal (contexto de usuario) - Recomendado si RLS está bien configurado
    const { error } = await supabase.from("profiles").upsert({
      id_usuario: session.user.id, // Forzamos el ID de la sesión para seguridad
      nombre,
      apellido,
      telefono,
      apodo,
      bio,
      fecha_nacimiento: fecha_nacimiento || null, // Convertir string vacío a null
      genero,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: error.message || "Error interno" },
      { status: 500 }
    );
  }
}
