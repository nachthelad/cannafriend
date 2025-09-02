"use client";

import { useState, useRef, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/hooks/use-translation";
import { useToast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { triggerHaptic } from "@/lib/haptic";
import {
  Bell,
  Plus,
  Droplet,
  Leaf,
  Scissors,
  Clock,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { Layout } from "@/components/layout";
import type { Plant } from "@/types";

// Form validation schema - created with translations
const createMobileReminderFormSchema = (t: any) => z.object({
  selectedPlant: z.string().min(1, t("validation.plantRequired")),
  reminderType: z.enum(["watering", "feeding", "training", "custom"], {
    errorMap: () => ({ message: t("validation.reminderTypeRequired") }),
  }),
  title: z.string().max(50, t("validation.titleMaxLength")),
  description: z.string().max(200, t("validation.descriptionMaxLength")),
  interval: z.string().refine(
    (val) => {
      const num = parseInt(val);
      return !isNaN(num) && num >= 1 && num <= 99;
    },
    { message: t("validation.intervalInvalid") }
  ),
});

type MobileReminderFormData = z.infer<ReturnType<typeof createMobileReminderFormSchema>>;

interface Reminder {
  id: string;
  plantId: string;
  plantName: string;
  type: "watering" | "feeding" | "training" | "custom";
  title: string;
  description: string;
  interval: number; // days
  lastReminder: string;
  nextReminder: string;
  isActive: boolean;
  createdAt: string;
}

interface MobileReminderSchedulerProps {
  plants: Plant[];
  onReminderAdded: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}


const QUICK_INTERVALS = [
  { value: "1", label: "1 day", icon: "1" },
  { value: "3", label: "3 days", icon: "3" },
  { value: "7", label: "Weekly", icon: "7" },
  { value: "custom", label: "Custom", icon: "..." },
];

export function MobileReminderScheduler({
  plants,
  onReminderAdded,
  isOpen: externalIsOpen,
  onOpenChange,
}: MobileReminderSchedulerProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { handleFirebaseError } = useErrorHandler();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const [selectedInterval, setSelectedInterval] = useState("7");
  const customInputRef = useRef<HTMLInputElement>(null);

  // Form schema with translations
  const mobileReminderFormSchema = useMemo(() => createMobileReminderFormSchema(t), [t]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MobileReminderFormData>({
    resolver: zodResolver(mobileReminderFormSchema),
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
  const interval = watch("interval");

  const getReminderIcon = (type: Reminder["type"]) => {
    switch (type) {
      case "watering":
        return <Droplet className="h-5 w-5 text-blue-500" />;
      case "feeding":
        return <Leaf className="h-5 w-5 text-green-500" />;
      case "training":
        return <Scissors className="h-5 w-5 text-amber-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getReminderTypeColor = (type: Reminder["type"]) => {
    switch (type) {
      case "watering":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "feeding":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "training":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getDefaultTitle = (type: Reminder["type"]) => {
    switch (type) {
      case "watering":
        return t("reminders.wateringTitle");
      case "feeding":
        return t("reminders.feedingTitle");
      case "training":
        return t("reminders.trainingTitle");
      default:
        return t("reminders.customTitle");
    }
  };

  const getDefaultDescription = (type: Reminder["type"]) => {
    switch (type) {
      case "watering":
        return t("reminders.wateringDesc");
      case "feeding":
        return t("reminders.feedingDesc");
      case "training":
        return t("reminders.trainingDesc");
      default:
        return t("reminders.customDesc");
    }
  };

  const handleTypeChange = (type: Reminder["type"]) => {
    setValue("reminderType", type);
    if (!watch("title")) {
      setValue("title", getDefaultTitle(type));
    }
    if (!watch("description")) {
      setValue("description", getDefaultDescription(type));
    }
    triggerHaptic("light");
  };

  const handleIntervalSelect = (intervalValue: string) => {
    if (intervalValue === "custom") {
      setSelectedInterval("");
      setValue("interval", "");
      setTimeout(() => {
        customInputRef.current?.focus();
      }, 100);
    } else {
      setSelectedInterval(intervalValue);
      setValue("interval", intervalValue);
    }
    triggerHaptic("light");
  };

  const handleClose = () => {
    if (onOpenChange) {
      onOpenChange(false);
    } else {
      setInternalIsOpen(false);
    }
    reset();
    setSelectedInterval("7");
    setValue("interval", "7");
  };

  const onSubmit = async (data: MobileReminderFormData) => {
    if (!auth.currentUser || !data.selectedPlant) return;

    const plant = plants.find((p) => p.id === data.selectedPlant);
    if (!plant) return;

    try {
      triggerHaptic("success");

      const now = new Date();
      const nextReminder = new Date(
        now.getTime() + parseInt(data.interval) * 24 * 60 * 60 * 1000
      );

      const reminderData = {
        plantId: data.selectedPlant,
        plantName: plant.name,
        type: data.reminderType,
        title: data.title || getDefaultTitle(data.reminderType),
        description:
          data.description || getDefaultDescription(data.reminderType),
        interval: parseInt(data.interval),
        lastReminder: now.toISOString(),
        nextReminder: nextReminder.toISOString(),
        isActive: true,
        createdAt: now.toISOString(),
      };

      const remindersRef = collection(
        db,
        "users",
        auth.currentUser.uid,
        "reminders"
      );
      await addDoc(remindersRef, reminderData);

      toast({
        title: t("reminders.success"),
        description: t("reminders.successMessage"),
      });

      handleClose();
      onReminderAdded();
    } catch (error: any) {
      handleFirebaseError(error, "creating reminder");
    }
  };

  if (isOpen) {
    return (
      <Layout>
        {/* Mobile Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="flex items-center gap-2 min-h-[48px] px-3"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="md:inline hidden">{t("common.back")}</span>
          </Button>
          <div className="flex items-center gap-3 mb-4"></div>
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-5 w-5" />
            <h1 className="text-3xl font-bold">{t("reminders.addReminder")}</h1>
          </div>
          <p className="text-muted-foreground">
            {t("reminders.addReminderDesc")}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
          <div className="space-y-6">
            {/* Plant Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                {t("reminders.selectPlant")}
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
                <SelectTrigger className={`min-h-[48px] text-base ${
                  errors.selectedPlant ? "border-destructive" : ""
                }`}>
                  <SelectValue placeholder={t("reminders.selectPlant")} />
                </SelectTrigger>
                <SelectContent>
                  {plants.map((plant) => (
                    <SelectItem
                      key={plant.id}
                      value={plant.id}
                      className="min-h-[48px]"
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

            {/* Reminder Type Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                {t("reminders.reminderType")}
              </Label>
              <input
                type="hidden"
                {...register("reminderType")}
                value={reminderType || ""}
              />
              <div className="grid grid-cols-2 gap-3">
                {(["watering", "feeding", "training", "custom"] as const).map(
                  (type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={reminderType === type ? "default" : "outline"}
                      className={`min-h-[56px] flex-col gap-1 p-3 ${
                        errors.reminderType ? "border-destructive" : ""
                      }`}
                      onClick={() => handleTypeChange(type)}
                    >
                      {getReminderIcon(type)}
                      <span className="text-xs">
                        {type === "custom"
                          ? t("reminders.custom")
                          : t(`logType.${type}`)}
                      </span>
                    </Button>
                  )
                )}
              </div>
              {errors.reminderType && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <p className="text-sm text-destructive font-medium">
                    {errors.reminderType.message}
                  </p>
                </div>
              )}

            {/* Preview Card */}
            {reminderType && (
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    {getReminderIcon(reminderType)}
                    <div className="flex-1">
                      <h3 className="font-medium">
                        {watch("title") || getDefaultTitle(reminderType)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedPlant
                          ? plants.find((p) => p.id === selectedPlant)?.name
                          : t("reminders.selectPlantFirst")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      className={getReminderTypeColor(reminderType)}
                      variant="secondary"
                    >
                      {reminderType === "custom"
                        ? t("reminders.custom")
                        : t(`logType.${reminderType}`)}
                    </Badge>
                    {interval && (
                      <Badge variant="outline">
                        {t("reminders.every")} {interval} {t("reminders.days")}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Interval Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                {t("reminders.frequency")}
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {QUICK_INTERVALS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={
                      (option.value === "custom" && selectedInterval === "") ||
                      selectedInterval === option.value
                        ? "default"
                        : "outline"
                    }
                    className="min-h-[48px] flex-col gap-1 text-xs"
                    onClick={() => handleIntervalSelect(option.value)}
                  >
                    <Clock className="h-4 w-4" />
                    <span>
                      {option.value === "custom" ? "..." : `${option.icon}d`}
                    </span>
                  </Button>
                ))}
              </div>
              {/* Custom interval input */}
              <div className="flex gap-2 items-center">
                <Input
                  ref={customInputRef}
                  type="number"
                  min="1"
                  max="99"
                  placeholder={t("reminders.customDays")}
                  className="min-h-[44px]"
                  onInput={(e) => {
                    const target = e.target as HTMLInputElement;
                    let value = target.value.replace(/[^0-9]/g, "");
                    if (value && parseInt(value) > 99) {
                      value = "99";
                    }
                    target.value = value;
                    setSelectedInterval(value);
                  }}
                  {...register("interval", {
                    onChange: (e) => {
                      setSelectedInterval(e.target.value);
                    },
                  })}
                />
                <Label className="text-sm text-muted-foreground whitespace-nowrap">
                  {t("reminders.days")}
                </Label>
              </div>
              {errors.interval && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <p className="text-sm text-destructive font-medium">
                    {errors.interval.message}
                  </p>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                {t("reminders.title")}
              </Label>
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
            <div className="space-y-3">
              <Label className="text-base font-medium">
                {t("reminders.description")}
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

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <Button
                type="submit"
                disabled={isSubmitting || !selectedPlant}
                className="min-h-[48px] w-full sm:w-auto text-base font-medium"
              >
                <Bell className="mr-2 h-4 w-4" />
                {isSubmitting ? t("common.saving") : t("reminders.add")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="min-h-[48px] w-full sm:w-auto text-base font-medium"
                disabled={isSubmitting}
              >
                {t("common.cancel")}
              </Button>
            </div>
          </div>
          </div>
        </form>
      </Layout>
    );
  }

  return (
    <Button
      onClick={() => {
        if (onOpenChange) {
          onOpenChange(true);
        } else {
          setInternalIsOpen(true);
        }
      }}
      className="w-full min-h-[48px] text-lg"
    >
      <Plus className="mr-2 h-5 w-5" />
      {t("reminders.addReminder")}
    </Button>
  );
}
