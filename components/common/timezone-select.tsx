"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const COMMON_TIMEZONES = [
  "America/Argentina/Buenos_Aires",
  "America/Mexico_City",
  "America/Bogota",
  "America/Santiago",
  "America/Lima",
  "Europe/Madrid",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
] as const;

interface TimezoneSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  triggerClassName?: string;
}

export function TimezoneSelect({
  value,
  onChange,
  placeholder = "Select timezone",
  id,
  triggerClassName,
}: TimezoneSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {COMMON_TIMEZONES.map((tz) => (
          <SelectItem key={tz} value={tz}>
            {tz}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
