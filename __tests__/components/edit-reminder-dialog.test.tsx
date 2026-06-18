import { render } from "@testing-library/react";

import { EditReminderDialog } from "@/components/common/edit-reminder-dialog";
import type { Reminder } from "@/types";

const reminder: Reminder = {
  id: "alarm-1",
  label: "Riego",
  daysOfWeek: [0, 2, 4, 6],
  timeOfDay: "09:00",
  isActive: true,
  createdAt: "2026-06-17T12:00:00.000Z",
  updatedAt: "2026-06-17T12:00:00.000Z",
};

describe("EditReminderDialog", () => {
  it("renders weekday controls without duplicate React keys", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    render(
      <EditReminderDialog
        reminder={reminder}
        plants={[]}
        isOpen
        onOpenChange={jest.fn()}
        onReminderUpdated={jest.fn()}
      />,
    );

    const duplicateKeyWarnings = consoleError.mock.calls.filter(([message]) =>
      String(message).includes("same key"),
    );
    expect(duplicateKeyWarnings).toHaveLength(0);

    consoleError.mockRestore();
  });
});
