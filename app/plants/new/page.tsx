"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { validatePlant } from "@/lib/validation";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Layout } from "@/components/layout";
import { Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function NewPlantPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const { handleFirebaseError, handleValidationError } = useErrorHandler();
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [seedType, setSeedType] = useState("");
  const [growType, setGrowType] = useState("");
  const [plantingDate, setPlantingDate] = useState<Date | undefined>(
    new Date()
  );
  const [lightSchedule, setLightSchedule] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId || !plantingDate) return;

    setIsLoading(true);

    try {
      const plantData = {
        name,
        seedType,
        growType,
        plantingDate: plantingDate.toISOString(),
        lightSchedule:
          growType === "indoor" && seedType !== "autofloreciente"
            ? lightSchedule
            : null,
        createdAt: new Date().toISOString(),
      };

      // Validate plant data
      const validation = validatePlant(plantData);
      if (!validation.success) {
        handleValidationError(validation.errors || [], "plant creation");
        return;
      }

      const plantsRef = collection(db, "users", userId, "plants");
      const docRef = await addDoc(plantsRef, plantData);

      toast({
        title: t("newPlant.success"),
        description: t("newPlant.successMessage"),
      });

      router.push(`/plants/${docRef.id}`);
    } catch (error: any) {
      handleFirebaseError(error, "plant creation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{t("newPlant.title")}</CardTitle>
            <CardDescription>{t("newPlant.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">{t("newPlant.name")}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("newPlant.namePlaceholder")}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>{t("newPlant.seedType")}</Label>
                <RadioGroup
                  value={seedType}
                  onValueChange={setSeedType}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="autofloreciente"
                      id="autofloreciente"
                    />
                    <Label htmlFor="autofloreciente" className="font-normal">
                      {t("newPlant.autofloreciente")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fotoperiodica" id="fotoperiodica" />
                    <Label htmlFor="fotoperiodica" className="font-normal">
                      {t("newPlant.fotoperiodica")}
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>{t("newPlant.growType")}</Label>
                <RadioGroup
                  value={growType}
                  onValueChange={setGrowType}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="indoor" id="indoor" />
                    <Label htmlFor="indoor" className="font-normal">
                      {t("newPlant.indoor")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="outdoor" id="outdoor" />
                    <Label htmlFor="outdoor" className="font-normal">
                      {t("newPlant.outdoor")}
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>{t("newPlant.plantingDate")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !plantingDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {plantingDate ? (
                        format(plantingDate, "PPP")
                      ) : (
                        <span>{t("newPlant.pickDate")}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={plantingDate}
                      onSelect={setPlantingDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {growType === "indoor" && seedType !== "autofloreciente" && (
                <div className="space-y-2">
                  <Label htmlFor="lightSchedule">
                    {t("newPlant.lightSchedule")}
                  </Label>
                  <Select
                    value={lightSchedule}
                    onValueChange={setLightSchedule}
                    required
                  >
                    <SelectTrigger id="lightSchedule">
                      <SelectValue
                        placeholder={t("newPlant.selectLightSchedule")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="18/6">
                        {t("newPlant.vegetative")} (18/6)
                      </SelectItem>
                      <SelectItem value="12/12">
                        {t("newPlant.flowering")} (12/12)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("newPlant.loading")}
                  </>
                ) : (
                  t("newPlant.submit")
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
