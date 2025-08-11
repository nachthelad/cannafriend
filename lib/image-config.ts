// Image upload configuration and utilities
// This file centralizes all image-related constants and functions for reuse across the application

import { buildImageStoragePath as buildFirebaseImagePath } from "./firebase-config";
import { useTranslation } from "@/hooks/use-translation";

// File type configuration
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const ALLOWED_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
] as const;

// Upload limits
export const DEFAULT_MAX_IMAGES = 5;
export const DEFAULT_MAX_SIZE_MB = 10;

// Storage configuration
export const STORAGE_IMAGES_PATH = "images";

// Error messages (can be moved to translations later)
// Provide translated strings via a helper since hooks can't be used directly here
export const getImageUploadErrors = () => {
  try {
    // at runtime in client components, we can get t
    // fallback to Spanish literals if used server-side
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { t } = useTranslation();
    return {
      USER_NOT_AUTHENTICATED: t("imageErrors.userNotAuthenticated"),
      FILE_TOO_LARGE: t("imageErrors.fileTooLarge"),
      INVALID_FILE_TYPE: t("imageErrors.invalidFileType"),
      UPLOAD_FAILED: t("imageErrors.uploadFailed"),
    } as const;
  } catch {
    return {
      USER_NOT_AUTHENTICATED: "Usuario no autenticado",
      FILE_TOO_LARGE: "El archivo es demasiado grande",
      INVALID_FILE_TYPE: "Tipo de archivo no válido",
      UPLOAD_FAILED: "Error al subir el archivo",
    } as const;
  }
};

// Utility functions
export const generateImageFileName = (originalName: string): string => {
  const timestamp = Date.now();
  return `${timestamp}_${originalName}`;
};

export const getImageStoragePath = (
  userId: string,
  fileName: string
): string => {
  return buildFirebaseImagePath(userId, fileName);
};

export const validateImageFile = (
  file: File,
  maxSizeMB: number = DEFAULT_MAX_SIZE_MB
): string | null => {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
    const ERR = getImageUploadErrors();
    return `${ERR.INVALID_FILE_TYPE} ${ALLOWED_IMAGE_EXTENSIONS.join(", ")}`;
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    const ERR = getImageUploadErrors();
    return `${ERR.FILE_TOO_LARGE} ${maxSizeMB}MB`;
  }

  return null;
};

// Image display utilities
export const getImageAltText = (
  index: number,
  context: string = "image"
): string => {
  return `${context} ${index + 1}`;
};

// File input accept attribute
export const getImageAcceptAttribute = (): string => {
  return ALLOWED_IMAGE_TYPES.join(",");
};
