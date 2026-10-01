import type { LucideIcon } from "lucide-react";

export function StatCard({ label, value, detail, icon: Icon, tone = "default" }: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "default" | "blue" | "green" | "amber";
}) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="stat-top"><span>{label}</span><div className="stat-icon"><Icon size={18} /></div></div>
      <div className="stat-value">{value}</div>
      <div className="stat-detail">{detail}</div>
    </div>
  );
}
