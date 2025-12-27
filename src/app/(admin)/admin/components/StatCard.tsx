import { ArrowUpRight, ArrowDownRight, LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean; // true = verde, false = rojo
  description?: string;
  color?: "blue" | "green" | "purple" | "orange";
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  description,
  color = "blue",
}: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-500",
    green: "bg-green-500/10 text-green-500",
    purple: "bg-purple-500/10 text-purple-500",
    orange: "bg-orange-500/10 text-orange-500",
  };

  return (
    <div className="bg-[#151a23] border border-white/5 p-6 rounded-2xl shadow-lg hover:border-white/10 transition-colors group">
      <div className="flex justify-between items-start mb-4">
        <div
          className={`p-3 rounded-xl ${colorClasses[color]} group-hover:scale-110 transition-transform`}
        >
          <Icon size={24} />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
              trendUp
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {trendUp ? (
              <ArrowUpRight size={14} />
            ) : (
              <ArrowDownRight size={14} />
            )}
            {trend}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
        {description && (
          <p className="text-slate-500 text-xs mt-2">{description}</p>
        )}
      </div>
    </div>
  );
}
