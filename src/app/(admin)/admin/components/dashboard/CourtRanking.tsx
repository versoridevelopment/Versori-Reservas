"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";

export function CourtRanking({ data }: { data: any[] }) {
  // Ordenar data (Mayor ingreso arriba)
  const sortedData = [...data].sort((a, b) => b.ingresos - a.ingresos);

  // Si no hay datos, mostrar mensaje vacío
  if (!sortedData.length) {
    return (
      <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">
        Sin datos
      </div>
    );
  }

  return (
    <div className="h-[250px] w-full overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
          barCategoryGap={20}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="#f1f5f9"
          />

          <XAxis type="number" hide />

          <YAxis
            dataKey="name"
            type="category"
            width={100}
            axisLine={false}
            tickLine={false}
            interval={0}
            tick={{
              fontSize: 11,
              fill: "#64748b",
              fontWeight: 600,
              textAnchor: "end",
              dx: -6,
            }}
          />

          <Tooltip
            cursor={{ fill: "#f8fafc", radius: 4 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-2 border border-slate-100 shadow-lg rounded-lg text-xs z-50">
                    <p className="font-bold text-slate-800 mb-1">{data.name}</p>
                    <div className="flex gap-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400">
                          Ingresos
                        </span>
                        <span className="font-bold text-green-600">
                          ${data.ingresos.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400">
                          Reservas
                        </span>
                        <span className="font-bold text-blue-600">
                          {data.reservas}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />

          <Bar
            dataKey="ingresos"
            radius={[0, 4, 4, 0]}
            barSize={20}
            // CORRECCIÓN: Agregamos 'as any' para silenciar el error de TypeScript
            background={{ fill: "#f8fafc", radius: [0, 4, 4, 0] as any }}
          >
            {sortedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index === 0 ? "#3b82f6" : "#94a3b8"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
