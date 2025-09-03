"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import {
  Bell,
  Clock,
  Droplet,
  Leaf,
  Scissors,
  X,
  Plus,
  AlertCircle,
  Edit,
} from "lucide-react";
import { EditReminderDialog } from "@/components/common/edit-reminder-dialog";
import type { Plant } from "@/types";

// Form validation schema - created with translations
const createReminderFormSchema = (t: any) =>
  z.object({
    selectedPlant: z.string().min(1, t("plantRequired", { ns: "validation" })),
    reminderType: z.enum(["watering", "feeding", "training", "custom"], {
      errorMap: () => ({
        message: t("reminderTypeRequired", { ns: "validation" }),
      }),
    }),
    title: z
      .string()
      .max(50, t("titleMaxLength", { ns: "validation" }))
      .optional(),
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

type ReminderFormData = z.infer<ReturnType<typeof createReminderFormSchema>>;

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

interface ReminderSystemProps {
  plants: Plant[];
  // When true, render only the overdue card (if any). Used on dashboard.
  showOnlyOverdue?: boolean;
}

export function ReminderSystem({
  plants,
  showOnlyOverdue = false,
}: ReminderSystemProps) {
  const { t } = useTranslation([
    "reminders",
    "common",
    "journal",
    "validation",
  ]);
  const { toast } = useToast();
  const { handleFirebaseError } = useErrorHandler();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  // Notifications removed

  // Form schema with translations
  const reminderFormSchema = useMemo(() => createReminderFormSchema(t), [t]);

  // Form state via RHF with Zod validation
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ReminderFormData>({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: {
      selectedPlant: "",
      reminderType: "watering",
      title: "",
      description: "",
      interval: "7",
    },
  });

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    if (!auth.currentUser) return;

    try {
      const remindersRef = collection(
        db,
        "users",
        auth.currentUser.uid,
        "reminders"
      );
      const q = query(remindersRef);
      const querySnapshot = await getDocs(q);

      const remindersData: Reminder[] = [];
      querySnapshot.forEach((doc) => {
        remindersData.push({ id: doc.id, ...doc.data() } as Reminder);
      });

      setReminders(remindersData);
    } catch (error: any) {
      handleFirebaseError(error, "fetching reminders");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddReminder = async (data: ReminderFormData) => {
    if (!auth.currentUser || !data.selectedPlant) return;

    const plant = plants.find((p) => p.id === data.selectedPlant);
    if (!plant) return;

    try {
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
        title: t("success", { ns: "reminders" }),
        description: t("successMessage", { ns: "reminders" }),
      });

      setShowAddForm(false);
      reset();
      fetchReminders();
    } catch (error: any) {
      handleFirebaseError(error, "creating reminder");
    }
  };

  const handleToggleReminder = async (
    reminderId: string,
    isActive: boolean
  ) => {
    if (!auth.currentUser) return;

    try {
      const reminderRef = doc(
        db,
        "users",
        auth.currentUser.uid,
        "reminders",
        reminderId
      );
      await updateDoc(reminderRef, { isActive });

      setReminders(
        reminders.map((r) => (r.id === reminderId ? { ...r, isActive } : r))
      );

      toast({
        title: t("updated", { ns: "reminders" }),
        description: isActive
          ? t("activated", { ns: "reminders" })
          : t("deactivated", { ns: "reminders" }),
      });
    } catch (error: any) {
      handleFirebaseError(error, "updating reminder");
    }
  };

  // Mark as done: move nextReminder by interval days and update lastReminder to now
  const handleMarkDone = async (reminderId: string, intervalDays: number) => {
    if (!auth.currentUser) return;
    try {
      const now = new Date();
      const next = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
      const reminderRef = doc(
        db,
        "users",
        auth.currentUser.uid,
        "reminders",
        reminderId
      );
      await updateDoc(reminderRef, {
        lastReminder: now.toISOString(),
        nextReminder: next.toISOString(),
      });
      setReminders((prev) =>
        prev.map((r) =>
          r.id === reminderId
            ? {
                ...r,
                lastReminder: now.toISOString(),
                nextReminder: next.toISOString(),
              }
            : r
        )
      );
      toast({ title: t("updated", { ns: "reminders" }) });
    } catch (error: any) {
      handleFirebaseError(error, "marking reminder done");
    }
  };

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setIsEditDialogOpen(true);
  };

  const handleReminderUpdated = () => {
    fetchReminders(); // Refresh the reminders list
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (!auth.currentUser) return;

    try {
      const reminderRef = doc(
        db,
        "users",
        auth.currentUser.uid,
        "reminders",
        reminderId
      );
      await deleteDoc(reminderRef);

      setReminders(reminders.filter((r) => r.id !== reminderId));

      toast({
        title: t("deleted", { ns: "reminders" }),
        description: t("deletedMessage", { ns: "reminders" }),
      });
    } catch (error: any) {
      handleFirebaseError(error, "deleting reminder");
    }
  };

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

  const getReminderIcon = (type: Reminder["type"]) => {
    switch (type) {
      case "watering":
        return <Droplet className="h-4 w-4 text-blue-500" />;
      case "feeding":
        return <Leaf className="h-4 w-4 text-green-500" />;
      case "training":
        return <Scissors className="h-4 w-4 text-amber-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const selectedPlant = watch("selectedPlant");
  const reminderType = watch("reminderType");
  const title = watch("title");
  const description = watch("description");
  const interval = watch("interval");

  const activeReminders = reminders.filter((r) => r.isActive);
  const now = new Date();
  const overdueReminders = activeReminders.filter(
    (r) => new Date(r.nextReminder) < now
  );
  const dueSoonThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dueSoonReminders = activeReminders.filter((r) => {
    const next = new Date(r.nextReminder);
    return next >= now && next <= dueSoonThreshold;
  });

  const [overdueToastShown, setOverdueToastShown] = useState(false);
  useEffect(() => {
    if (showOnlyOverdue) return; // avoid toast on dashboard
    if (!overdueToastShown && overdueReminders.length > 0) {
      toast({
        title: t("overdue", { ns: "reminders" }),
        description: `${overdueReminders.length} ${t("overdue", {
          ns: "reminders",
        })}`,
      });
      setOverdueToastShown(true);
    }
  }, [overdueReminders.length, overdueToastShown, t, toast, showOnlyOverdue]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-32">
          <div className="text-muted-foreground">
            {t("loading", { ns: "reminders" })}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showOnlyOverdue) {
    // Render only the overdue card if there are overdue reminders; otherwise render nothing
    if (overdueReminders.length === 0) return null;
    return (
      <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
        <CardHeader>
          <CardTitle className="text-orange-800 dark:text-orange-200">
            {t("overdue", { ns: "reminders" })} ({overdueReminders.length})
          </CardTitle>
          <CardDescription className="text-orange-600 dark:text-orange-300">
            {t("overdueDesc", { ns: "reminders" })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {overdueReminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-md"
            >
              <div className="flex items-center gap-3">
                {getReminderIcon(reminder.type)}
                <div>
                  <div className="font-medium">{reminder.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {reminder.plantName}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">
                  {t("overdue", { ns: "reminders" })}
                </Badge>
                <Button
                  size="sm"
                  onClick={() => handleMarkDone(reminder.id, reminder.interval)}
                >
                  {t("markDone", { ns: "reminders" })}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overdue Reminders */}
      {overdueReminders.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardHeader>
            <CardTitle className="text-orange-800 dark:text-orange-200">
              {t("overdue", { ns: "reminders" })} ({overdueReminders.length})
            </CardTitle>
            <CardDescription className="text-orange-600 dark:text-orange-300">
              {t("overdueDesc", { ns: "reminders" })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdueReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-md"
              >
                <div className="flex items-center gap-3">
                  {getReminderIcon(reminder.type)}
                  <div>
                    <div className="font-medium">{reminder.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {reminder.plantName}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">
                    {t("overdue", { ns: "reminders" })}
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() =>
                      handleMarkDone(reminder.id, reminder.interval)
                    }
                  >
                    {t("markDone", { ns: "reminders" })}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Add Reminder Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {t("addReminder", { ns: "reminders" })}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(handleAddReminder)}
              className="space-y-4"
            >
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

              <div className="space-y-2">
                <Label>{t("description", { ns: "reminders" })}</Label>
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

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  {t("cancel", { ns: "common" })}
                </Button>
                <Button type="submit">{t("add", { ns: "reminders" })}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reminders List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("title", { ns: "reminders" })}</CardTitle>
              <CardDescription>
                {t("description", { ns: "reminders" })}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {overdueReminders.length > 0 && (
                <Badge variant="destructive">
                  {t("overdue", { ns: "reminders" })} {overdueReminders.length}
                </Badge>
              )}
              {dueSoonReminders.length > 0 && (
                <Badge>
                  {t("dueSoon", { ns: "reminders" })} {dueSoonReminders.length}
                </Badge>
              )}
              {/* Mobile: icon-only plus */}
              <Button
                onClick={() => setShowAddForm(true)}
                size="icon"
                className="md:hidden"
              >
                <Plus className="h-5 w-5" />
              </Button>
              {/* Desktop: full button with label */}
              <Button
                onClick={() => setShowAddForm(true)}
                className="hidden md:inline-flex"
              >
                <Bell className="mr-2 h-4 w-4" />
                {t("add", { ns: "reminders" })}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {reminders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("noReminders", { ns: "reminders" })}</p>
              <p className="text-sm">
                {t("noRemindersDesc", { ns: "reminders" })}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getReminderIcon(reminder.type)}
                    <div>
                      <div className="font-medium">{reminder.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {reminder.plantName} • {reminder.interval}{" "}
                        {t("days", { ns: "reminders" })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={reminder.isActive}
                      onCheckedChange={(checked) =>
                        handleToggleReminder(reminder.id, checked)
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditReminder(reminder)}
                      title={t("edit", { ns: "common" })}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteReminder(reminder.id)}
                      title={t("delete", { ns: "common" })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Reminder Dialog */}
      <EditReminderDialog
        reminder={editingReminder}
        plants={plants}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onReminderUpdated={handleReminderUpdated}
      />
    </div>
  );
}
