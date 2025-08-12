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
import { doc, setDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { LanguageSwitcher } from "@/components/common/language-switcher";

export default function OnboardingPage() {
  const { t } = useTranslation() as any;
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  type OnboardingForm = {
    timezone: string;
    roles: { grower: boolean; consumer: boolean };
  };
  const {
    register,
    handleSubmit: rhfHandleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<OnboardingForm>({
    defaultValues: { timezone: "", roles: { grower: true, consumer: false } },
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
          roles: {
            grower: Boolean(data.roles?.grower),
            consumer: Boolean(data.roles?.consumer),
          },
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );

      toast({
        title: t("onboarding.success"),
        description: t("onboarding.successMessage"),
      });

      // Decide next route based on user roles
      try {
        const snap = await getDoc(doc(db, "users", userId));
        const data = snap.exists() ? (snap.data() as any) : {};
        const roles = (data as any)?.roles || {
          grower: true,
          consumer: false,
        };

        if (roles.consumer && !roles.grower) {
          router.push("/strains");
        } else {
          router.push("/dashboard");
        }
      } catch {
        // Fallback to dashboard if roles cannot be determined
        router.push("/dashboard");
      }
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

            <div className="space-y-2">
              <Label>{t("onboarding.roles")}</Label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 border rounded-md p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={watch("roles.grower")}
                    onChange={(e) => setValue("roles.grower", e.target.checked)}
                  />
                  <span>{t("onboarding.grower")}</span>
                </label>
                <label className="flex items-center gap-2 border rounded-md p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={watch("roles.consumer")}
                    onChange={(e) =>
                      setValue("roles.consumer", e.target.checked)
                    }
                  />
                  <span>{t("onboarding.consumer")}</span>
                </label>
              </div>
              {(() => {
                const r = watch("roles");
                if (!r?.grower && !r?.consumer) {
                  return (
                    <p className="text-xs text-destructive">
                      {t("onboarding.selectAtLeastOneRole")}
                    </p>
                  );
                }
                return null;
              })()}
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
