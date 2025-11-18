"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { AlertCircle, AlarmClock, Moon, Sun } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Reminder } from "@/types";
import type {
  EditReminderDialogProps,
  EditReminderFormData,
} from "@/types/common";
import {
  invalidateDashboardCache,
  invalidateRemindersCache,
} from "@/lib/suspense-cache";

// Form validation schema
const createEditReminderFormSchema = (t: any) =>
  z.object({
    selectedPlant: z.string().optional(),
    label: z
      .string()
      .min(1, t("titleRequired", { ns: "validation" }))
      .max(50, t("titleMaxLength", { ns: "validation" })),
    note: z
      .string()
      .max(200, t("descriptionMaxLength", { ns: "validation" }))
      .optional(),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).min(
      1,
      t("daysRequired", {
        ns: "validation",
        defaultValue: "Select at least one day",
      })
    ),
    timeOfDay: z
      .string()
      .min(
        1,
        t("timeRequired", { ns: "validation", defaultValue: "Pick a time" })
      ),
    isActive: z.boolean(),
  });

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getNextOccurrence(days: number[], timeOfDay: string): string {
  if (!days.length) return "";
  const [hours, minutes] = timeOfDay.split(":").map((v) => parseInt(v, 10));
  const now = new Date();
  for (let offset = 0; offset < 7; offset++) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + offset);
    if (!days.includes(candidate.getDay())) continue;
    candidate.setHours(hours ?? 0, minutes ?? 0, 0, 0);
    if (candidate.getTime() <= now.getTime()) continue;
    return candidate.toISOString();
  }
  // If we didn't find a future slot (time already passed today), schedule next week same weekday
  const candidate = new Date(now);
  candidate.setDate(now.getDate() + 7);
  candidate.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return candidate.toISOString();
}

function deriveTimeOfDay(reminder: Reminder | null): string {
  if (reminder?.timeOfDay) return reminder.timeOfDay;
  if (reminder?.nextReminder) {
    const date = new Date(reminder.nextReminder);
    if (!Number.isNaN(date.getTime())) {
      const h = `${date.getHours()}`.padStart(2, "0");
      const m = `${date.getMinutes()}`.padStart(2, "0");
      return `${h}:${m}`;
    }
  }
  return "09:00";
}

function deriveDays(reminder: Reminder | null): number[] {
  if (reminder?.daysOfWeek?.length) return reminder.daysOfWeek;
  if (reminder?.nextReminder) {
    const date = new Date(reminder.nextReminder);
    if (!Number.isNaN(date.getTime())) return [date.getDay()];
  }
  return [new Date().getDay()];
}

