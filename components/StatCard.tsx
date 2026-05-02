export function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number | string;
  color: "green" | "orange" | "blue" | "purple" | "red" | "teal";
  icon: React.ReactNode;
}) {
  const colorMap = {
    green: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-500",
    blue: "bg-blue-50 text-blue-500",
    purple: "bg-purple-50 text-purple-500",
    red: "bg-rose-50 text-rose-500",
    teal: "bg-teal-50 text-teal-500",
  };

  return (
    <div className="flex items-center gap-4 rounded-xl border border-zinc-100 bg-white px-5 py-5 shadow-sm">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold text-zinc-900">{value}</p>
      </div>
      <div
        className={`ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colorMap[color]}`}
      >
        {icon}
      </div>
    </div>
  );
}
