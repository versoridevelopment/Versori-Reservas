import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    // Soporte para ambos nombres de parámetro por si acaso
    const clubId = searchParams.get("id_club") || searchParams.get("clubId");

    if (!clubId) {
      return NextResponse.json(
        { error: "clubId es requerido" },
        { status: 400 },
      );
    }

    // 1. Obtener Usuarios, Perfiles y Roles
    // CORRECCIÓN: Quitamos 'created_at' y usamos 'updated_at' que sí existe en tu tabla profiles
    const { data: rawData, error: usersError } = await supabaseAdmin
      .from("club_usuarios")
      .select(
        `
        id_usuario,
        id_club,
        roles ( nombre ),
        profiles!inner (
          nombre,
          apellido,
          email,
          telefono,
          updated_at 
        )
      `,
      )
      .eq("id_club", clubId);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    // 2. Obtener última reserva
    const { data: reservasData, error: reservasError } = await supabaseAdmin
      .from("reservas")
      .select("id_usuario, fecha")
      .eq("id_club", clubId)
      .order("fecha", { ascending: false });

    if (reservasError) {
      console.warn(
        "Error fetching reservas (continuando sin fechas):",
        reservasError,
      );
    }

    // 3. Mapa de última reserva
    const lastReservaMap: Record<string, string> = {};
    if (reservasData) {
      for (const r of reservasData) {
        if (!lastReservaMap[r.id_usuario]) {
          lastReservaMap[r.id_usuario] = r.fecha;
        }
      }
    }

    // 4. Transformar y Agrupar Datos
    const usersMap = new Map<string, any>();

    for (const item of rawData || []) {
      // TypeScript safety casting
      const profile = item.profiles as any;
      const rolObj = item.roles as any; // Puede ser objeto o array dependiendo de la relación
      const rolName = rolObj?.nombre;

      const uid = item.id_usuario;

      if (!usersMap.has(uid)) {
        usersMap.set(uid, {
          id_club: Number(clubId),
          id_usuario: uid,
          nombre: profile.nombre || "",
          apellido: profile.apellido || "",
          email: profile.email || "",
          telefono: profile.telefono || null,
          // Usamos updated_at como fecha de referencia para el frontend,
          // o null si prefieres no mostrar fecha de creación.
          created_at: profile.updated_at,
          roles: [],
          es_profe: false,
          bloqueado: false,
          ultima_reserva: lastReservaMap[uid] || null,
        });
      }

      const userEntry = usersMap.get(uid);

      // Lógica para agregar roles sin duplicados
      if (rolName) {
        if (!userEntry.roles.includes(rolName)) {
          userEntry.roles.push(rolName);
        }
        if (rolName === "profe") {
          userEntry.es_profe = true;
        }
      }
    }

    const responseRows = Array.from(usersMap.values());

    // Ordenar por apellido
    responseRows.sort((a, b) => a.apellido.localeCompare(b.apellido));

    return NextResponse.json(responseRows);
  } catch (err: any) {
    console.error("[ADMIN GET /usuarios] error interno:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
