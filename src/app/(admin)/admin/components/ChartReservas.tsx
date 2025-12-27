"use client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Lun", reservas: 12 },
  { name: "Mar", reservas: 19 },
  { name: "Mié", reservas: 15 },
  { name: "Jue", reservas: 22 },
  { name: "Vie", reservas: 35 },
  { name: "Sáb", reservas: 48 },
  { name: "Dom", reservas: 40 },
];

export function ChartReservas() {
  return (
    <div className="bg-[#151a23] border border-white/5 p-6 rounded-2xl shadow-lg h-[400px]">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white">Actividad Semanal</h3>
        <p className="text-slate-500 text-sm">
          Reservas completadas en los últimos 7 días
        </p>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorReservas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#ffffff10"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              dx={-10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#334155",
                color: "#fff",
              }}
              itemStyle={{ color: "#fff" }}
            />
            <Area
              type="monotone"
              dataKey="reservas"
              stroke="#3b82f6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorReservas)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
