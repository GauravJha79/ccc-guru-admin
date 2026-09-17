import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "../../lib/utils";

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  accentColor?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = "from-lavender-500/20 to-purple-600/10",
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative p-5 rounded-2xl bg-background-card border border-dark-border overflow-hidden transition-all duration-200 glass-card-hover group",
        onClick && "cursor-pointer",
      )}
    >
      {/* Background Gradient Glow */}
      <div
        className={cn(
          "absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br opacity-20 blur-xl group-hover:opacity-40 transition-opacity",
          accentColor,
        )}
      />

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-dark-muted mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-extrabold text-dark-text tracking-tight">
            {value}
          </h3>
          {subtitle && <p className="text-xs text-dark-dim mt-1">{subtitle}</p>}
        </div>

        <div className="p-3 rounded-2xl bg-lavender-500/10 text-lavender-400 border border-lavender-500/20 shadow-glow-sm group-hover:scale-105 group-hover:border-lavender-400/40 transition-all">
          {icon}
        </div>
      </div>

      {trend && (
        <div className="mt-4 pt-3 border-t border-dark-border/60 flex items-center gap-1.5 text-xs">
          {trend.isPositive ? (
            <span className="flex items-center text-emerald-400 font-semibold gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              {trend.value}
            </span>
          ) : (
            <span className="flex items-center text-rose-400 font-semibold gap-0.5">
              <TrendingDown className="w-3.5 h-3.5" />
              {trend.value}
            </span>
          )}
          <span className="text-dark-dim">vs last month</span>
        </div>
      )}
    </div>
  );
};
