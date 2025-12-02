"use client";

export function TransactionsTable() {
  const transacciones = [
    {
      id: 1,
      nombre: "Pago de Carlos Gómez",
      fecha: "18 Oct 2025",
      monto: "$2000",
    },
    {
      id: 2,
      nombre: "Pago de María López",
      fecha: "19 Oct 2025",
      monto: "$1500",
    },
    { id: 3, nombre: "Reembolso #00910", fecha: "19 Oct 2025", monto: "-$300" },
  ];

  return (
    <div className="bg-white shadow rounded-xl p-4">
      <h2 className="text-lg font-semibold mb-3">Últimas transacciones</h2>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b text-sm text-gray-500">
            <th className="py-2">Transacción</th>
            <th className="py-2">Fecha</th>
            <th className="py-2 text-right">Monto</th>
          </tr>
        </thead>
        <tbody>
          {transacciones.map((t) => (
            <tr key={t.id} className="border-b hover:bg-gray-50">
              <td className="py-2">{t.nombre}</td>
              <td className="py-2">{t.fecha}</td>
              <td className="py-2 text-right font-medium">{t.monto}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
