"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, UserPlus } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import ReCAPTCHA from "react-google-recaptcha";
import { getRecaptchaSiteKey, isRecaptchaEnabled } from "@/lib/recaptcha";

interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface SignupFormProps {
  onSuccess?: () => void;
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const { handleFirebaseError } = useErrorHandler();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [recaptchaError, setRecaptchaError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
    clearErrors,
  } = useForm<SignupFormData>({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  const handleRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token || "");
    setRecaptchaError("");
  };

  const handleRecaptchaExpired = () => {
    setRecaptchaToken("");
    setRecaptchaError(t("signup.recaptchaExpired"));
  };

  const handleRecaptchaError = () => {
    setRecaptchaToken("");
    setRecaptchaError(t("signup.recaptchaError"));
  };

  const validatePassword = (password: string, confirmPassword: string) => {
    if (password.length < 6) {
      return t("signup.passwordTooShort");
    }
    if (password !== confirmPassword) {
      return t("signup.passwordsDoNotMatch");
    }
    return "";
  };

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setLoadingStep(t("signup.validatingData"));

    // Validate password match
    const passwordError = validatePassword(data.password, data.confirmPassword);
    if (passwordError) {
      setError("confirmPassword", { message: passwordError });
      setIsLoading(false);
      return;
    }

    // Validate reCAPTCHA only if enabled
    if (isRecaptchaEnabled() && !recaptchaToken) {
      toast({
        variant: "destructive",
        title: t("signup.error"),
        description: t("signup.recaptchaRequired"),
      });
      setIsLoading(false);
      return;
    }

    try {
      setLoadingStep(t("signup.creatingAccount"));
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const user = userCredential.user;

      setLoadingStep(t("signup.savingData"));
      // Guardar datos del usuario en Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: data.email,
        createdAt: new Date(),
        timezone: null, // Se configurará en onboarding
      });

      router.push("/onboarding");
      onSuccess?.();
    } catch (error: any) {
      handleFirebaseError(error, "signup");
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time password validation
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;

    if (confirmPassword && newPassword !== confirmPassword) {
      setError("confirmPassword", { message: t("signup.passwordsDoNotMatch") });
    } else if (newPassword.length > 0 && newPassword.length < 6) {
      setError("password", { message: t("signup.passwordTooShort") });
    } else {
      clearErrors(["password", "confirmPassword"]);
    }
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newConfirmPassword = e.target.value;

    if (password && newConfirmPassword !== password) {
      setError("confirmPassword", { message: t("signup.passwordsDoNotMatch") });
    } else {
      clearErrors("confirmPassword");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t("signup.email")}</Label>
        <Input
          id="email"
          type="email"
          placeholder="ejemplo@correo.com"
          className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400"
          {...register("email", {
            required: t("common.fieldRequired"),
            validate: {
              completeEmail: (value) => {
                if (!value) return t("common.fieldRequired");
                if (
                  value.includes("@") &&
                  (value.endsWith("@") || value.split("@")[1]?.length === 0)
                ) {
                  return t("auth.incompleteEmail");
                }
                if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
                  return t("auth.invalidEmail");
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
        <Label htmlFor="password">{t("signup.password")}</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400"
            {...register("password", {
              required: t("common.fieldRequired"),
              minLength: {
                value: 6,
                message: t("signup.passwordTooShort"),
              },
            })}
            onChange={(e) => {
              register("password").onChange(e);
              handlePasswordChange(e);
            }}
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
        <Label htmlFor="confirmPassword">{t("signup.confirmPassword")}</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400"
            {...register("confirmPassword", {
              required: t("common.fieldRequired"),
            })}
            onChange={(e) => {
              register("confirmPassword").onChange(e);
              handleConfirmPasswordChange(e);
            }}
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

      {isRecaptchaEnabled() && (
        <>
          <div className="flex justify-center">
            <ReCAPTCHA
              sitekey={getRecaptchaSiteKey()}
              onChange={handleRecaptchaChange}
              onExpired={handleRecaptchaExpired}
              onError={handleRecaptchaError}
              theme="light"
            />
          </div>
          {recaptchaError && (
            <Alert variant="destructive">
              <AlertDescription>{recaptchaError}</AlertDescription>
            </Alert>
          )}
        </>
      )}

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
            <UserPlus className="mr-2 h-4 w-4" />
            {t("signup.submit")}
          </>
        )}
      </Button>
    </form>
  );
}
