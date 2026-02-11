import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id_club = searchParams.get("id_club") || 9;

    const { data: pagos, error: pagosError } = await supabaseAdmin
      .from("reservas_pagos")
      .select(
        "id_pago, id_reserva, mp_payment_id, amount, status, created_at, provider",
      )
      .eq("id_club", id_club)
      .order("created_at", { ascending: false });

    if (pagosError) throw pagosError;
    if (!pagos || pagos.length === 0)
      return NextResponse.json({ ok: true, pagos: [] });

    const idsReserva = Array.from(
      new Set(pagos.map((p) => p.id_reserva).filter(Boolean)),
    );

    const { data: reservas, error: resError } = await supabaseAdmin
      .from("reservas")
      .select("id_reserva, id_usuario, id_cliente_manual")
      .in("id_reserva", idsReserva);

    if (resError) throw resError;

    const idsUsuarios = Array.from(
      new Set(reservas?.map((r) => r.id_usuario).filter(Boolean)),
    );
    const idsManuales = Array.from(
      new Set(reservas?.map((r) => r.id_cliente_manual).filter(Boolean)),
    );

    const [profilesRes, manualesRes] = await Promise.all([
      idsUsuarios.length > 0
        ? supabaseAdmin
            .from("profiles")
            .select("id_usuario, nombre, apellido, email")
            .in("id_usuario", idsUsuarios)
        : Promise.resolve({ data: [] }),
      idsManuales.length > 0
        ? supabaseAdmin
            .from("clientes_manuales")
            .select("id_cliente, nombre, email")
            .in("id_cliente", idsManuales)
        : Promise.resolve({ data: [] }),
    ]);

    const profilesMap = new Map(
      profilesRes.data?.map((p) => [p.id_usuario, p]),
    );
    const manualesMap = new Map(
      manualesRes.data?.map((m) => [m.id_cliente, m]),
    );

    const pagosFormateados = pagos.map((p) => {
      const res = reservas?.find((r) => r.id_reserva === p.id_reserva);
      let cliente = { nombre: "Invitado", apellido: "", email: "" };

      if (res) {
        if (res.id_usuario) {
          const prof = profilesMap.get(res.id_usuario);
          if (prof) {
            cliente = {
              nombre: prof.nombre || "Usuario",
              apellido: prof.apellido || "", // ❌ Eliminado sufijo "Web"
              email: prof.email || "",
            };
          }
        } else if (res.id_cliente_manual) {
          const man = manualesMap.get(res.id_cliente_manual);
          if (man) {
            cliente = {
              nombre: man.nombre || "Cliente",
              apellido: "", // ❌ Eliminado sufijo "Manual"
              email: man.email || "",
            };
          }
        }
      }

      return {
        id_pago: p.id_pago,
        mp_payment_id: p.mp_payment_id || "N/A",
        monto: Number(p.amount),
        estado: p.status,
        fecha: p.created_at,
        metodo_detalle:
          p.provider === "mercadopago" ? "Mercado Pago" : "Efectivo",
        cliente,
      };
    });

    return NextResponse.json({ ok: true, pagos: pagosFormateados });
  } catch (error: any) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
