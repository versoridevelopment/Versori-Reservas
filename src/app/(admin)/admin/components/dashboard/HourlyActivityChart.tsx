"use client";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

export function HourlyActivityChart({ data }: { data: any[] }) {
  return (
    <div className="h-[200px] w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#f1f5f9"
          />
          <XAxis
            dataKey="name"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#94a3b8" }}
          />
          <Tooltip
            cursor={{ fill: "#f8fafc" }}
            contentStyle={{
              borderRadius: "8px",
              border: "none",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            }}
          />
          <Bar dataKey="reservas" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              // Color más intenso para las horas con más reservas
              <Cell
                key={`cell-${index}`}
                fill={entry.reservas > 5 ? "#6366f1" : "#a5b4fc"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
