import { LucideIcon } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  suffix?: string;
  trend: string;
  trendUp: boolean;
  accentClass: string;
  decimals?: number;
}

export function StatCard({ icon: Icon, label, value, suffix, trend, trendUp, accentClass, decimals = 0 }: StatCardProps) {
  const animatedValue = useCountUp(value, 1200, decimals);

  return (
    <div className="bg-card rounded-lg p-5 card-hover min-w-[200px] flex-1">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", accentClass)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-heading font-bold count-up">
        {decimals > 0 ? animatedValue.toFixed(decimals) : animatedValue.toLocaleString()}
        {suffix}
      </p>
      <div className="flex items-center gap-1 mt-2">
        <span className={cn("text-xs font-semibold", trendUp ? "text-success" : "text-destructive")}>
          {trendUp ? "↑" : "↓"} {trend}
        </span>
        <span className="text-xs text-muted-light">vs last month</span>
      </div>
    </div>
  );
}