export function EditReminderDialog({
  reminder,
  plants,
  isOpen,
  onOpenChange,
  onReminderUpdated,
}: EditReminderDialogProps) {
  const { t } = useTranslation([
    "reminders",
    "common",
    "journal",
    "validation",
  ]);
  const { toast } = useToast();
  const { handleFirebaseError } = useErrorHandler();
  const [isUpdating, setIsUpdating] = useState(false);

  // Form schema with translations
  const editReminderFormSchema = useMemo(
    () => createEditReminderFormSchema(t),
    [t]
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditReminderFormData>({
    resolver: zodResolver(editReminderFormSchema),
    defaultValues: {
      selectedPlant: "",
      label: "",
      note: "",
      daysOfWeek: [new Date().getDay()],
      timeOfDay: "09:00",
      isActive: true,
    },
  });

  const selectedPlant = watch("selectedPlant");
  const timeOfDay = watch("timeOfDay");
  const daysOfWeek = watch("daysOfWeek");
  const isActive = watch("isActive");

  // Reset form when reminder changes or dialog opens
  useEffect(() => {
    if (reminder && isOpen) {
      reset({
        selectedPlant: reminder.plantId || "",
        label: reminder.label || reminder.title || "",
        note: reminder.note || reminder.description || "",
        daysOfWeek: deriveDays(reminder),
        timeOfDay: deriveTimeOfDay(reminder),
        isActive: reminder.isActive ?? true,
      });
    }
  }, [reminder, isOpen, reset]);

  const handleUpdateReminder = async (data: EditReminderFormData) => {
    if (!auth.currentUser || !reminder) return;

    const plant = plants.find((p) => p.id === data.selectedPlant);

    setIsUpdating(true);
    try {
      const reminderRef = doc(
        db,
        "users",
        auth.currentUser.uid,
        "reminders",
        reminder.id
      );

      const nextReminder = getNextOccurrence(data.daysOfWeek, data.timeOfDay);

      const updateData = {
        plantId: plant ? plant.id : null,
        plantName: plant ? plant.name : null,
        label: data.label,
        note: data.note || "",
        daysOfWeek: data.daysOfWeek,
        timeOfDay: data.timeOfDay,
        isActive: data.isActive,
        updatedAt: new Date().toISOString(),
        lastSentDate: reminder.lastSentDate ?? null,
        // Legacy compatibility fields (to be removed once consumers are migrated)
        type: "custom" as const,
        title: data.label,
        description: data.note || "",
        interval: 1,
        lastReminder: reminder.lastReminder ?? null,
        nextReminder: nextReminder || reminder.nextReminder || null,
      } as Partial<Reminder>;

      await updateDoc(reminderRef, updateData);

      invalidateRemindersCache(auth.currentUser.uid);
      invalidateDashboardCache(auth.currentUser.uid);

      toast({
        title: t("updated", { ns: "reminders" }),
        description: t("updatedMessage", { ns: "reminders" }),
      });

      onOpenChange(false);
      onReminderUpdated();
      reset();
    } catch (error: any) {
      handleFirebaseError(error, "updating reminder");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    reset();
  };

  if (!reminder) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("editReminder", { ns: "reminders" })}</DialogTitle>
          <DialogDescription>
            {t("editReminderDesc", { ns: "reminders" })}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleUpdateReminder)}
          className="space-y-4"
        >
          {/* Plant Selection */}
          <div className="space-y-2">
            <Label>{t("selectPlant", { ns: "reminders" })}</Label>
            <input
              type="hidden"
              {...register("selectedPlant")}
              value={selectedPlant || ""}
            />
            <Select
              value={selectedPlant}
              onValueChange={(v) => setValue("selectedPlant", v)}
            >
              <SelectTrigger
                className={`min-h-[44px] ${
                  errors.selectedPlant ? "border-destructive" : ""
                }`}
              >
                <SelectValue
                  placeholder={t("selectPlant", { ns: "reminders" })}
                />
              </SelectTrigger>
              <SelectContent>
                {plants.map((plant) => (
                  <SelectItem
                    key={plant.id}
                    value={plant.id}
                    className="min-h-[44px]"
                  >
                    {plant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.selectedPlant && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <p className="text-sm text-destructive font-medium">
                  {errors.selectedPlant.message}
                </p>
              </div>
            )}
          </div>

          {/* Label */}
          <div className="space-y-2">
            <Label>{t("customName", { ns: "reminders" })}</Label>
            <Input
              {...register("label")}
              placeholder={t("customTitle", { ns: "reminders" })}
              className={`min-h-[44px] ${
                errors.label ? "border-destructive" : ""
              }`}
            />
            {errors.label && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <p className="text-sm text-destructive font-medium">
                  {errors.label.message}
                </p>
              </div>
            )}
          </div>

          {/* Schedule */}
          <div className="space-y-3">
            <Label>{t("days", { ns: "reminders" })}</Label>
            <div className="flex flex-wrap gap-2">
              {DAY_LABELS.map((day, index) => {
                const dayIndex = index; // 0-6
                const selected = daysOfWeek?.includes(dayIndex);
                return (
                  <Button
                    key={day}
                    type="button"
                    variant={selected ? "default" : "outline"}
                    className="min-h-[36px] px-3"
                    onClick={() => {
                      const current = new Set(daysOfWeek || []);
                      if (current.has(dayIndex)) {
                        current.delete(dayIndex);
                      } else {
                        current.add(dayIndex);
                      }
                      setValue("daysOfWeek", Array.from(current).sort(), {
                        shouldValidate: true,
                      });
                    }}
                  >
                    {day}
                  </Button>
                );
              })}
            </div>
            {errors.daysOfWeek && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <p className="text-sm text-destructive font-medium">
                  {errors.daysOfWeek.message as string}
                </p>
              </div>
            )}
            <div className="space-y-1">
              <Label>{t("time", { ns: "reminders" })}</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="time"
                  step={300}
                  value={timeOfDay}
                  onChange={(e) =>
                    setValue("timeOfDay", e.target.value, {
                      shouldValidate: true,
                    })
                  }
                  className={`min-h-[44px] max-w-[180px] ${
                    errors.timeOfDay ? "border-destructive" : ""
                  }`}
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sun className="h-4 w-4" />
                  <span>
                    {t("morningHint", {
                      ns: "reminders",
                      defaultValue: "Morning times work best for watering.",
                    })}
                  </span>
                </div>
              </div>
              {errors.timeOfDay && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <p className="text-sm text-destructive font-medium">
                    {errors.timeOfDay.message}
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                <AlarmClock className="h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">
                    {t("active", { ns: "reminders" })}
                  </p>
                </div>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={(value) => setValue("isActive", value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUpdating}
            >
              {t("cancel", { ns: "common" })}
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating
                ? t("saving", { ns: "common" })
                : t("save", { ns: "common" })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
