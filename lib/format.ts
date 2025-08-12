export type DateStyle = "short" | "medium" | "long";

export function formatDateTime(
  value: string | number | Date,
  style: DateStyle = "short"
) {
  const date = value instanceof Date ? value : new Date(value);
  const options: Intl.DateTimeFormatOptions =
    style === "long"
      ? {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }
      : style === "medium"
      ? {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }
      : {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        };
  return new Intl.DateTimeFormat(undefined, options).format(date);
}

// Returns a local-time-based YYYY-MM-DD string for reliable day comparisons
export function formatDateYmdLocal(value: string | number | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
