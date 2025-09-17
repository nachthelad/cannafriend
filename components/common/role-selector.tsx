"use client";

import { useId } from "react";
import type { Roles } from "@/types";
import { cn } from "@/lib/utils";

interface RoleSelectorProps {
  value: Roles;
  onChange: (roles: Roles) => void;
  growerLabel: string;
  consumerLabel: string;
  className?: string;
  optionClassName?: string;
}

export function RoleSelector({
  value,
  onChange,
  growerLabel,
  consumerLabel,
  className,
  optionClassName,
}: RoleSelectorProps) {
  const growerId = useId();
  const consumerId = useId();

  const handleToggle = (role: keyof Roles, checked: boolean) => {
    onChange({
      ...value,
      [role]: checked,
    });
  };

  return (
    <div className={cn("space-y-3", className)}>
      <label
        htmlFor={growerId}
        className={cn("flex items-center gap-3 cursor-pointer", optionClassName)}
      >
        <input
          id={growerId}
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-2"
          checked={Boolean(value.grower)}
          onChange={(event) => handleToggle("grower", event.target.checked)}
        />
        <span className="text-sm font-medium">{growerLabel}</span>
      </label>
      <label
        htmlFor={consumerId}
        className={cn("flex items-center gap-3 cursor-pointer", optionClassName)}
      >
        <input
          id={consumerId}
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-2"
          checked={Boolean(value.consumer)}
          onChange={(event) => handleToggle("consumer", event.target.checked)}
        />
        <span className="text-sm font-medium">{consumerLabel}</span>
      </label>
    </div>
  );
}
