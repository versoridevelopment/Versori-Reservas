import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export const runtime = "nodejs";

function normalizePhone(input: string) {
  return String(input || "").replace(/\D/g, "");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const qRaw = searchParams.get("q") || "";
    const q = qRaw.trim();
    const id_club = Number(searchParams.get("id_club"));
    const type = (searchParams.get("type") || "").trim(); // "manual"

    if (!id_club || !Number.isFinite(id_club)) return NextResponse.json({ results: [] });
    if (q.length < 1) return NextResponse.json({ results: [] });

    // Por ahora: SOLO manuales (como venís usando)
    if (type && type !== "manual") return NextResponse.json({ results: [] });

    const qPhone = normalizePhone(q);

    // armamos OR: por nombre o por teléfono normalizado
    // - nombre: ilike
    // - telefono_normalizado: ilike si viene dígitos (sirve para buscar por parte del número)
    const orParts: string[] = [`nombre.ilike.%${q.replace(/%/g, "")}%`];

    if (qPhone.length >= 1) {
      orParts.push(`telefono_normalizado.ilike.%${qPhone}%`);
    }

    const { data, error } = await supabaseAdmin
      .from("clientes_manuales")
      .select("id_cliente, nombre, telefono, email")
      .eq("id_club", id_club)
      .eq("activo", true)
      .or(orParts.join(","))
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[clientes/search] error:", error.message);
      return NextResponse.json({ results: [] });
    }

    const results =
      (data || []).map((c) => ({
        id: String(c.id_cliente), // <- string para React key / tu type actual
        nombre: (c.nombre || "").trim(),
        telefono: c.telefono || "",
        email: c.email || "",
        tipo: "manual" as const,
      })) || [];

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Error en búsqueda de clientes:", err);
    return NextResponse.json({ results: [] });
  }
}
