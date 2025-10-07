"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useFormAuth, useToggle, useLoadingSteps } from "@/hooks";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
// import ReCAPTCHA from "react-google-recaptcha";
// import { getRecaptchaSiteKey, isRecaptchaEnabled } from "@/lib/recaptcha";

interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface SignupFormProps {
  onSuccess?: () => void;
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const router = useRouter();
  const { 
    form,
    t,
    toast,
    handleFirebaseError
  } = useFormAuth<SignupFormData>({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
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
  const { value: showConfirmPassword, toggle: toggleConfirmPassword } = useToggle();
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [recaptchaError, setRecaptchaError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
    clearErrors,
  } = form;

  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  const handleRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token || "");
    setRecaptchaError("");
  };

  const handleRecaptchaExpired = () => {
    setRecaptchaToken("");
    setRecaptchaError(t("recaptchaExpired", { ns: "auth" }));
  };

  const handleRecaptchaError = () => {
    setRecaptchaToken("");
    setRecaptchaError(t("recaptchaError", { ns: "auth" }));
  };

  const validatePassword = (password: string, confirmPassword: string) => {
    if (password.length < 6) {
      return t("passwordTooShort", { ns: "auth" });
    }
    if (password !== confirmPassword) {
      return t("passwordsDoNotMatch", { ns: "auth" });
    }
    return "";
  };

  const onSubmit = async (data: SignupFormData) => {
    startLoading(t("signup.validatingData", { ns: "auth" }));

    // Validate password match
    const passwordError = validatePassword(data.password, data.confirmPassword);
    if (passwordError) {
      setError("confirmPassword", { message: passwordError });
      stopLoading();
      return;
    }

    // Validate reCAPTCHA only if enabled
    // if (isRecaptchaEnabled() && !recaptchaToken) {
    //   toast({
    //     variant: "destructive",
    //     title: t("signup.error", { ns: "auth" }),
    //     description: t("recaptchaRequired", { ns: "auth" }),
    //   });
    //   stopLoading();
    //   return;
    // }

    try {
      setLoadingStep(t("signup.creatingAccount", { ns: "auth" }));
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const user = userCredential.user;

      setLoadingStep(t("signup.savingData", { ns: "auth" }));
      // Guardar datos del usuario en Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: data.email,
        createdAt: new Date(),
        timezone: null, // Se configurará en onboarding
      });

      // Close the modal immediately after successful signup
      onSuccess?.();

      // Let the auth state change handler in Home component handle navigation
      // to avoid race conditions with competing redirects
    } catch (error: any) {
      handleFirebaseError(error, "signup");
    } finally {
      stopLoading();
    }
  };

  // Real-time password validation
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;

    if (confirmPassword && newPassword !== confirmPassword) {
      setError("confirmPassword", {
        message: t("passwordsDoNotMatch", { ns: "auth" }),
      });
    } else if (newPassword.length > 0 && newPassword.length < 6) {
      setError("password", { message: t("passwordTooShort", { ns: "auth" }) });
    } else {
      clearErrors(["password", "confirmPassword"]);
    }
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newConfirmPassword = e.target.value;

    if (password && newConfirmPassword !== password) {
      setError("confirmPassword", {
        message: t("passwordsDoNotMatch", { ns: "auth" }),
      });
    } else {
      clearErrors("confirmPassword");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t("signup.email", { ns: "auth" })}</Label>
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
                  return t("incompleteEmail", { ns: "validation" });
                }
                if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
                  return t("invalidEmail", { ns: "validation" });
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
        <Label htmlFor="password">{t("signup.password", { ns: "auth" })}</Label>
        <div className="relative">
          <Input
            id="password"
            placeholder="••••••••"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password) || undefined}
            className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400"
            {...register("password", {
              required: t("fieldRequired", { ns: "common" }),
              minLength: {
                value: 6,
                message: t("passwordTooShort", { ns: "auth" }),
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
            onClick={togglePassword}
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
          {t("signup.confirmPassword", { ns: "auth" })}
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            placeholder="••••••••"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword) || undefined}
            className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400"
            {...register("confirmPassword", {
              required: t("fieldRequired", { ns: "common" }),
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
            onClick={toggleConfirmPassword}
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

      {/* {isRecaptchaEnabled() && (
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
      )} */}

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
            <UserPlus className="mr-2 h-4 w-4" />
            {t("signup.submit", { ns: "auth" })}
          </>
        )}
      </Button>
    </form>
  );
}
