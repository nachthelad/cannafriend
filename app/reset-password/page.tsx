"use client";

import { useState, useEffect, Suspense } from "react";
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
import { Loader2, ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { auth } from "@/lib/firebase";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

function ResetPasswordContent() {
  const { t } = useTranslation();
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
        router.push("/login");
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
        description: t("resetPassword.invalidLinkError"),
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
  }, [searchParams, router, toast]);

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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-2xl dark:shadow-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600 dark:text-green-400" />
              <p className="text-gray-600 dark:text-gray-400">
                {t("resetPassword.verifying")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (passwordReset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-2xl dark:shadow-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {t("resetPassword.success")}
            </CardTitle>
            <CardDescription>
              {t("resetPassword.successMessage")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              {t("resetPassword.canLoginNow")}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
              {t("resetPassword.redirectingMessage")}
            </p>
            <div className="flex flex-col space-y-2">
              <Link href="/login">
                <Button className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700">
                  {t("resetPassword.goToLogin")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValidCode) {
    return null; // Ya se redirige en el useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl dark:shadow-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {t("resetPassword.title")}
          </CardTitle>
          <CardDescription>{t("resetPassword.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t("resetPassword.password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400"
                  {...register("password", {
                    required: "La contraseña es requerida",
                    minLength: {
                      value: 6,
                      message: "La contraseña debe tener al menos 6 caracteres",
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
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
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
                {t("resetPassword.confirmPassword")}
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400"
                  {...register("confirmPassword", {
                    required: "Confirma tu contraseña",
                    validate: (value) => {
                      if (value !== password) {
                        return "Las contraseñas no coinciden";
                      }
                      return true;
                    },
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
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
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
              className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {loadingStep}
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {t("resetPassword.submit")}
                </>
              )}
            </Button>

            <div className="text-center">
              <Link href="/login">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("resetPassword.backToLogin")}
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-0 shadow-2xl dark:shadow-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
            <CardContent className="flex items-center justify-center p-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600 dark:text-green-400" />
                <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
