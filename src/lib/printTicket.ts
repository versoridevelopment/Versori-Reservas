// src/lib/printTicket.ts

export interface TicketData {
  id_reserva: number;
  club_nombre?: string | null;
  club_direccion?: string | null;
  cliente_nombre?: string | null;
  cancha_nombre?: string | null;
  fecha: string | null;
  inicio: string | null;
  fin: string | null;
  fin_dia_offset?: 0 | 1 | null;
  precio_total: number | null;
  pagado: number | null;
  saldo: number | null;
}

export function printReservaTicket(data: TicketData) {
  const printWindow = window.open("", "PRINT", "height=650,width=450");

  if (!printWindow) {
    alert("Por favor habilita las ventanas emergentes para imprimir.");
    return;
  }

  // Helpers de formato internos
  const fmt = (n: number | null | undefined) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(Number(n || 0));

  const fechaImpresion = new Date().toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const fechaReserva = data.fecha
    ? new Date(data.fecha + "T12:00:00").toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "-";

  const horario = `${data.inicio?.slice(0, 5)} - ${data.fin?.slice(0, 5)}${
    data.fin_dia_offset ? " (+1)" : ""
  }`;

  printWindow.document.write(`
    <html>
      <head>
        <title>Ticket #${data.id_reserva}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap');
          body { font-family: 'Roboto Mono', monospace; padding: 15px; margin: 0; background: #fff; color: #000; font-size: 12px; }
          .ticket { width: 100%; max-width: 300px; margin: 0 auto; }
          @media print { @page { margin: 0; } body { padding: 0; } button { display: none; } }
          .text-center { text-align: center; } 
          .text-right { text-align: right; } 
          .font-bold { font-weight: 700; }
          .text-lg { font-size: 16px; } 
          .text-xl { font-size: 18px; } 
          .uppercase { text-transform: uppercase; }
          .divider { border-top: 1px dashed #000; margin: 12px 0; }
          .double-divider { border-top: 3px double #000; margin: 12px 0; }
          .row { display: flex; justify-content: space-between; margin-bottom: 6px; }
          .box { border: 2px solid #000; padding: 8px; margin: 15px 0; text-align: center; }
          
          .club-header { margin-bottom: 15px; }
          .club-name { font-size: 16px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; }
          .club-address { font-size: 10px; color: #444; }
        </style>
      </head>
      <body>
        <div class="ticket">
          
          <div class="text-center club-header">
            <div class="club-name">${data.club_nombre || "Club Deportivo"}</div>
            <div class="club-address">${data.club_direccion || ""}</div>
          </div>

          <div class="divider"></div>

          <div class="text-center">
            <div class="font-bold text-xl uppercase">COMPROBANTE</div>
            <div style="font-size: 14px; margin-top: 4px;">Reserva #${data.id_reserva}</div>
            <div style="font-size: 10px; margin-top: 4px;">${fechaImpresion}</div>
          </div>

          <div class="double-divider"></div>

          <div class="row"><span>CLIENTE:</span><span class="font-bold text-right">${data.cliente_nombre || "Consumidor Final"}</span></div>
          <div class="row"><span>CANCHA:</span><span class="text-right">${data.cancha_nombre || "-"}</span></div>
          <div class="row"><span>FECHA:</span><span class="text-right">${fechaReserva}</span></div>
          <div class="row"><span>HORARIO:</span><span class="font-bold text-right">${horario}</span></div>
          
          <div class="divider"></div>
          
          <div class="row"><span>Concepto</span><span class="text-right">Alquiler Cancha</span></div>
          <div class="row font-bold text-lg" style="margin-top: 8px;"><span>TOTAL:</span><span>${fmt(data.precio_total)}</span></div>
          
          <div class="divider"></div>
          
          <div class="row"><span>Pagado / Seña:</span><span>${fmt(data.pagado)}</span></div>
          
          <div class="box">
            <div style="font-size: 10px; margin-bottom: 4px;">SALDO PENDIENTE</div>
            <div class="font-bold text-xl">${fmt(data.saldo)}</div>
          </div>

          <div class="text-center" style="margin-top: 25px; font-size: 10px; color: #666;">
            <p style="margin:4px 0;">GRACIAS POR SU VISITA</p>
            <p style="margin:4px 0;">No válido como factura fiscal.</p>
          </div>
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}
