import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface DataCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: "default" | "success" | "warning" | "destructive";
  href?: string;
  className?: string;
}

export function DataCard({
  label,
  value,
  icon: Icon,
  trend,
  trendValue,
  color = "default",
  href,
  className,
}: DataCardProps) {
  const colorClasses = {
    default: "text-muted-foreground bg-primary/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    destructive: "text-destructive bg-destructive/10",
  };

  const content = (
    <Card
      className={cn(
        "p-6 transition-all duration-200",
        href && "hover:shadow-md hover:border-primary/30 cursor-pointer active:scale-[0.99]",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {trend && trendValue && (
            <div className="flex items-center gap-1 text-sm">
              {trend === "up" && <TrendingUp className="h-4 w-4 text-success" />}
              {trend === "down" && <TrendingDown className="h-4 w-4 text-destructive" />}
              <span className={trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground"}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn("p-3 rounded-lg", colorClasses[color])}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
