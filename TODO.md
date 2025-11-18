## Reminders Alarm Rewrite To‑Do

- [x] Update reminder data model/types to alarm format (label, note, plant link, daysOfWeek, timeOfDay, isActive, lastSentDate) and remove legacy interval/type usage.
- [x] Rework create/edit UI for reminders to use days-of-week chips, time picker, label/note, plant selection; drop type/interval fields.
- [x] Update list displays (desktop/mobile) to show alarm schedule (days/time) and support edit/delete/activate with new fields.
- [x] Revise cron `/api/cron/check-reminders` logic to trigger alarms by weekday/time and mark `lastSentDate`; remove legacy nextReminder flow.
- [x] Migrate/clean existing reminder docs (delete legacy reminders) and show one-time modal informing users to recreate their reminders.
- [ ] Validate push flow still works with new payloads and adjust tests/manual steps to verify (set alarm a few minutes ahead and run cron). 
