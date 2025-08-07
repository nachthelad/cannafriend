"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { useTranslation } from "@/hooks/use-translation";
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
import { Bell, Clock, Droplet, Leaf, Scissors, X } from "lucide-react";
import type { Plant } from "@/types";

interface Reminder {
  id: string;
  plantId: string;
  plantName: string;
  type: "watering" | "feeding" | "training" | "custom";
  title: string;
  description: string;
  frequency: "daily" | "weekly" | "custom";
  interval: number; // days
  lastReminder: string;
  nextReminder: string;
  isActive: boolean;
  createdAt: string;
}

interface ReminderSystemProps {
  plants: Plant[];
}

export function ReminderSystem({ plants }: ReminderSystemProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { handleFirebaseError } = useErrorHandler();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state via RHF
  type ReminderForm = {
    selectedPlant: string;
    reminderType: Reminder["type"];
    title?: string;
    description?: string;
    frequency: Reminder["frequency"];
    interval: string; // keep string for input, convert to number on submit
  };
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ReminderForm>({
    defaultValues: {
      selectedPlant: "",
      reminderType: "watering",
      title: "",
      description: "",
      frequency: "weekly",
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

  const handleAddReminder = async (data: ReminderForm) => {
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
        frequency: data.frequency,
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
        title: t("reminders.updated"),
        description: isActive
          ? t("reminders.activated")
          : t("reminders.deactivated"),
      });
    } catch (error: any) {
      handleFirebaseError(error, "updating reminder");
    }
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
        title: t("reminders.deleted"),
        description: t("reminders.deletedMessage"),
      });
    } catch (error: any) {
      handleFirebaseError(error, "deleting reminder");
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
  const frequency = watch("frequency");
  const interval = watch("interval");

  const activeReminders = reminders.filter((r) => r.isActive);
  const overdueReminders = activeReminders.filter(
    (r) => new Date(r.nextReminder) < new Date()
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-32">
          <div className="text-muted-foreground">{t("reminders.loading")}</div>
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
              {t("reminders.overdue")} ({overdueReminders.length})
            </CardTitle>
            <CardDescription className="text-orange-600 dark:text-orange-300">
              {t("reminders.overdueDesc")}
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
                <Badge variant="destructive">{t("reminders.overdue")}</Badge>
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
              {t("reminders.addReminder")}
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
                <Label>{t("reminders.selectPlant")}</Label>
                <input
                  type="hidden"
                  {...register("selectedPlant", {
                    required: t("reminders.selectPlant") as string,
                  })}
                  value={selectedPlant || ""}
                />
                <Select
                  value={selectedPlant}
                  onValueChange={(v) => setValue("selectedPlant", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("reminders.selectPlant")} />
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
                  <p className="text-xs text-destructive">
                    {String(errors.selectedPlant.message)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t("reminders.reminderType")}</Label>
                <input
                  type="hidden"
                  {...register("reminderType", { required: true })}
                  value={reminderType || ""}
                />
                <Select
                  value={reminderType}
                  onValueChange={(v) =>
                    setValue("reminderType", v as Reminder["type"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="watering">
                      {t("logType.watering")}
                    </SelectItem>
                    <SelectItem value="feeding">
                      {t("logType.feeding")}
                    </SelectItem>
                    <SelectItem value="training">
                      {t("logType.training")}
                    </SelectItem>
                    <SelectItem value="custom">
                      {t("reminders.custom")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("reminders.title")}</Label>
                <Input
                  {...register("title")}
                  placeholder={getDefaultTitle(reminderType)}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("reminders.description")}</Label>
                <Input
                  {...register("description")}
                  placeholder={getDefaultDescription(reminderType)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("reminders.frequency")}</Label>
                  <input
                    type="hidden"
                    {...register("frequency", { required: true })}
                    value={frequency || ""}
                  />
                  <Select
                    value={frequency}
                    onValueChange={(v) =>
                      setValue("frequency", v as Reminder["frequency"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">
                        {t("reminders.daily")}
                      </SelectItem>
                      <SelectItem value="weekly">
                        {t("reminders.weekly")}
                      </SelectItem>
                      <SelectItem value="custom">
                        {t("reminders.custom")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t("reminders.interval")}</Label>
                  <Input
                    type="number"
                    min="1"
                    {...register("interval", {
                      validate: (value) => {
                        const n = Number.parseInt(value || "");
                        return (Number.isFinite(n) && n > 0) || "Must be > 0";
                      },
                    })}
                    placeholder="7"
                  />
                  {errors.interval && (
                    <p className="text-xs text-destructive">
                      {String(errors.interval.message)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {t("reminders.add")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  {t("common.cancel")}
                </Button>
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
              <CardTitle>{t("reminders.title")}</CardTitle>
              <CardDescription>{t("reminders.description")}</CardDescription>
            </div>
            <Button onClick={() => setShowAddForm(true)}>
              <Bell className="mr-2 h-4 w-4" />
              {t("reminders.add")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {reminders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("reminders.noReminders")}</p>
              <p className="text-sm">{t("reminders.noRemindersDesc")}</p>
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
                        {reminder.plantName} •{" "}
                        {t(`reminders.${reminder.frequency}`)} •{" "}
                        {reminder.interval} {t("reminders.days")}
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
                      onClick={() => handleDeleteReminder(reminder.id)}
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
    </div>
  );
}
