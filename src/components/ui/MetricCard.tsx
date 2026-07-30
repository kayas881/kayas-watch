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
  default: "text-zinc-400 bg-white/5",
  green: "text-emerald-500 bg-emerald-500/10",
  red: "text-red-500 bg-red-500/10",
  violet: "text-violet-500 bg-violet-500/10",
};

export function MetricCard({ title, value, icon: Icon, trend, color = "default" }: MetricCardProps) {
  return (
    <div className="glass p-6 rounded-2xl flex flex-col h-full hover:bg-zinc-900/80 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-medium text-zinc-400">{title}</h3>
        <div className={cn("p-2 rounded-lg", colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-auto">
        <p className="text-4xl font-semibold text-white tracking-tight">{value}</p>
        {trend && (
          <p className={cn(
            "text-sm mt-2 font-medium flex items-center gap-1",
            trend.isPositive ? "text-emerald-500" : "text-red-500"
          )}>
            {trend.isPositive ? "↑" : "↓"} {trend.value}
          </p>
        )}
      </div>
    </div>
  );
}
