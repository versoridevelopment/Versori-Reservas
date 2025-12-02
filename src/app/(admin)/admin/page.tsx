"use client";

import { useState } from "react";
import { StatCard } from "./components/StatCard";
import { ChartReservas } from "./components/ChartReservas";
import { ChartCanchaPopular } from "././components/ChartCanchaPopular";
import { TransactionsTable } from "././components/TransactionsTable";
import { ROLE_PERMISSIONS, Rol } from "@/lib/roles";

export default function DashboardPage() {
  // Simulación de usuario con rol (reemplazar luego por session real)
  const [userRole] = useState<Rol>("Administrador"); // Cambiar a "Cajero" para probar
  const permisos = ROLE_PERMISSIONS[userRole];

  const stats = [
    { title: "Reservas esta semana", value: 42 },
    { title: "Clientes registrados", value: 123 },
    { title: "Cancha más reservada", value: "Cancha 2" },
  ];

  return (
    <div className="space-y-6">
      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <StatCard key={s.title} title={s.title} value={s.value} />
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ChartReservas />
          {userRole === "Administrador" && <ChartCanchaPopular />}
        </div>

        {/* Solo el administrador puede ver transacciones */}
        {userRole === "Administrador" && (
          <div>
            <TransactionsTable />
          </div>
        )}
      </div>
    </div>
  );
}
