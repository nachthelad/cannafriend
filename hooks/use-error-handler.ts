"use client";

import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";

interface ErrorHandlerOptions {
  showToast?: boolean;
  fallbackMessage?: string;
}

export const useErrorHandler = () => {
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleError = (error: any, options: ErrorHandlerOptions = {}) => {
    const { showToast = true, fallbackMessage } = options;

    // Extract error message
    let errorMessage = fallbackMessage || t("common.unknownError");

    if (error) {
      if (typeof error === "string") {
        errorMessage = error;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.error) {
        errorMessage = error.error;
      } else if (error.errors && Array.isArray(error.errors)) {
        errorMessage = error.errors[0]?.message || errorMessage;
      }
    }

    // Log error for debugging
    console.error("Error occurred:", error);

    // Show toast if requested
    if (showToast) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: errorMessage,
      });
    }

    return errorMessage;
  };

  const handleFirebaseError = (error: any, context?: string) => {
    let errorMessage = t("common.unknownError");

    if (error?.code) {
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = t("auth.userNotFound");
          break;
        case "auth/wrong-password":
          errorMessage = t("auth.wrongPassword");
          break;
        case "auth/email-already-in-use":
          errorMessage = t("auth.emailAlreadyInUse");
          break;
        case "auth/weak-password":
          errorMessage = t("auth.weakPassword");
          break;
        case "auth/invalid-email":
          errorMessage = t("auth.invalidEmail");
          break;
        case "auth/too-many-requests":
          errorMessage = t("auth.tooManyRequests");
          break;
        case "auth/network-request-failed":
          errorMessage = t("auth.networkError");
          break;
        case "permission-denied":
          errorMessage = t("firebase.permissionDenied");
          break;
        case "unavailable":
          errorMessage = t("firebase.unavailable");
          break;
        case "not-found":
          errorMessage = t("firebase.notFound");
          break;
        default:
          errorMessage = error.message || t("common.unknownError");
      }
    } else if (error?.message) {
      errorMessage = error.message;
    }

    console.error(`Firebase error${context ? ` in ${context}` : ""}:`, error);

    toast({
      variant: "destructive",
      title: t("common.error"),
      description: errorMessage,
    });

    return errorMessage;
  };

  const handleValidationError = (errors: any[], context?: string) => {
    const errorMessage =
      errors.length > 0 ? errors[0].message : t("validation.unknownError");

    console.error(
      `Validation error${context ? ` in ${context}` : ""}:`,
      errors
    );

    toast({
      variant: "destructive",
      title: t("validation.error"),
      description: errorMessage,
    });

    return errorMessage;
  };

  return {
    handleError,
    handleFirebaseError,
    handleValidationError,
  };
};
