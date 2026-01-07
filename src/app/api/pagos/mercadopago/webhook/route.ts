import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { getClubMpAccessToken } from "@/lib/mercadopago/getClubMpToken";

export const runtime = "nodejs";

/**
 * Webhook Mercado Pago (Checkout Pro)
 * - Nunca confiamos en body/query.
 * - Siempre consultamos el payment real en MP.
 * - Respondemos 200 SIEMPRE (MP reintenta si no).
 */

function jsonOk() {
  return NextResponse.json({ ok: true });
}

function num(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const sp = url.searchParams;

    // MP puede enviar:
    // v1: ?topic=payment&id=123
    // v2: body: { type: "payment", data: { id: "123" } }
    const topic = sp.get("topic") || sp.get("type");
    const idQ = sp.get("id");

    const body = await req.json().catch(() => null);
    const topicB = body?.type || body?.topic;
    const idB = body?.data?.id;

    const finalTopic = topic || topicB;
    const paymentIdRaw = idQ || idB;

    if (finalTopic !== "payment") return jsonOk();

    const mp_payment_id = num(paymentIdRaw);
    if (!mp_payment_id) return jsonOk();

    // 1) Idempotencia: si ya existe mp_payment_id guardado → ok
    const { data: already, error: aErr } = await supabaseAdmin
      .from("reservas_pagos")
      .select("id_pago")
      .eq("mp_payment_id", mp_payment_id)
      .maybeSingle();

    if (aErr) {
      console.error("[MP webhook] idempotencia error:", aErr);
      return jsonOk();
    }
    if (already?.id_pago) return jsonOk();

    // 2) Para TEST con un solo club/token:
    //    Elegimos el token del club "collector" del pago.
    //    Como todavía no sabemos el club, para tu escenario actual tomamos el token del club 1
    //    (si querés hacerlo multi-tenant real después, lo adaptamos con mp_preference_id/id_club en reservas_pagos)
    const CLUB_TEST_ID = 1; // <-- mientras probás con tu cuenta
    const { token } = await getClubMpAccessToken(CLUB_TEST_ID);

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${mp_payment_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const mpJson = await mpRes.json().catch(() => null);

    if (!mpRes.ok || !mpJson) {
      console.error("[MP webhook] Error consultando payment:", mpJson);
      return jsonOk();
    }

    const external_reference = mpJson.external_reference; // debe ser id_reserva
    const id_reserva = num(external_reference);
    if (!id_reserva) {
      console.error("[MP webhook] external_reference inválido:", external_reference);
      return jsonOk();
    }

    const payment_status: string = mpJson.status;
    const payment_status_detail: string = mpJson.status_detail;
    const transaction_amount = Number(mpJson.transaction_amount || 0);

    // 3) Buscar pago DB para esa reserva (el más reciente created/pending)
    const { data: pago, error: pagoErr } = await supabaseAdmin
      .from("reservas_pagos")
      .select("*")
      .eq("id_reserva", id_reserva)
      .in("status", ["created", "pending"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pagoErr || !pago) {
      console.error("[MP webhook] pago db no encontrado para reserva:", id_reserva, pagoErr);
      return jsonOk();
    }

    // Validar monto (anticipo)
    const amountDb = Number(pago.amount || 0);
    if (!Number.isFinite(amountDb) || amountDb <= 0) {
      console.error("[MP webhook] amount DB inválido:", amountDb);
      return jsonOk();
    }

    // En MP a veces hay centavos/redondeos; si querés tolerancia:
    const diff = Math.abs(amountDb - transaction_amount);
    if (diff > 0.01) {
      console.error("[MP webhook] Monto no coincide", { amountDb, transaction_amount });
      return jsonOk();
    }

    // 4) Actualizar reservas_pagos
    const { error: upErr } = await supabaseAdmin
      .from("reservas_pagos")
      .update({
        mp_payment_id,
        mp_status: payment_status,
        mp_status_detail: payment_status_detail,
        status: payment_status === "approved" ? "approved" : payment_status,
        last_event_at: new Date().toISOString(),
        raw: mpJson,
      })
      .eq("id_pago", pago.id_pago);

    if (upErr) {
      console.error("[MP webhook] Error update reservas_pagos:", upErr);
      return jsonOk();
    }

    // 5) Confirmar / Rechazar reserva según status
    if (payment_status === "approved") {
      await supabaseAdmin
        .from("reservas")
        .update({
          estado: "confirmada",
          confirmed_at: new Date().toISOString(),
        })
        .eq("id_reserva", id_reserva)
        .eq("estado", "pendiente_pago");
    } else if (payment_status === "rejected" || payment_status === "cancelled") {
      await supabaseAdmin
        .from("reservas")
        .update({
          estado: "rechazada",
        })
        .eq("id_reserva", id_reserva)
        .eq("estado", "pendiente_pago");
    }

    return jsonOk();
  } catch (e: any) {
    console.error("[MP webhook] ex:", e);
    return jsonOk();
  }
}
