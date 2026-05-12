"use client";

import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  type Ref,
} from "react";
import type { ImageUploadProps, ImageUploadHandle } from "@/types/common";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { storage, auth } from "@/lib/firebase";
import {
  ref as createStorageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { Upload, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { downscaleAndConvert } from "@/lib/image-processing";
import { toast } from "sonner";
import {
  DEFAULT_MAX_SIZE_MB,
  ALLOWED_IMAGE_TYPES,
  IMAGE_ERROR_KEYS,
  generateImageFileName,
  getImageStoragePath,
  validateImageFile,
  getImageAcceptAttribute,
  getTranslatedImageError,
} from "@/lib/image-config";

function ImageUploadComponent(
  {
    onImagesChange,
    maxSizeMB = DEFAULT_MAX_SIZE_MB,
    className,
    buttonSize = "sm",
    enableDropzone = false,
    hideDefaultTrigger = false,
    userId: providedUserId,
    onUploadingChange,
  }: ImageUploadProps,
  ref: Ref<ImageUploadHandle>
) {
  const { t } = useTranslation(["common"]);
  const [uploading, setUploading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dropzoneEnabled = enableDropzone && !isMobile;
  const openFilePicker = () => {
    const input = fileInputRef.current;
    if (!input || uploading) return;

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.click();
  };

  const showUploadError = (message: string) => {
    toast.error(message);
  };

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setUploading(true);

    try {
      const validFiles: File[] = [];
      const errors: string[] = [];

      for (const file of files) {
        const error = validateImageFile(file, maxSizeMB);
        if (error) {
          const translatedError = getTranslatedImageError(error.key, t);
          errors.push(`${file.name}: ${translatedError}`);
        } else {
          validFiles.push(file);
        }
      }

      if (errors.length > 0) {
        console.warn("Image validation errors:", errors.join("\n"));
        showUploadError(errors[0]);
      }

      const newUrls: string[] = [];
      const uploadErrors: string[] = [];
      await Promise.all(
        validFiles.map(async (file) => {
          try {
            const url = await uploadImage(file);
            newUrls.push(url);
          } catch (error) {
            console.error("Error uploading file:", file.name, error);
            uploadErrors.push(
              error instanceof Error
                ? error.message
                : getTranslatedImageError(IMAGE_ERROR_KEYS.UPLOAD_FAILED, t)
            );
          }
        })
      );

      if (uploadErrors.length > 0) {
        showUploadError(uploadErrors[0]);
      }

      if (newUrls.length > 0) {
        try {
          await onImagesChange(newUrls);
        } catch (error) {
          console.error("Error after uploading images:", error);
          showUploadError(getTranslatedImageError(IMAGE_ERROR_KEYS.UPLOAD_FAILED, t));
        }
      }
    } catch (error) {
      console.error("Error in file upload:", error);
      showUploadError(getTranslatedImageError(IMAGE_ERROR_KEYS.UPLOAD_FAILED, t));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  useImperativeHandle(ref, () => ({
    open: openFilePicker,
    uploadFiles: processFiles,
  }));

  // Detect if user is on mobile device
  useEffect(() => {
    if (!enableDropzone) {
      setIsMobile(false);
      return;
    }

    const checkIsMobile = () => {
      const userAgent =
        navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice =
        /android|avantgo|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
          userAgent
        );
      const isSmallScreen = window.innerWidth < 768;
      return isMobileDevice || isSmallScreen;
    };

    setIsMobile(checkIsMobile());

    const handleResize = () => setIsMobile(checkIsMobile());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [enableDropzone]);

  const uploadImage = async (file: File): Promise<string> => {
    const resolvedUserId = providedUserId ?? auth.currentUser?.uid;
    if (!resolvedUserId) {
      throw new Error(getTranslatedImageError(IMAGE_ERROR_KEYS.USER_NOT_AUTHENTICATED, t));
    }

    // Downscale and convert before upload to reduce size
    let processed: File = file;
    try {
      processed = await downscaleAndConvert(file, {
        maxDimension: 1400,
        outputQuality: 0.78,
        preferMimeType: "image/webp",
      });
    } catch (e) {
      // If processing fails, fall back to original file
      console.warn("Image processing failed, using original file", e);
    }

    if (!ALLOWED_IMAGE_TYPES.includes(processed.type as any)) {
      throw new Error(getTranslatedImageError(IMAGE_ERROR_KEYS.INVALID_FILE_TYPE, t));
    }

    const fileName = generateImageFileName(processed.name);
    const storagePath = getImageStoragePath(resolvedUserId, fileName);
    const storageRef = createStorageRef(storage, storagePath);

    const snapshot = await uploadBytes(storageRef, processed, {
      cacheControl: "public,max-age=31536000,immutable",
      contentType: processed.type,
    });
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    await processFiles(files);
  };

  const handleDrop = async (event: React.DragEvent) => {
    if (!dropzoneEnabled) return;
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);

    if (files.length > 0) {
      // Simular selección de archivos
      const dataTransfer = new DataTransfer();
      files.forEach((file) => dataTransfer.items.add(file));

      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
        await handleFileSelect({
          target: { files: dataTransfer.files },
        } as any);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    if (!dropzoneEnabled) return;
    event.preventDefault();
  };

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  return (
    <div className={cn(dropzoneEnabled || !hideDefaultTrigger ? "space-y-3" : undefined, className)}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={getImageAcceptAttribute()}
        onChange={handleFileSelect}
        className="sr-only"
        disabled={uploading}
      />

      {dropzoneEnabled ? (
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
            "hover:border-primary/50 hover:bg-muted/50",
            uploading && "pointer-events-none opacity-50"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={openFilePicker}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openFilePicker();
            }
          }}
          role="button"
          tabIndex={0}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {t("imageUpload.dragDrop", { ns: "common" })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("imageUpload.orClick", { ns: "common" })}
            </p>
          </div>
          <Button
            type="button"
            size={buttonSize}
            onClick={(event) => {
              event.stopPropagation();
              openFilePicker();
            }}
            disabled={uploading}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {uploading
              ? t("imageUpload.uploading", { ns: "common" })
              : t("imageUpload.addPhoto", { ns: "common" })}
          </Button>
        </div>
      ) : (
        !hideDefaultTrigger && (
        <Button
          type="button"
          size={buttonSize}
          onClick={openFilePicker}
          disabled={uploading}
          className="w-full justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {uploading
            ? t("imageUpload.uploading", { ns: "common" })
            : t("imageUpload.addPhoto", { ns: "common" })}
        </Button>
        )
      )}
    </div>
  );
}

export const ImageUpload = forwardRef<ImageUploadHandle, ImageUploadProps>(
  ImageUploadComponent
);

ImageUpload.displayName = "ImageUpload";

export type { ImageUploadHandle } from "@/types/common";
