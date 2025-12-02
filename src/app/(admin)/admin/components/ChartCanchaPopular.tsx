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
  { cancha: "Cancha 1", reservas: 12 },
  { cancha: "Cancha 2", reservas: 24 },
  { cancha: "Cancha 3", reservas: 8 },
];

export function ChartCanchaPopular() {
  return (
    <div className="bg-white shadow rounded-xl p-4">
      <h2 className="text-lg font-semibold mb-2">Cancha más reservada</h2>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <XAxis dataKey="cancha" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="reservas" fill="#0d1b2a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
