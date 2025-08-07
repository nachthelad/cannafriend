"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { LanguageSwitcher } from "@/components/common/language-switcher";

export default function OnboardingPage() {
  const { t } = useTranslation() as any;
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  type OnboardingForm = { timezone: string };
  const {
    register,
    handleSubmit: rhfHandleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<OnboardingForm>({
    defaultValues: { timezone: "" },
  });
  const [userId, setUserId] = useState<string | null>(null);

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

  const onSubmit = async (data: OnboardingForm) => {
    if (!userId) return;

    setIsLoading(true);

    try {
      await setDoc(
        doc(db, "users", userId),
        {
          timezone: data.timezone,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );

      toast({
        title: t("onboarding.success"),
        description: t("onboarding.successMessage"),
      });

      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("onboarding.error"),
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const timezones = [
    "America/Argentina/Buenos_Aires",
    "America/Mexico_City",
    "America/Bogota",
    "America/Santiago",
    "America/Lima",
    "Europe/Madrid",
    "America/New_York",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md border-0 shadow-xl dark:shadow-2xl">
        <CardHeader className="space-y-1">
          <div className="flex justify-end">
            <LanguageSwitcher />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {t("onboarding.title")}
          </CardTitle>
          <CardDescription className="text-center">
            {t("onboarding.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={rhfHandleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">{t("onboarding.timezone")}</Label>
              {/* Hidden registered field for validation */}
              <input
                type="hidden"
                {...register("timezone", {
                  required: t("onboarding.selectTimezone") as string,
                })}
                value={watch("timezone") || ""}
              />
              <Select
                value={watch("timezone")}
                onValueChange={(v) => setValue("timezone", v)}
              >
                <SelectTrigger id="timezone">
                  <SelectValue placeholder={t("onboarding.selectTimezone")} />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.timezone && (
                <p className="text-xs text-destructive">
                  {String(errors.timezone.message)}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("onboarding.loading")}
                </>
              ) : (
                t("onboarding.submit")
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-xs text-center text-muted-foreground">
            {t("onboarding.info")}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
