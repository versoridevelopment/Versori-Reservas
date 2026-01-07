import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { encryptToken } from "@/lib/crypto/tokenCrypto";

export const runtime = "nodejs";

type Body = {
  id_club: number;
  modo?: "test" | "prod";
  access_token: string;
  public_key?: string | null;
};

async function assertClubAdmin(id_club: number, userId: string) {
  // Ajustá los nombres de rol a los tuyos reales
  const { data, error } = await supabaseAdmin
    .from("club_usuarios")
    .select("id_usuario, roles!inner(nombre)")
    .eq("id_club", id_club)
    .eq("id_usuario", userId)
    .in("roles.nombre", ["admin", "owner", "superadmin"])
    .limit(1);

  if (error) throw new Error(`Error validando rol: ${error.message}`);
  if (!data || data.length === 0) {
    return false;
  }
  return true;
}

export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: u, error: uErr } = await supabase.auth.getUser();
    if (uErr) return NextResponse.json({ error: "No se pudo validar sesión" }, { status: 401 });

    const userId = u?.user?.id ?? null;
    if (!userId) return NextResponse.json({ error: "Login requerido" }, { status: 401 });

    const body = (await req.json().catch(() => null)) as Body | null;
    const id_club = Number(body?.id_club);
    const modo = (body?.modo ?? "test") as "test" | "prod";
    const access_token = String(body?.access_token ?? "").trim();
    const public_key = body?.public_key ? String(body.public_key) : null;

    if (!id_club || Number.isNaN(id_club)) {
      return NextResponse.json({ error: "id_club inválido" }, { status: 400 });
    }
    if (!access_token || access_token.length < 20) {
      return NextResponse.json({ error: "access_token inválido" }, { status: 400 });
    }
    if (modo !== "test" && modo !== "prod") {
      return NextResponse.json({ error: "modo inválido" }, { status: 400 });
    }

    const ok = await assertClubAdmin(id_club, userId);
    if (!ok) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const enc = encryptToken(access_token);

    const { error } = await supabaseAdmin
      .from("club_mercadopago")
      .upsert(
        {
          id_club,
          modo,
          public_key,
          access_token_enc: enc.enc,
          access_token_iv: enc.iv,
          access_token_tag: enc.tag,
        },
        { onConflict: "id_club" }
      );

    if (error) {
      return NextResponse.json({ error: `Error guardando credenciales: ${error.message}` }, { status: 500 });
    }

    // Nunca devolver token ni enc en la respuesta
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error interno" }, { status: 500 });
  }
}
