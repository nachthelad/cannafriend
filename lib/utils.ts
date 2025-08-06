import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { format, parseISO, differenceInDays } from "date-fns";
import { es, enUS } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string with the correct locale
 * @param dateString - ISO date string
 * @param formatString - Date format string (e.g., "PPP", "PPP p")
 * @param language - Language code ("es" or "en")
 * @returns Formatted date string
 */
export function formatDateWithLocale(
  dateString: string,
  formatString: string = "PPP",
  language: string = "es"
): string {
  const date = parseISO(dateString);
  const locale = language === "es" ? es : enUS;

  return format(date, formatString, { locale });
}

/**
 * Format a date object with the correct locale
 * @param date - Date object
 * @param formatString - Date format string (e.g., "PPP", "PPP p")
 * @param language - Language code ("es" or "en")
 * @returns Formatted date string
 */
export function formatDateObjectWithLocale(
  date: Date,
  formatString: string = "PPP",
  language: string = "es"
): string {
  const locale = language === "es" ? es : enUS;

  return format(date, formatString, { locale });
}

/**
 * Get the start of day for a date (removes time component)
 * @param date - Date object
 * @returns Date object set to start of day
 */
export function getStartOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Calculate age in days from a start date to today
 * @param startDate - Start date (can be string or Date)
 * @returns Age in days (minimum 0)
 */
export function calculateAgeInDays(startDate: string | Date): number {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const today = new Date();

  return Math.max(
    0,
    differenceInDays(getStartOfDay(today), getStartOfDay(start)) + 1
  );
}
