"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { AnimatedLogo } from "@/components/common/animated-logo";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import {
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTE_LOGIN } from "@/lib/routes";
import { ResponsivePageHeader } from "@/components/common/responsive-page-header";

interface ForgotPasswordFormData {
  email: string;
}

export default function ForgotPasswordPage() {
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
          message: t("forgotPassword.emailNotRegisteredDescription", { ns: "auth" }),
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
            errorMessage = t("forgotPassword.emailNotRegisteredDescription", { ns: "auth" });
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <ResponsivePageHeader
        title={
          <span className="block text-center md:text-left">
            {t("forgotPassword.title", { ns: "auth" })}
          </span>
        }
        description={
          <span className="block text-center md:text-left">
            {t("forgotPassword.description", { ns: "auth" })}
          </span>
        }
        onBackClick={() => router.push(ROUTE_LOGIN)}
        className="max-w-md mx-auto"
      />
      <Card className="w-full max-w-md border-0 shadow-2xl dark:shadow-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
        <CardHeader className="flex justify-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
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
              <Label htmlFor="email">{t("forgotPassword.email", { ns: "auth" })}</Label>
              <Input
                id="email"
                type="email"
                placeholder="ejemplo@correo.com"
                className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400"
                {...register("email", {
                  required: t("forgotPassword.emailRequired", { ns: "auth" }),
                  validate: {
                    completeEmail: (value) => {
                      if (!value) return t("forgotPassword.emailRequired", { ns: "auth" });
                      if (
                        value.includes("@") &&
                        (value.endsWith("@") ||
                          value.split("@")[1]?.length === 0)
                      ) {
                        return t("forgotPassword.emailIncomplete", { ns: "auth" });
                      }
                      if (
                        !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)
                      ) {
                        return t("forgotPassword.emailInvalidFormat", { ns: "auth" });
                      }
                      return true;
                    },
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
              className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <AnimatedLogo size={16} className="mr-2 text-primary" duration={1.2} />
                  {loadingStep}
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  {t("forgotPassword.submit", { ns: "auth" })}
                </>
              )}
            </Button>

            <div className="text-center">
              <Link href={ROUTE_LOGIN}>
                <Button
                  type="button"
                  variant="link"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                >
                  {t("forgotPassword.backToLogin", { ns: "auth" })}
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
