"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { ROUTE_LOGIN } from "@/lib/routes";
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
import { useTranslation } from "react-i18next";
import { auth } from "@/lib/firebase";
import { setDoc, getDoc } from "firebase/firestore";
import { userDoc } from "@/lib/paths";
import { resolveHomePathForRoles } from "@/lib/routes";
import { onAuthStateChanged } from "firebase/auth";
import { AnimatedLogo } from "@/components/common/animated-logo";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import type { Roles, UserProfile } from "@/types";

export default function OnboardingPage() {
  const { t } = useTranslation("onboarding");
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  type OnboardingForm = {
    timezone: string;
    roles: Roles;
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
        router.push(ROUTE_LOGIN);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const onSubmit = async (data: OnboardingForm) => {
    if (!userId) return;

    setIsLoading(true);

    try {
      await setDoc(
        userDoc<UserProfile>(userId),
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
        title: t("success"),
        description: t("successMessage"),
      });

      // Decide next route based on user roles
      try {
        const snap = await getDoc(userDoc<UserProfile>(userId));
        const data = snap.data();
        const roles: Roles = data?.roles || {
          grower: true,
          consumer: false,
        };
        router.push(resolveHomePathForRoles(roles));
      } catch {
        // Fallback to dashboard if roles cannot be determined
        router.push(resolveHomePathForRoles({ grower: true, consumer: false }));
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("error"),
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
            {t("title")}
          </CardTitle>
          <CardDescription className="text-center">
            {t("description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={rhfHandleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">{t("timezone")}</Label>
              {/* Hidden registered field for validation */}
              <input
                type="hidden"
                {...register("timezone", {
                  required: t("selectTimezone") as string,
                })}
                value={watch("timezone") || ""}
              />
              <Select
                value={watch("timezone")}
                onValueChange={(v) => setValue("timezone", v)}
              >
                <SelectTrigger id="timezone">
                  <SelectValue placeholder={t("selectTimezone")} />
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
              <Label>{t("roles")}</Label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 border rounded-md p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={watch("roles.grower")}
                    onChange={(e) => setValue("roles.grower", e.target.checked)}
                  />
                  <span>{t("grower")}</span>
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
                  <span>{t("consumer")}</span>
                </label>
              </div>
              {(() => {
                const r = watch("roles");
                if (!r?.grower && !r?.consumer) {
                  return (
                    <p className="text-xs text-destructive">
                      {t("selectAtLeastOneRole")}
                    </p>
                  );
                }
                return null;
              })()}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <AnimatedLogo size={16} className="mr-2 text-primary" duration={1.2} />
                  {t("loading")}
                </>
              ) : (
                t("submit")
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-xs text-center text-muted-foreground">
            {t("info")}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
