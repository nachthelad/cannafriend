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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { AlertCircle } from "lucide-react";
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
    selectedPlant: z.string().min(1, t("plantRequired", { ns: "validation" })),
    reminderType: z.enum(["watering", "feeding", "training", "custom"], {
      required_error: t("reminderTypeRequired", { ns: "validation" }),
      invalid_type_error: t("reminderTypeRequired", { ns: "validation" }),
    }),
    title: z
      .string()
      .min(1, t("titleRequired", { ns: "validation" }))
      .max(50, t("titleMaxLength", { ns: "validation" })),
    description: z
      .string()
      .max(200, t("descriptionMaxLength", { ns: "validation" }))
      .optional(),
    interval: z.string().refine(
      (val) => {
        const num = parseInt(val);
        return !isNaN(num) && num >= 1 && num <= 99;
      },
      { message: t("intervalInvalid", { ns: "validation" }) }
    ),
  });

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
      reminderType: "watering",
      title: "",
      description: "",
      interval: "7",
    },
  });

  const selectedPlant = watch("selectedPlant");
  const reminderType = watch("reminderType");

  // Reset form when reminder changes or dialog opens
  useEffect(() => {
    if (reminder && isOpen) {
      reset({
        selectedPlant: reminder.plantId,
        reminderType: reminder.type,
        title: reminder.title,
        description: reminder.description || "",
        interval: reminder.interval.toString(),
      });
    }
  }, [reminder, isOpen, reset]);

  const getDefaultTitle = (type: Reminder["type"]) => {
    switch (type) {
      case "watering":
        return t("wateringTitle", { ns: "reminders" });
      case "feeding":
        return t("feedingTitle", { ns: "reminders" });
      case "training":
        return t("trainingTitle", { ns: "reminders" });
      default:
        return t("customTitle", { ns: "reminders" });
    }
  };

  const getDefaultDescription = (type: Reminder["type"]) => {
    switch (type) {
      case "watering":
        return t("wateringDesc", { ns: "reminders" });
      case "feeding":
        return t("feedingDesc", { ns: "reminders" });
      case "training":
        return t("trainingDesc", { ns: "reminders" });
      default:
        return t("customDesc", { ns: "reminders" });
    }
  };

  const handleUpdateReminder = async (data: EditReminderFormData) => {
    if (!auth.currentUser || !reminder) return;

    const plant = plants.find((p) => p.id === data.selectedPlant);
    if (!plant) return;

    setIsUpdating(true);
    try {
      const reminderRef = doc(
        db,
        "users",
        auth.currentUser.uid,
        "reminders",
        reminder.id
      );

      const updateData = {
        plantId: data.selectedPlant,
        plantName: plant.name,
        type: data.reminderType,
        title: data.title,
        description: data.description || "",
        interval: parseInt(data.interval),
      };

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

          {/* Reminder Type */}
          <div className="space-y-2">
            <Label>{t("reminderType", { ns: "reminders" })}</Label>
            <input
              type="hidden"
              {...register("reminderType")}
              value={reminderType || ""}
            />
            <Select
              value={reminderType}
              onValueChange={(v) =>
                setValue("reminderType", v as Reminder["type"])
              }
            >
              <SelectTrigger
                className={`min-h-[44px] ${
                  errors.reminderType ? "border-destructive" : ""
                }`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="watering" className="min-h-[44px]">
                  {t("logType.watering", { ns: "journal" })}
                </SelectItem>
                <SelectItem value="feeding" className="min-h-[44px]">
                  {t("logType.feeding", { ns: "journal" })}
                </SelectItem>
                <SelectItem value="training" className="min-h-[44px]">
                  {t("logType.training", { ns: "journal" })}
                </SelectItem>
                <SelectItem value="custom" className="min-h-[44px]">
                  {t("custom", { ns: "reminders" })}
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.reminderType && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <p className="text-sm text-destructive font-medium">
                  {errors.reminderType.message}
                </p>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>{t("title", { ns: "reminders" })}</Label>
            <Input
              {...register("title")}
              placeholder={getDefaultTitle(reminderType)}
              className={`min-h-[44px] ${
                errors.title ? "border-destructive" : ""
              }`}
            />
            {errors.title && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <p className="text-sm text-destructive font-medium">
                  {errors.title.message}
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>
              {t("description", { ns: "reminders" })} (
              {t("optional", { ns: "common" })})
            </Label>
            <Input
              {...register("description")}
              placeholder={getDefaultDescription(reminderType)}
              className={`min-h-[44px] ${
                errors.description ? "border-destructive" : ""
              }`}
            />
            {errors.description && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <p className="text-sm text-destructive font-medium">
                  {errors.description.message}
                </p>
              </div>
            )}
          </div>

          {/* Interval */}
          <div className="space-y-2">
            <Label>{t("interval", { ns: "reminders" })}</Label>
            <Input
              type="number"
              min="1"
              max="99"
              {...register("interval")}
              placeholder="7"
              className={`min-h-[44px] ${
                errors.interval ? "border-destructive" : ""
              }`}
            />
            {errors.interval && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <p className="text-sm text-destructive font-medium">
                  {errors.interval.message}
                </p>
              </div>
            )}
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
