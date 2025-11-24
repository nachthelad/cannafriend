import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
    icon?: LucideIcon;
  };
  className?: string;
}

import Link from "next/link";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mb-4 p-4 rounded-full bg-muted/50">
          <Icon className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          {description}
        </p>
      )}
      {action &&
        (action.href ? (
          <Button asChild size="lg">
            <Link href={action.href}>
              {action.icon && <action.icon className="h-5 w-5 mr-2" />}
              {action.label}
            </Link>
          </Button>
        ) : (
          <Button onClick={action.onClick} size="lg">
            {action.icon && <action.icon className="h-5 w-5 mr-2" />}
            {action.label}
          </Button>
        ))}
    </div>
  );
}
