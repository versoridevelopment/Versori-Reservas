"use client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { dia: "Lun", reservas: 5 },
  { dia: "Mar", reservas: 8 },
  { dia: "Mié", reservas: 7 },
  { dia: "Jue", reservas: 10 },
  { dia: "Vie", reservas: 9 },
  { dia: "Sáb", reservas: 6 },
  { dia: "Dom", reservas: 4 },
];

export function ChartReservas() {
  return (
    <div className="bg-white shadow rounded-xl p-4">
      <h2 className="text-lg font-semibold mb-2">Reservas por día</h2>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <XAxis dataKey="dia" />
          <YAxis />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="reservas"
            stroke="#2563eb"
            fill="#93c5fd"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
