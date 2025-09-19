"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { auth } from "@/lib/firebase";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { ROUTE_LOGIN } from "@/lib/routes";

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

interface ResetPasswordFormProps {
  className?: string;
}

export function ResetPasswordForm({ className }: ResetPasswordFormProps) {
  const { t } = useTranslation(["auth", "common"]);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [isValidCode, setIsValidCode] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  // Auto-redirect to login after successful password reset
  useEffect(() => {
    if (passwordReset) {
      const timer = setTimeout(() => {
        router.push(ROUTE_LOGIN);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [passwordReset, router]);

  useEffect(() => {
    const oobCode = searchParams.get("oobCode");

    if (!oobCode) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("resetPassword.invalidLinkError", { ns: "auth" }),
      });
      router.push("/forgot-password");
      return;
    }

    // Verificar que el código de recuperación sea válido
    verifyPasswordResetCode(auth, oobCode)
      .then(() => {
        setIsValidCode(true);
      })
      .catch((error) => {
        console.error("Error verifying reset code:", error);
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: t("resetPassword.expiredLinkError"),
        });
        router.push("/forgot-password");
      })
      .finally(() => {
        setIsValidating(false);
      });
  }, [searchParams, router, toast, t]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (data.password !== data.confirmPassword) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("resetPassword.passwordsDoNotMatch"),
      });
      return;
    }

    setIsLoading(true);
    setLoadingStep(t("resetPassword.updatingPassword"));
    const oobCode = searchParams.get("oobCode");

    try {
      await confirmPasswordReset(auth, oobCode!, data.password);

      setPasswordReset(true);
      toast({
        title: t("resetPassword.success"),
        description: t("resetPassword.successDescription"),
      });
    } catch (error: any) {
      let errorMessage = t("resetPassword.error");

      if (error?.code) {
        switch (error.code) {
          case "auth/expired-action-code":
            errorMessage = t("resetPassword.expiredLink");
            break;
          case "auth/invalid-action-code":
            errorMessage = t("resetPassword.invalidLink");
            break;
          case "auth/weak-password":
            errorMessage = t("resetPassword.weakPassword");
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

  if (isValidating) {
    return (
      <Card className={`w-full border-0 shadow-2xl dark:shadow-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm ${className || ""}`}>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {t("resetPassword.validating", { ns: "auth" })}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!isValidCode) {
    return (
      <Card className={`w-full border-0 shadow-2xl dark:shadow-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm ${className || ""}`}>
        <CardContent className="p-8 text-center">
          <p className="text-red-600 dark:text-red-400">
            {t("resetPassword.invalidCode", { ns: "auth" })}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (passwordReset) {
    return (
      <Card className={`w-full border-0 shadow-2xl dark:shadow-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm ${className || ""}`}>
        <CardHeader className="flex justify-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="text-center">
          <h2 className="text-2xl font-bold mb-2 text-primary">
            {t("resetPassword.success", { ns: "auth" })}
          </h2>
          <p className="text-muted-foreground mb-4">
            {t("resetPassword.successDescription", { ns: "auth" })}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("resetPassword.redirecting", { ns: "auth" })}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full border-0 shadow-2xl dark:shadow-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm ${className || ""}`}>
      <CardHeader className="text-center">
        <CardTitle>{t("resetPassword.title", { ns: "auth" })}</CardTitle>
        <CardDescription>
          {t("resetPassword.description", { ns: "auth" })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">
              {t("resetPassword.newPassword", { ns: "auth" })}
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t("resetPassword.passwordPlaceholder", { ns: "auth" })}
                className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-primary dark:focus:border-primary pr-10"
                {...register("password", {
                  required: t("resetPassword.passwordRequired", { ns: "auth" }),
                  minLength: {
                    value: 6,
                    message: t("resetPassword.passwordMinLength", { ns: "auth" }),
                  },
                })}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              {t("resetPassword.confirmPassword", { ns: "auth" })}
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder={t("resetPassword.confirmPasswordPlaceholder", { ns: "auth" })}
                className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-primary dark:focus:border-primary pr-10"
                {...register("confirmPassword", {
                  required: t("resetPassword.confirmPasswordRequired", { ns: "auth" }),
                  validate: (value) =>
                    value === password || t("resetPassword.passwordsDoNotMatch", { ns: "auth" }),
                })}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5"
            disabled={isLoading || !password?.trim() || !confirmPassword?.trim()}
          >
            {isLoading
              ? loadingStep || t("resetPassword.updatingPassword", { ns: "auth" })
              : t("resetPassword.resetPassword", { ns: "auth" })}
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push(ROUTE_LOGIN)}
              className="text-primary hover:text-primary/80"
            >
              {t("resetPassword.backToLogin", { ns: "auth" })}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}