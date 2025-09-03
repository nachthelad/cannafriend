// Image upload configuration and utilities
// This file centralizes all image-related constants and functions for reuse across the application

import { buildImageStoragePath as buildFirebaseImagePath } from "./firebase-config";

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

// Error message keys (to be used with t() function in components)
export const IMAGE_ERROR_KEYS = {
  USER_NOT_AUTHENTICATED: "imageErrors.userNotAuthenticated",
  FILE_TOO_LARGE: "imageErrors.fileTooLarge", 
  INVALID_FILE_TYPE: "imageErrors.invalidFileType",
  UPLOAD_FAILED: "imageErrors.uploadFailed",
} as const;

// Fallback error messages (for server-side or when translations are not available)
export const IMAGE_ERROR_FALLBACKS = {
  USER_NOT_AUTHENTICATED: "Usuario no autenticado",
  FILE_TOO_LARGE: "El archivo es demasiado grande", 
  INVALID_FILE_TYPE: "Tipo de archivo no válido",
  UPLOAD_FAILED: "Error al subir el archivo",
} as const;

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

// Validation function that returns error key and fallback message
export const validateImageFile = (
  file: File,
  maxSizeMB: number = DEFAULT_MAX_SIZE_MB
): { key: string; fallback: string } | null => {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
    return {
      key: IMAGE_ERROR_KEYS.INVALID_FILE_TYPE,
      fallback: `${IMAGE_ERROR_FALLBACKS.INVALID_FILE_TYPE}: ${ALLOWED_IMAGE_EXTENSIONS.join(", ")}`
    };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      key: IMAGE_ERROR_KEYS.FILE_TOO_LARGE,
      fallback: `${IMAGE_ERROR_FALLBACKS.FILE_TOO_LARGE}: ${maxSizeMB}MB`
    };
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

// Helper function to get translated error message (to be used in components with t function)
export const getTranslatedImageError = (
  errorKey: string, 
  t: (key: string, options?: any) => string,
  ...args: any[]
): string => {
  try {
    return t(errorKey, { ns: "common" }) + (args.length > 0 ? `: ${args.join(" ")}` : "");
  } catch {
    // Fallback to Spanish if translation fails
    const fallbackMap: Record<string, string> = IMAGE_ERROR_FALLBACKS;
    const fallbackKey = errorKey.split(".").pop() as keyof typeof IMAGE_ERROR_FALLBACKS;
    return fallbackMap[fallbackKey] || errorKey;
  }
};
