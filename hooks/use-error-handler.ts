"use client";

import { useTranslation } from "react-i18next";

interface ErrorHandlerOptions {
  showToast?: boolean;
  fallbackMessage?: string;
}

type FirebaseLikeError = {
  code?: string;
  message?: string;
  error?: string;
  errors?: { message?: string }[];
};

function toFirebaseError(error: unknown): FirebaseLikeError {
  if (error && typeof error === "object") return error as FirebaseLikeError;
  if (typeof error === "string") return { message: error };
  return {};
}

export const useErrorHandler = () => {
  const { t } = useTranslation(["auth", "common", "validation"]);

  const handleError = (error: unknown, options: ErrorHandlerOptions = {}) => {
    const { fallbackMessage } = options;
    const e = toFirebaseError(error);

    let errorMessage = fallbackMessage || t("unknownError", { ns: "common" });

    if (error) {
      if (typeof error === "string") {
        errorMessage = error;
      } else if (e.message) {
        errorMessage = e.message;
      } else if (e.error) {
        errorMessage = e.error;
      } else if (e.errors && Array.isArray(e.errors)) {
        errorMessage = e.errors[0]?.message || errorMessage;
      }
    }

    console.error("Error occurred:", error);

    return errorMessage;
  };

  const handleFirebaseError = (error: unknown, context?: string) => {
    const e = toFirebaseError(error);
    let errorMessage = t("unknownError", { ns: "common" });

    if (e.code) {
      switch (e.code) {
        case "auth/user-not-found":
          errorMessage = t("userNotFound", { ns: "auth" });
          break;
        case "auth/wrong-password":
          errorMessage = t("wrongPassword", { ns: "auth" });
          break;
        case "auth/email-already-in-use":
          errorMessage = t("emailAlreadyInUse", { ns: "auth" });
          break;
        case "auth/weak-password":
          errorMessage = t("weakPassword", { ns: "auth" });
          break;
        case "auth/invalid-email":
          errorMessage = t("invalidEmail", { ns: "auth" });
          break;
        case "auth/too-many-requests":
          errorMessage = t("tooManyRequests", { ns: "auth" });
          break;
        case "auth/network-request-failed":
          errorMessage = t("networkError", { ns: "auth" });
          break;
        case "permission-denied":
          errorMessage = t("firebase.permissionDenied", { ns: "common" });
          break;
        case "unavailable":
          errorMessage = t("firebase.unavailable", { ns: "common" });
          break;
        case "not-found":
          errorMessage = t("firebase.notFound", { ns: "common" });
          break;
        default:
          errorMessage = e.message || t("unknownError", { ns: "common" });
      }
    } else if (e.message) {
      errorMessage = e.message;
    }

    console.error(`Firebase error${context ? ` in ${context}` : ""}:`, error);

    return errorMessage;
  };

  const handleValidationError = (errors: any[], context?: string) => {
    const errorMessage =
      errors.length > 0
        ? errors[0].message
        : t("unknownError", { ns: "validation" });

    console.error(
      `Validation error${context ? ` in ${context}` : ""}:`,
      errors
    );

    return errorMessage;
  };

  return {
    handleError,
    handleFirebaseError,
    handleValidationError,
  };
};
