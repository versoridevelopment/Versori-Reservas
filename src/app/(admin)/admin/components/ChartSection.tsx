// src/app/admin/components/ChartSection.tsx
"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { semana: "Semana 1", reservas: 12, pagos: 480 },
  { semana: "Semana 2", reservas: 18, pagos: 620 },
  { semana: "Semana 3", reservas: 9, pagos: 390 },
  { semana: "Semana 4", reservas: 22, pagos: 870 },
];

export function ChartSection() {
  return (
    <div className="bg-white shadow rounded-xl p-4">
      <h2 className="text-lg font-semibold mb-2">📊 Actividad mensual</h2>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <XAxis dataKey="semana" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="reservas" fill="#0d1b2a" />
          <Bar dataKey="pagos" fill="#1b263b" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
