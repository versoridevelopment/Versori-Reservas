"use client";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export function PaymentStatusPie({ data }: { data: any[] }) {
  const COLORS = ["#10b981", "#f43f5e"]; // Verde (Cobrado), Rojo (Pendiente)

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          {/* CORRECCIÓN: Usamos (value: any) para evitar el error de TypeScript */}
          <Tooltip
            formatter={(value: any) => `$${Number(value).toLocaleString()}`}
          />
          <Legend verticalAlign="bottom" iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
