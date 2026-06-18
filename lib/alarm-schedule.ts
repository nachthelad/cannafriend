export function getNextAlarmOccurrence(
  daysOfWeek: number[],
  timeOfDay: string,
  from = new Date(),
): number | null {
  if (daysOfWeek.length === 0 || !timeOfDay) {
    return null;
  }

  const [hours, minutes] = timeOfDay
    .split(":")
    .map((value) => Number.parseInt(value, 10));

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  for (let offset = 0; offset <= 7; offset += 1) {
    const candidate = new Date(from);
    candidate.setDate(from.getDate() + offset);

    if (!daysOfWeek.includes(candidate.getDay())) {
      continue;
    }

    candidate.setHours(hours, minutes, 0, 0);
    if (candidate.getTime() >= from.getTime()) {
      return candidate.getTime();
    }
  }

  return null;
}
