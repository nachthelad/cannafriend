"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { AnimatedLogo } from "@/components/common/animated-logo";
import { useTranslation } from "react-i18next";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getDoc } from "firebase/firestore";
import { userDoc } from "@/lib/paths";
import { resolveHomePathForRoles } from "@/lib/routes";
import { useRouter } from "next/navigation";
import { ROUTE_ONBOARDING } from "@/lib/routes";
import { useToast } from "@/hooks/use-toast";

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { t } = useTranslation(["auth", "common"]);
  const router = useRouter();
  const { toast } = useToast();
  const { handleFirebaseError } = useErrorHandler();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const email = watch("email");

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setLoadingStep(t("login.verifyingCredentials", { ns: "auth" }));

    try {
      setLoadingStep(t("login.signingIn", { ns: "auth" }));
      const result = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const user = result.user;

      // Close the modal immediately after successful authentication
      onSuccess?.();
      
      // Let the auth state change handler in Home component handle navigation
      // to avoid race conditions with competing redirects
    } catch (error: any) {
      if (error?.code) {
        switch (error.code) {
          case "auth/wrong-password":
            setValue("password", "");
            toast({
              variant: "destructive",
              title: t("error", { ns: "auth" }),
              description: t("wrongPassword", { ns: "auth" }),
            });
            break;
          case "auth/user-not-found":
            setValue("email", "");
            toast({
              variant: "destructive",
              title: t("error", { ns: "auth" }),
              description: t("userNotFound", { ns: "auth" }),
            });
            break;
          case "auth/invalid-email":
            toast({
              variant: "destructive",
              title: t("error", { ns: "auth" }),
              description: t("invalidEmail", { ns: "auth" }),
            });
            break;
          case "auth/too-many-requests":
            toast({
              variant: "destructive",
              title: t("error", { ns: "auth" }),
              description: t("tooManyRequests", { ns: "auth" }),
            });
            break;
          case "auth/network-request-failed":
            toast({
              variant: "destructive",
              title: t("error", { ns: "auth" }),
              description: t("networkError", { ns: "auth" }),
            });
            break;
          default:
            toast({
              variant: "destructive",
              title: t("error", { ns: "auth" }),
              description: error.message || t("unknownError", { ns: "common" }),
            });
        }
      } else {
        toast({
          variant: "destructive",
          title: t("error", { ns: "auth" }),
          description: error.message || t("unknownError", { ns: "common" }),
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = () => {
    // Redirigir a la página de recuperación de contraseña
    window.location.href = "/forgot-password";
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t("login.email", { ns: "auth" })}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          aria-invalid={Boolean(errors.email) || undefined}
          placeholder="ejemplo@correo.com"
          className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400"
          {...register("email", {
            required: t("fieldRequired", { ns: "common" }),
            validate: {
              completeEmail: (value) => {
                if (!value) return t("fieldRequired", { ns: "common" });
                if (
                  value.includes("@") &&
                  (value.endsWith("@") || value.split("@")[1]?.length === 0)
                ) {
                  return t("incompleteEmail", { ns: "auth" });
                }
                if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
                  return t("invalidEmail", { ns: "auth" });
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

      <div className="space-y-2">
        <Label htmlFor="password">{t("login.password", { ns: "auth" })}</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={Boolean(errors.password) || undefined}
            className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400"
            {...register("password", {
              required: t("fieldRequired", { ns: "common" }),
              minLength: {
                value: 6,
                message: t("passwordTooShort", { ns: "auth" }),
              },
            })}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
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
            <LogIn className="mr-2 h-4 w-4" />
            {t("login.submit", { ns: "auth" })}
          </>
        )}
      </Button>

      <div className="text-center">
        <Button
          type="button"
          variant="link"
          onClick={handlePasswordReset}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
        >
          {t("login.forgotPassword", { ns: "auth" })}
        </Button>
      </div>
    </form>
  );
}
