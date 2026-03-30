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
  const { t } = useTranslation(["common"]);

  const handleError = (error: unknown, options: ErrorHandlerOptions = {}) => {
    const { fallbackMessage } = options;
    const e = toFirebaseError(error);

    let errorMessage = fallbackMessage || t("common.unknownError");

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
    let errorMessage = t("common.unknownError");

    if (e.code) {
      switch (e.code) {
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
          errorMessage = e.message || t("common.unknownError");
      }
    } else if (e.message) {
      errorMessage = e.message;
    }

    console.error(`Firebase error${context ? ` in ${context}` : ""}:`, error);

    return errorMessage;
  };

  const handleValidationError = (errors: any[], context?: string) => {
    const errorMessage =
      errors.length > 0 ? errors[0].message : t("validation.unknownError");

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
