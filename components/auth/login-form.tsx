"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useFormAuth, useToggle, useLoadingSteps } from "@/hooks";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getDoc } from "firebase/firestore";
import { userDoc } from "@/lib/paths";
import { resolveHomePathForRoles } from "@/lib/routes";
import { useRouter } from "next/navigation";
import { ROUTE_ONBOARDING } from "@/lib/routes";

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const router = useRouter();
  const { 
    form,
    t,
    toast,
    handleFirebaseError
  } = useFormAuth<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
    }
  });
  
  const { 
    isLoading, 
    currentStep: loadingStep, 
    startLoading, 
    setStep: setLoadingStep, 
    stopLoading 
  } = useLoadingSteps();
  
  const { value: showPassword, toggle: togglePassword } = useToggle();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = form;

  const email = watch("email");

  const onSubmit = async (data: LoginFormData) => {
    startLoading(t("login.verifyingCredentials", { ns: "auth" }));

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
      // Handle specific field clearing for certain errors
      if (error?.code === "auth/wrong-password") {
        setValue("password", "");
      } else if (error?.code === "auth/user-not-found") {
        setValue("email", "");
      }
      
      // Use standardized Firebase error handling
      handleFirebaseError(error, "login");
    } finally {
      stopLoading();
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
            onClick={togglePassword}
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
          <span className="flex items-center justify-center gap-2">
            {loadingStep}
          </span>
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
