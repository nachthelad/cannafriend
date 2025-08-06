"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { validateLogEntry } from "@/lib/validation";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { LogEntry, Plant } from "@/types";

interface AddLogFormProps {
  plantId: string;
  onSuccess?: (log: LogEntry) => void;
  showPlantSelector?: boolean;
  plants?: Plant[];
}

export function AddLogForm({
  plantId,
  onSuccess,
  showPlantSelector = false,
  plants = [],
}: AddLogFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { handleFirebaseError, handleValidationError } = useErrorHandler();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlantId, setSelectedPlantId] = useState(plantId);

  // Form state
  const [logType, setLogType] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [notes, setNotes] = useState("");

  // Watering fields
  const [wateringAmount, setWateringAmount] = useState("");
  const [wateringMethod, setWateringMethod] = useState("");

  // Feeding fields
  const [feedingType, setFeedingType] = useState("");
  const [feedingNpk, setFeedingNpk] = useState("");
  const [feedingAmount, setFeedingAmount] = useState("");

  // Training fields
  const [trainingMethod, setTrainingMethod] = useState("");

  // Environment fields
  const [temperature, setTemperature] = useState("");
  const [humidity, setHumidity] = useState("");
  const [ph, setPh] = useState("");
  const [light, setLight] = useState("");

  const resetForm = () => {
    setLogType("");
    setDate(new Date());
    setNotes("");
    setWateringAmount("");
    setWateringMethod("");
    setFeedingType("");
    setFeedingNpk("");
    setFeedingAmount("");
    setTrainingMethod("");
    setTemperature("");
    setHumidity("");
    setPh("");
    setLight("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const userId = auth.currentUser?.uid;
    const currentPlantId = showPlantSelector ? selectedPlantId : plantId;

    if (!auth.currentUser || !date || !currentPlantId) return;

    setIsLoading(true);

    try {
      let logData: any = {
        type: logType,
        date: date.toISOString(),
        notes,
        createdAt: new Date().toISOString(),
      };

      // Add type-specific fields
      switch (logType) {
        case "watering":
          logData = {
            ...logData,
            amount: Number.parseFloat(wateringAmount),
            method: wateringMethod,
          };
          break;
        case "feeding":
          logData = {
            ...logData,
            npk: feedingNpk,
            amount: Number.parseFloat(feedingAmount),
          };
          break;
        case "training":
          logData = {
            ...logData,
            method: trainingMethod,
          };
          break;
        case "environment":
          logData = {
            ...logData,
            temperature: Number.parseFloat(temperature),
            humidity: Number.parseFloat(humidity),
            ph: Number.parseFloat(ph),
            light: Number.parseFloat(light),
          };

          // Also save to environment collection for charts
          const envRef = collection(
            db,
            "users",
            auth.currentUser!.uid,
            "plants",
            currentPlantId,
            "environment"
          );
          await addDoc(envRef, {
            date: date.toISOString(),
            temperature: Number.parseFloat(temperature),
            humidity: Number.parseFloat(humidity),
            ph: Number.parseFloat(ph),
            createdAt: new Date().toISOString(),
          });
          break;
      }

      // Save log
      const logsRef = collection(
        db,
        "users",
        auth.currentUser!.uid,
        "plants",
        currentPlantId,
        "logs"
      );
      const docRef = await addDoc(logsRef, logData);

      toast({
        title: t("logForm.success"),
        description: t("logForm.successDesc"),
      });

      // Call success callback with new log
      if (onSuccess) {
        onSuccess({ id: docRef.id, ...logData, plantId: currentPlantId });
      }

      resetForm();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("logForm.error"),
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {showPlantSelector && plants.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="plantSelect">{t("journal.selectPlant")}</Label>
          <Select
            value={selectedPlantId}
            onValueChange={setSelectedPlantId}
            required
          >
            <SelectTrigger id="plantSelect">
              <SelectValue placeholder={t("journal.selectPlant")} />
            </SelectTrigger>
            <SelectContent>
              {plants.map((plant) => (
                <SelectItem key={plant.id} value={plant.id}>
                  {plant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="logType">{t("logForm.type")}</Label>
        <Select value={logType} onValueChange={setLogType} required>
          <SelectTrigger id="logType">
            <SelectValue placeholder={t("logForm.selectType")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="watering">{t("logType.watering")}</SelectItem>
            <SelectItem value="feeding">{t("logType.feeding")}</SelectItem>
            <SelectItem value="training">{t("logType.training")}</SelectItem>
            <SelectItem value="environment">
              {t("logType.environment")}
            </SelectItem>
            <SelectItem value="note">{t("logType.note")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("logForm.date")}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {date ? (
                format(date, "PPP")
              ) : (
                <span>{t("newPlant.pickDate")}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Type-specific fields */}
      {logType === "watering" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wateringAmount">{t("watering.amount")}</Label>
            <Input
              id="wateringAmount"
              type="number"
              value={wateringAmount}
              onChange={(e) => setWateringAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{t("watering.method")}</Label>
            <RadioGroup
              value={wateringMethod}
              onValueChange={setWateringMethod}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="topWatering" id="topWatering" />
                <Label htmlFor="topWatering" className="font-normal">
                  {t("watering.topWatering")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bottomWatering" id="bottomWatering" />
                <Label htmlFor="bottomWatering" className="font-normal">
                  {t("watering.bottomWatering")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="drip" id="drip" />
                <Label htmlFor="drip" className="font-normal">
                  {t("watering.drip")}
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      )}

      {logType === "feeding" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("feeding.type")}</Label>
            <RadioGroup
              value={feedingType}
              onValueChange={setFeedingType}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="organic" id="organic" />
                <Label htmlFor="organic" className="font-normal">
                  {t("feeding.organic")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="synthetic" id="synthetic" />
                <Label htmlFor="synthetic" className="font-normal">
                  {t("feeding.synthetic")}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedingNpk">{t("feeding.npk")}</Label>
            <Input
              id="feedingNpk"
              placeholder="e.g. 20-20-20"
              value={feedingNpk}
              onChange={(e) => setFeedingNpk(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedingAmount">{t("feeding.amount")}</Label>
            <Input
              id="feedingAmount"
              type="number"
              value={feedingAmount}
              onChange={(e) => setFeedingAmount(e.target.value)}
              required
            />
          </div>
        </div>
      )}

      {logType === "training" && (
        <div className="space-y-2">
          <Label>{t("training.method")}</Label>
          <RadioGroup
            value={trainingMethod}
            onValueChange={setTrainingMethod}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="topping" id="topping" />
              <Label htmlFor="topping" className="font-normal">
                {t("training.topping")}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="lst" id="lst" />
              <Label htmlFor="lst" className="font-normal">
                {t("training.lst")}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="defoliation" id="defoliation" />
              <Label htmlFor="defoliation" className="font-normal">
                {t("training.defoliation")}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="supercropping" id="supercropping" />
              <Label htmlFor="supercropping" className="font-normal">
                {t("training.supercropping")}
              </Label>
            </div>
          </RadioGroup>
        </div>
      )}

      {logType === "environment" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="temperature">{t("environment.temperature")}</Label>
            <Input
              id="temperature"
              type="number"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="humidity">{t("environment.humidity")}</Label>
            <Input
              id="humidity"
              type="number"
              step="0.1"
              value={humidity}
              onChange={(e) => setHumidity(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ph">{t("environment.ph")}</Label>
            <Input
              id="ph"
              type="number"
              step="0.1"
              value={ph}
              onChange={(e) => setPh(e.target.value)}
              required
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">{t("logForm.notes")}</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading || !logType}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("logForm.loading")}
          </>
        ) : (
          t("logForm.submit")
        )}
      </Button>
    </form>
  );
}
