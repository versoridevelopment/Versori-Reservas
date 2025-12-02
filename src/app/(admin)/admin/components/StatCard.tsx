// src/app/admin/components/StatCard.tsx
export function StatCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="bg-white shadow rounded-xl p-4 flex flex-col justify-between">
      <span className="text-sm text-gray-500">{title}</span>
      <span className="text-2xl font-bold text-gray-800">{value}</span>
    </div>
  );
}
