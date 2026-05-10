const LEGAL_EFFECTIVE_DATE = "2026-05-10";

function parseEffectiveDate() {
  const [year, month, day] = LEGAL_EFFECTIVE_DATE.split("-").map(Number);

  return new Date(year, month - 1, day);
}

export function formatLegalEffectiveDate(locale: string) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(parseEffectiveDate());
}

export { LEGAL_EFFECTIVE_DATE };
