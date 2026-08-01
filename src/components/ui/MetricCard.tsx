import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subStat?: {
    label: string;
    value: string | number;
    color?: "green" | "red" | "amber" | "zinc";
  };
  href?: string;
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
  red: "border-rose-500/30 hover:border-rose-500/50",
  violet: "border-purple-500/30 hover:border-purple-500/50",
};

const subStatColorMap = {
  green: "text-emerald-400",
  red: "text-rose-400",
  amber: "text-amber-400",
  zinc: "text-zinc-400",
};

export function MetricCard({ title, value, icon: Icon, subStat, href, color = "default" }: MetricCardProps) {
  const inner = (
    <div className={cn(
      "saral-glass-card p-6 rounded-2xl flex flex-col h-full transition-all duration-300 hover:scale-[1.02]",
      cardBorderMap[color],
      href && "cursor-pointer"
    )}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-300 tracking-wide uppercase">{title}</h3>
        <div className={cn("p-2.5 rounded-xl border shadow-inner", colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-auto">
        <p className="text-4xl font-extrabold text-white tracking-tight">{value}</p>
        {subStat && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className={cn("text-sm font-bold", subStatColorMap[subStat.color ?? "zinc"])}>
              {subStat.value}
            </span>
            <span className="text-xs text-zinc-500 font-medium">{subStat.label}</span>
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block h-full">{inner}</Link>;
  }
  return inner;
}
