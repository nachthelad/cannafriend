"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import type {
  ForgotPasswordFormData,
  ForgotPasswordFormProps,
} from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import {
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { ROUTE_LOGIN } from "@/lib/routes";

export function ForgotPasswordForm({ className }: ForgotPasswordFormProps) {
  const { t } = useTranslation(["auth", "common"]);
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
  } = useForm<ForgotPasswordFormData>({
    defaultValues: {
      email: "",
    },
  });

  const email = watch("email");

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setLoadingStep(t("forgotPassword.verifyingEmail", { ns: "auth" }));

    try {
      // Verificar si existe una cuenta para este email usando Firebase Auth
      setLoadingStep(t("forgotPassword.verifyingEmail", { ns: "auth" }));
      const methods = await fetchSignInMethodsForEmail(auth, data.email);
      if (!methods || methods.length === 0) {
        setError("email", {
          message: t("forgotPassword.emailNotRegisteredDescription", {
            ns: "auth",
          }),
        });
        return;
      }

      // Enviar el email de recuperación con configuración personalizada
      setLoadingStep(t("forgotPassword.sendingEmail", { ns: "auth" }));
      await sendPasswordResetEmail(auth, data.email, {
        url: `${window.location.origin}/reset-password`,
        handleCodeInApp: true,
      });
      toast({
        title: t("forgotPassword.emailSentTitle", { ns: "auth" }),
        description: t("forgotPassword.emailSentDescription", { ns: "auth" }),
      });
      setTimeout(() => {
        router.push(ROUTE_LOGIN);
      }, 2000);
    } catch (error: any) {
      let errorMessage = t("forgotPassword.error", { ns: "auth" });

      if (error?.code) {
        switch (error.code) {
          case "auth/invalid-email":
            errorMessage = t("auth.invalidEmail", { ns: "auth" });
            break;
          case "auth/too-many-requests":
            errorMessage = t("auth.tooManyRequests", { ns: "auth" });
            break;
          case "auth/user-not-found":
            errorMessage = t("forgotPassword.emailNotRegisteredDescription", {
              ns: "auth",
            });
            break;
          default:
            errorMessage = error.message || t("common.unknownError");
        }
      }

      toast({
        variant: "destructive",
        title: t("common.error"),
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      className={`w-full border-0 shadow-2xl dark:shadow-2xl bg-white/95 dark:bg-primary-foreground backdrop-blur-sm ${
        className || ""
      }`}
    >
      <CardHeader className="flex justify-center">
        <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="sr-only">
          {t("forgotPassword.title", { ns: "auth" })}
        </CardTitle>
        <CardDescription className="sr-only">
          {t("forgotPassword.description", { ns: "auth" })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              {t("forgotPassword.email", { ns: "auth" })}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="ejemplo@correo.com"
              className="bg-white dark:bg-accent border-gray-300 dark:border-gray-600 focus:border-primary dark:focus:border-primary"
              {...register("email", {
                required: t("forgotPassword.emailRequired", { ns: "auth" }),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t("auth.invalidEmail", { ns: "auth" }),
                },
              })}
            />
            {errors.email && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.email.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5"
            disabled={isLoading || !email?.trim()}
          >
            {isLoading
              ? loadingStep || t("forgotPassword.sendingEmail", { ns: "auth" })
              : t("forgotPassword.sendEmail", { ns: "auth" })}
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push(ROUTE_LOGIN)}
              className="text-primary hover:text-primary/80"
            >
              {t("forgotPassword.backToLogin", { ns: "auth" })}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
