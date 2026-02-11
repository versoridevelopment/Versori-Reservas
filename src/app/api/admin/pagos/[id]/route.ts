import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const pagoId = Number(id);

    if (isNaN(pagoId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // 1. Obtener el Pago plano
    const { data: pago, error: pagoErr } = await supabaseAdmin
      .from("reservas_pagos")
      .select("*")
      .eq("id_pago", pagoId)
      .maybeSingle();

    if (pagoErr || !pago) {
      return NextResponse.json(
        { error: "Pago no encontrado" },
        { status: 404 },
      );
    }

    const clubId = pago.id_club || 9;

    // 2. Obtener la Reserva asociada
    const { data: reserva, error: resErr } = await supabaseAdmin
      .from("reservas")
      .select(
        "id_reserva, fecha, inicio, fin, precio_total, id_usuario, id_cliente_manual, id_cancha",
      )
      .eq("id_reserva", pago.id_reserva)
      .maybeSingle();

    if (resErr || !reserva) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 },
      );
    }

    // 3. Consultas paralelas para evitar errores de relación (Foreign Keys)
    const [clubRes, canchaRes, clienteWebRes, clienteManualRes] =
      await Promise.all([
        supabaseAdmin
          .from("clubes")
          .select(
            `
        nombre,
        contacto (
          telefono ( numero ),
          direccion ( calle, altura_calle, barrio )
        )
      `,
          )
          .eq("id_club", clubId)
          .single(),

        supabaseAdmin
          .from("canchas")
          .select("nombre")
          .eq("id_cancha", reserva.id_cancha)
          .single(),

        reserva.id_usuario
          ? supabaseAdmin
              .from("profiles")
              .select("nombre, apellido, email, telefono")
              .eq("id_usuario", reserva.id_usuario)
              .single()
          : Promise.resolve({ data: null }),

        reserva.id_cliente_manual
          ? supabaseAdmin
              .from("clientes_manuales")
              .select("nombre, email, telefono")
              .eq("id_cliente", reserva.id_cliente_manual)
              .single()
          : Promise.resolve({ data: null }),
      ]);

    // 4. Procesar Datos del Club para el encabezado del ticket
    const clubRaw: any = clubRes.data;
    const contacto: any = Array.isArray(clubRaw?.contacto)
      ? clubRaw?.contacto[0]
      : clubRaw?.contacto;
    const dirData = Array.isArray(contacto?.direccion)
      ? contacto?.direccion[0]
      : contacto?.direccion;
    const telData = Array.isArray(contacto?.telefono)
      ? contacto?.telefono[0]
      : contacto?.telefono;

    const clubInfo = {
      nombre: clubRaw?.nombre || "Club Deportivo",
      direccion: dirData
        ? `${dirData.calle} ${dirData.altura_calle}${dirData.barrio ? `, ${dirData.barrio}` : ""}`
        : "Dirección no disponible",
      telefono: telData?.numero || "",
    };

    // 5. Identidad del Cliente LIMPIA (Sin sufijos "Web" o "Manual")
    let clienteData = {
      nombre: "Invitado",
      apellido: "",
      email: "-",
      telefono: "-",
    };

    if (reserva.id_usuario && clienteWebRes.data) {
      clienteData = {
        nombre: clienteWebRes.data.nombre || "Usuario",
        apellido: clienteWebRes.data.apellido || "", // ❌ Eliminado sufijo "Web"
        email: clienteWebRes.data.email || "-",
        telefono: clienteWebRes.data.telefono || "-",
      };
    } else if (reserva.id_cliente_manual && clienteManualRes.data) {
      clienteData = {
        nombre: clienteManualRes.data.nombre || "Cliente",
        apellido: "", // ❌ Eliminado sufijo "Manual"
        email: clienteManualRes.data.email || "-",
        telefono: clienteManualRes.data.telefono || "-",
      };
    }

    // 6. Respuesta para el Frontend
    return NextResponse.json({
      id_pago: pago.id_pago,
      status: pago.status,
      amount: Number(pago.amount),
      mp_payment_id: pago.mp_payment_id?.toString() || "N/A",
      created_at: pago.created_at,
      approved_at: pago.updated_at,
      method: pago.provider === "mercadopago" ? "Mercado Pago" : "Efectivo",
      club: clubInfo,
      cliente: clienteData,
      reserva: {
        id_reserva: reserva.id_reserva,
        fecha: reserva.fecha,
        inicio: reserva.inicio,
        fin: reserva.fin,
        cancha: canchaRes.data?.nombre || "Cancha",
        precio_total_reserva: Number(reserva.precio_total || 0),
      },
    });
  } catch (error: any) {
    console.error("Error en Ticket de Pago:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
