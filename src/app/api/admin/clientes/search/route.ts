import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const id_club = searchParams.get("id_club");
    const type = searchParams.get("type"); // Recibimos el filtro "manual"

    // Validación mínima
    if (!id_club) return NextResponse.json({ results: [] });
    if (query.length < 1) return NextResponse.json({ results: [] });

    // --- LÓGICA: Buscar SOLO MANUALES (Historial de Reservas) ---
    // Buscamos reservas de este club, que NO tengan usuario registrado (id_usuario es null)
    // y que coincidan con el nombre o teléfono.
    const { data: manuales } = await supabaseAdmin
      .from("reservas")
      .select("cliente_nombre, cliente_telefono, cliente_email")
      .eq("id_club", id_club)
      .is("id_usuario", null) // ⚠️ CLAVE: Solo usuarios sin cuenta
      .or(`cliente_nombre.ilike.%${query}%,cliente_telefono.ilike.%${query}%`)
      .order("created_at", { ascending: false }) // Los más recientes primero
      .limit(50); // Limitamos para rapidez

    // --- DEDUPLICACIÓN ---
    // Como un cliente manual puede tener 20 reservas pasadas,
    // usamos un Map para devolver solo uno único por nombre.
    const uniqueMap = new Map();

    manuales?.forEach((m) => {
      if (m.cliente_nombre) {
        // Normalizamos el nombre para evitar "Juan" y "juan" duplicados
        const key = m.cliente_nombre.trim().toLowerCase();

        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, {
            id: `man-${key}`, // ID temporal para que React no se queje
            nombre: m.cliente_nombre.trim(),
            telefono: m.cliente_telefono || "",
            email: m.cliente_email || "",
            tipo: "manual", // Badge para diferenciar visualmente
          });
        }
      }
    });

    const results = Array.from(uniqueMap.values());

    // NOTA: Si en el futuro quieres buscar también usuarios web,
    // aquí agregaríamos el `if (type !== 'manual') { ... buscar en profiles ... }`
    // pero por ahora, tu requisito es ESTRICTAMENTE manuales.

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error en búsqueda de clientes:", error);
    return NextResponse.json({ results: [] });
  }
}
