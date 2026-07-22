import { Link } from "wouter";

export function StatCard({
  label,
  value,
  icon,
  to,
  highlight,
}: {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  to?: string;
  /** When true, renders the number in terracotta (useful for counts that need attention). */
  highlight?: boolean;
}) {
  const inner = (
    <div className="flex flex-col gap-3 rounded-xl border border-paper-300 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {icon && <div className="text-terracotta-500">{icon}</div>}
      <div className={`font-display text-3xl font-extrabold leading-none ${highlight ? "text-terracotta-500" : "text-ink-900"}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className="text-sm font-medium text-ink-700/70">{label}</div>
    </div>
  );

  if (to) {
    return (
      <Link href={to} className="no-underline">
        {inner}
      </Link>
    );
  }
  return inner;
}
