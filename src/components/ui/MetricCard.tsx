import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: "default" | "green" | "red" | "violet";
}

const colorMap = {
  default: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  green: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  red: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  violet: "text-purple-400 bg-purple-500/10 border-purple-500/20",
};

const cardBorderMap = {
  default: "border-blue-500/20 hover:border-blue-500/40",
  green: "border-emerald-500/20 hover:border-emerald-500/40",
  red: "border-rose-500/30 hover:border-rose-500/50 shadow-rose-950/20",
  violet: "border-purple-500/30 hover:border-purple-500/50 shadow-purple-950/20",
};

export function MetricCard({ title, value, icon: Icon, trend, color = "default" }: MetricCardProps) {
  return (
    <div className={cn(
      "saral-glass-card p-6 rounded-2xl flex flex-col h-full transition-all duration-300 hover:scale-[1.02]",
      cardBorderMap[color]
    )}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-300 tracking-wide uppercase">{title}</h3>
        <div className={cn("p-2.5 rounded-xl border shadow-inner", colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-auto">
        <p className="text-4xl font-extrabold text-white tracking-tight">{value}</p>
        {trend && (
          <p className={cn(
            "text-xs mt-2 font-bold flex items-center gap-1 uppercase tracking-wider",
            trend.isPositive ? "text-emerald-400" : "text-rose-400"
          )}>
            {trend.isPositive ? "↑" : "↓"} {trend.value}
          </p>
        )}
      </div>
    </div>
  );
}
