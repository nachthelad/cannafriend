import { getNextAlarmOccurrence } from "@/lib/alarm-schedule";

describe("getNextAlarmOccurrence", () => {
  it("wraps a weekly alarm to next week when today's time already passed", () => {
    const from = new Date("2026-06-17T15:00:00");
    const next = getNextAlarmOccurrence(
      [from.getDay()],
      "09:00",
      from,
    );

    expect(next).not.toBeNull();
    const nextDate = new Date(next!);
    expect(nextDate.getDay()).toBe(from.getDay());
    expect(nextDate.getDate()).toBe(from.getDate() + 7);
    expect(nextDate.getHours()).toBe(9);
  });

  it("returns today's occurrence when it is still in the future", () => {
    const from = new Date("2026-06-17T08:00:00");
    const next = getNextAlarmOccurrence(
      [from.getDay()],
      "09:00",
      from,
    );

    expect(next).toBe(new Date("2026-06-17T09:00:00").getTime());
  });
});
