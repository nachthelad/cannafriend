"use client";

import type { ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TimeFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function TimeField({
  value,
  onChange,
  placeholder = "HH:MM",
  className,
}: TimeFieldProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;

    // Allow partial input for better UX - including 1-4 digits without colon for auto-formatting
    if (inputValue === '' ||
        /^[0-9]{1,4}$/.test(inputValue) || // 1-4 digits (e.g., "1", "14", "223", "2230")
        /^([0-1]?[0-9]|2[0-3])$/.test(inputValue) || // Hours only (e.g., "1", "14", "23")
        /^([0-1]?[0-9]|2[0-3]):$/.test(inputValue) || // Hours with colon (e.g., "14:")
        /^([0-1]?[0-9]|2[0-3]):[0-5]?[0-9]?$/.test(inputValue)) { // Partial or complete HH:MM
      onChange(inputValue);
    }
  };

  const handleBlur = () => {
    // Format the time when user leaves the field
    if (!value) return;

    if (value.includes(':')) {
      const [hours, minutes] = value.split(':');
      const h = parseInt(hours, 10);
      const m = parseInt(minutes || '0', 10);

      if (!isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        const formattedTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        if (formattedTime !== value) {
          onChange(formattedTime);
        }
      }
    } else {
      // Handle cases without colon
      const digits = value.replace(/\D/g, ''); // Remove non-digits

      if (digits.length === 1 || digits.length === 2) {
        // 1-2 digits: treat as hours (e.g., "1" -> "01:00", "14" -> "14:00")
        const h = parseInt(digits, 10);
        if (!isNaN(h) && h >= 0 && h <= 23) {
          onChange(`${h.toString().padStart(2, '0')}:00`);
        }
      } else if (digits.length === 3) {
        // 3 digits: first digit is hour, last two are minutes (e.g., "130" -> "01:30")
        const h = parseInt(digits.charAt(0), 10);
        const m = parseInt(digits.slice(1), 10);
        if (!isNaN(h) && !isNaN(m) && h >= 0 && h <= 9 && m >= 0 && m <= 59) {
          onChange(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        }
      } else if (digits.length === 4) {
        // 4 digits: first two are hours, last two are minutes (e.g., "2230" -> "22:30")
        const h = parseInt(digits.slice(0, 2), 10);
        const m = parseInt(digits.slice(2), 10);
        if (!isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
          onChange(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        }
      }
    }
  };

  return (
    <Input
      type="text"
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={cn("w-20 text-center", className)}
      maxLength={5}
    />
  );
}
