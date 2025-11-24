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
import {
  AlertCircle,
  AlarmClock,
  Moon,
  Sun,
  Calendar,
  Leaf,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

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

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-0 gap-0 overflow-hidden bg-card border-border">
        <DialogHeader className="p-6 pb-4 border-b border-border/50 bg-muted/30">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {t("editReminder", { ns: "reminders" })}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t("editReminderDesc", { ns: "reminders" })}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleUpdateReminder)}
          className="flex flex-col"
        >
          <div className="p-6 space-y-6">
            {/* Plant Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("selectPlant", { ns: "reminders" })}
              </Label>
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
                  className={cn(
                    "h-12 bg-background border-input/50 focus:ring-primary/20 transition-all",
                    errors.selectedPlant &&
                      "border-destructive focus:ring-destructive/20"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-primary/70" />
                    <SelectValue
                      placeholder={t("selectPlant", { ns: "reminders" })}
                    />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {plants.map((plant) => (
                    <SelectItem
                      key={plant.id}
                      value={plant.id}
                      className="h-10"
                    >
                      {plant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.selectedPlant && (
                <p className="text-xs text-destructive font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.selectedPlant.message}
                </p>
              )}
            </div>

            {/* Label */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("customName", { ns: "reminders" })}
              </Label>
              <div className="relative">
                <Input
                  {...register("label")}
                  placeholder={t("customTitle", { ns: "reminders" })}
                  className={cn(
                    "h-12 pl-10 bg-background border-input/50 focus:ring-primary/20 transition-all",
                    errors.label &&
                      "border-destructive focus:ring-destructive/20"
                  )}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <AlarmClock className="h-4 w-4" />
                </div>
              </div>
              {errors.label && (
                <p className="text-xs text-destructive font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.label.message}
                </p>
              )}
            </div>

            {/* Schedule Section */}
            <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-primary" />
                <h4 className="font-medium text-sm">
                  {t("schedule", { ns: "reminders", defaultValue: "Schedule" })}
                </h4>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-xs text-muted-foreground">
                    {t("days", { ns: "reminders" })}
                  </Label>
                  {errors.daysOfWeek && (
                    <span className="text-xs text-destructive font-medium">
                      {errors.daysOfWeek.message as string}
                    </span>
                  )}
                </div>

                <div className="flex justify-between gap-1">
                  {DAY_LABELS.map((day, index) => {
                    const dayIndex = index; // 0-6
                    const selected = daysOfWeek?.includes(dayIndex);
                    return (
                      <button
                        key={index}
                        type="button"
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
                        className={cn(
                          "h-9 w-9 rounded-full text-xs font-medium transition-all duration-200 flex items-center justify-center",
                          selected
                            ? "bg-primary text-primary-foreground shadow-sm scale-105"
                            : "bg-background border border-input hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                        )}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-border/50">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      {t("time", { ns: "reminders" })}
                    </Label>
                    <Input
                      type="time"
                      step={300}
                      value={timeOfDay}
                      onChange={(e) =>
                        setValue("timeOfDay", e.target.value, {
                          shouldValidate: true,
                        })
                      }
                      className={cn(
                        "h-10 bg-background border-input/50",
                        errors.timeOfDay && "border-destructive"
                      )}
                    />
                  </div>

                  <div className="flex flex-col justify-end space-y-2">
                    <div className="flex items-center justify-between h-10 px-3 rounded-md bg-background border border-input/50">
                      <span className="text-sm font-medium text-muted-foreground">
                        {t("active", { ns: "reminders" })}
                      </span>
                      <Switch
                        checked={isActive}
                        onCheckedChange={(value) => setValue("isActive", value)}
                        className="scale-75 origin-right"
                      />
                    </div>
                  </div>
                </div>
                {errors.timeOfDay && (
                  <p className="text-xs text-destructive font-medium mt-1">
                    {errors.timeOfDay.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-2 border-t border-border/50 bg-muted/10">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isUpdating}
              className="hover:bg-muted"
            >
              {t("cancel", { ns: "common" })}
            </Button>
            <Button
              type="submit"
              disabled={isUpdating}
              className="min-w-[100px]"
            >
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
