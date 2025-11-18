"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { Layout } from "@/components/layout";
import { ResponsivePageHeader } from "@/components/common/responsive-page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useUserRoles } from "@/hooks/use-user-roles";
import {
  resolveHomePathForRoles,
  ROUTE_LOGIN,
  ROUTE_REMINDERS,
} from "@/lib/routes";
import { plantsCol, remindersCol } from "@/lib/paths";
import { auth, db } from "@/lib/firebase";
import { addDoc, getDocs, query } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  invalidateDashboardCache,
  invalidateRemindersCache,
} from "@/lib/suspense-cache";
import type { Plant } from "@/types";
import { AlertCircle, AlarmClock, Sun } from "lucide-react";
import { isPlantGrowing, normalizePlant } from "@/lib/plant-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const reminderSchema = (t: any) =>
  z.object({
    selectedPlant: z.string().min(1, t("plantRequired", { ns: "validation" })),
    label: z
      .string()
      .min(1, t("titleRequired", { ns: "validation" }))
      .max(50, t("titleMaxLength", { ns: "validation" })),
    note: z
      .string()
      .max(200, t("descriptionMaxLength", { ns: "validation" }))
      .optional(),
    daysOfWeek: z
      .array(z.number().int().min(0).max(6))
      .min(1, t("daysRequired", { ns: "validation" })),
    timeOfDay: z.string().min(1, t("timeRequired", { ns: "validation" })),
    isActive: z.boolean(),
  });

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
  const candidate = new Date(now);
  candidate.setDate(now.getDate() + 7);
  candidate.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return candidate.toISOString();
}

type ReminderFormData = z.infer<ReturnType<typeof reminderSchema>>;

function ReminderFormSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0">
      <div className="space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-11 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-11 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <div className="flex gap-2">
              {Array.from({ length: 7 }).map((_, idx) => (
                <Skeleton key={idx} className="h-10 w-10" />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-11 w-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewReminderPage() {
  const { t, i18n } = useTranslation(["reminders", "common", "validation"]);
  const { toast } = useToast();
  const { handleFirebaseError } = useErrorHandler();
  const router = useRouter();
  const { roles } = useUserRoles();
  const homePath = resolveHomePathForRoles(roles);

  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = useMemo(() => reminderSchema(t), [t]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<ReminderFormData>({
    resolver: zodResolver(schema),
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
  const daysOfWeek = watch("daysOfWeek");
  const timeOfDay = watch("timeOfDay");
  const isActive = watch("isActive");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push(ROUTE_LOGIN);
        return;
      }

      try {
        const plantsSnapshot = await getDocs(query(plantsCol(user.uid)));
        const plantList = plantsSnapshot.docs
          .map((docSnapshot) =>
            normalizePlant(docSnapshot.data(), docSnapshot.id)
          )
          .filter(isPlantGrowing);
        setPlants(plantList);
      } catch (error: any) {
        handleFirebaseError(error, "loading plants");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, handleFirebaseError]);

  const handleDayToggle = (day: number) => {
    const current = new Set(daysOfWeek || []);
    if (current.has(day)) {
      current.delete(day);
    } else {
      current.add(day);
    }
    setValue("daysOfWeek", Array.from(current).sort(), {
      shouldValidate: true,
    });
  };

  const onSubmit = async (data: ReminderFormData) => {
    if (!auth.currentUser) return;
    setIsSubmitting(true);
    try {
      const plant = plants.find((p) => p.id === data.selectedPlant);
      const nowISO = new Date().toISOString();
      const nextReminder = getNextOccurrence(data.daysOfWeek, data.timeOfDay);

      const payload = {
        plantId: plant ? plant.id : null,
        plantName: plant ? plant.name : null,
        label: data.label,
        note: data.note || "",
        daysOfWeek: data.daysOfWeek,
        timeOfDay: data.timeOfDay,
        isActive: data.isActive,
        createdAt: nowISO,
        updatedAt: nowISO,
        lastSentDate: null,
        // Legacy compatibility (to be removed once the cron/list are updated)
        type: "custom" as const,
        title: data.label,
        description: data.note || "",
        interval: 1,
        lastReminder: null,
        nextReminder: nextReminder,
      };

      await addDoc(remindersCol(auth.currentUser.uid), payload);

      invalidateRemindersCache(auth.currentUser.uid);
      invalidateDashboardCache(auth.currentUser.uid);
      reset();

      toast({
        title: t("created", { ns: "reminders" }),
        description: t("createdMessage", { ns: "reminders" }),
      });

      router.push(ROUTE_REMINDERS);
    } catch (error: any) {
      handleFirebaseError(error, "creating reminder");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <ReminderFormSkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <ResponsivePageHeader
          title={t("newReminder", { ns: "reminders" })}
          description={t("pageDescription", { ns: "reminders" })}
          backHref={homePath}
        />

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 my-4 px-4 pb-10"
        >
          {/* Plant */}
          <div className="space-y-2">
            <Label>{t("selectPlant", { ns: "reminders" })}</Label>
            <Select
              value={selectedPlant}
              onValueChange={(value) =>
                setValue("selectedPlant", value, { shouldValidate: true })
              }
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
                  <SelectItem key={plant.id} value={plant.id}>
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
              placeholder={t("customDesc", { ns: "reminders" })}
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

          {/* Days */}
          <div className="space-y-2">
            <Label>{t("days", { ns: "reminders" })}</Label>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 7 }).map((_, idx) => {
                const label = new Intl.DateTimeFormat(i18n.language, {
                  weekday: "short",
                }).format(new Date(2024, 0, 7 + idx));
                const selected = daysOfWeek?.includes(idx);
                return (
                  <Button
                    key={idx}
                    type="button"
                    variant={selected ? "default" : "outline"}
                    className="min-h-[40px] px-3"
                    onClick={() => handleDayToggle(idx)}
                  >
                    {label}
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
          </div>

          {/* Time */}
          <div className="space-y-2">
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
                <span>{t("morningHint", { ns: "reminders" })}</span>
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

          {/* Active Toggle */}
          <div className="flex items-center justify-left gap-2 px-3 py-2">
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

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(ROUTE_REMINDERS)}
              className="flex-1 min-h-[48px] text-base"
              disabled={isSubmitting}
            >
              {t("cancel", { ns: "common" })}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 min-h-[48px] text-base"
            >
              {isSubmitting
                ? t("saving", { ns: "common" })
                : t("add", { ns: "reminders" })}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
