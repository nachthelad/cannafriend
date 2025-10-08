"use client";

import type { AmountWithUnitProps } from "@/types/common";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AmountWithUnit({
  inputId,
  placeholder,
  inputProps,
  defaultUnit = "ml",
  unitOptions,
  onUnitChange,
}: AmountWithUnitProps) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-2">
      <Input id={inputId} placeholder={placeholder} {...inputProps} />
      <Select onValueChange={onUnitChange} defaultValue={defaultUnit}>
        <SelectTrigger className="min-h-[48px] w-[110px]">
          <SelectValue placeholder={defaultUnit} />
        </SelectTrigger>
        <SelectContent>
          {unitOptions.map((u) => (
            <SelectItem key={u.value} value={u.value}>
              {u.label ?? u.value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
