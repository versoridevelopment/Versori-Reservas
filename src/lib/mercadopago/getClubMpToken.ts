import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { decryptToken } from "@/lib/crypto/tokenCrypto";

export async function getClubMpAccessToken(id_club: number) {
  const { data, error } = await supabaseAdmin
    .from("club_mercadopago")
    .select("modo, access_token_enc, access_token_iv, access_token_tag")
    .eq("id_club", id_club)
    .maybeSingle();

  if (error) throw new Error(`Error leyendo credenciales MP: ${error.message}`);
  if (!data) throw new Error("El club no configuró Mercado Pago");
  if (!data.access_token_enc || !data.access_token_iv || !data.access_token_tag) {
    throw new Error("Credenciales MP incompletas");
  }

  const token = decryptToken({
    enc: data.access_token_enc,
    iv: data.access_token_iv,
    tag: data.access_token_tag,
  });

  return { token, modo: data.modo as "test" | "prod" };
}
