"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { storage, auth } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Upload, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { downscaleAndConvert } from "@/lib/image-processing";
import {
  DEFAULT_MAX_IMAGES,
  DEFAULT_MAX_SIZE_MB,
  ALLOWED_IMAGE_EXTENSIONS,
  IMAGE_ERROR_KEYS,
  generateImageFileName,
  getImageStoragePath,
  validateImageFile,
  getImageAcceptAttribute,
  getTranslatedImageError,
} from "@/lib/image-config";

interface ImageUploadProps {
  onImagesChange: (urls: string[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  className?: string;
  buttonSize?: "sm" | "default";
}

export function ImageUpload({
  onImagesChange,
  maxImages = DEFAULT_MAX_IMAGES,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  className,
  buttonSize = "sm",
}: ImageUploadProps) {
  const { t } = useTranslation(["common"]);
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect if user is on mobile device
  useEffect(() => {
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
  }, []);

  const uploadImage = async (file: File): Promise<string> => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
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

    const fileName = generateImageFileName(processed.name);
    const storagePath = getImageStoragePath(userId, fileName);
    const storageRef = ref(storage, storagePath);

    const task = uploadBytesResumable(storageRef, processed, {
      cacheControl: "public,max-age=31536000,immutable",
    });
    await new Promise<void>((resolve, reject) => {
      task.on(
        "state_changed",
        () => {},
        (err) => reject(err),
        () => resolve()
      );
    });
    const downloadURL = await getDownloadURL(task.snapshot.ref);

    return downloadURL;
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;

    setUploading(true);

    try {
      const validFiles: File[] = [];
      const errors: string[] = [];

      // Validar archivos
      for (const file of files) {
        const error = validateImageFile(file, maxSizeMB);
        if (error) {
          const translatedError = getTranslatedImageError(error.key, t);
          errors.push(`${file.name}: ${translatedError}`);
        } else {
          validFiles.push(file);
        }
      }

      // Mostrar errores si los hay
      if (errors.length > 0) {
        toast({
          variant: "destructive",
          title: t("imageUpload.validationErrors", { ns: "common" }),
          description: errors.join("\n"),
        });
      }

      // Subir archivos válidos (en paralelo con límite simple)
      const newUrls: string[] = [];
      await Promise.all(
        validFiles.map(async (file) => {
          try {
            const url = await uploadImage(file);
            newUrls.push(url);
          } catch (error) {
            console.error("Error uploading file:", file.name, error);
            toast({
              variant: "destructive",
              title: t("imageUpload.uploadError", { ns: "common" }),
              description: `${file.name}: ${getTranslatedImageError(IMAGE_ERROR_KEYS.UPLOAD_FAILED, t)}`,
            });
          }
        })
      );

      // Llamar callback con las nuevas URLs
      if (newUrls.length > 0) {
        onImagesChange(newUrls);
        toast({
          title: t("imageUpload.uploadSuccess", { ns: "common" }),
          description: `${t("imageUpload.imagesUploaded", { ns: "common" })} ${
            newUrls.length
          }`,
        });
      }
    } catch (error) {
      console.error("Error in file upload:", error);
      toast({
        variant: "destructive",
        title: t("imageUpload.uploadError", { ns: "common" }),
        description: getTranslatedImageError(IMAGE_ERROR_KEYS.UPLOAD_FAILED, t),
      });
    } finally {
      setUploading(false);
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = async (event: React.DragEvent) => {
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
    event.preventDefault();
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Área de drop */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          "hover:border-primary/50 hover:bg-muted/50",
          uploading && "opacity-50 pointer-events-none"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={getImageAcceptAttribute()}
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        <div className="space-y-2">
          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
          <div>
            {isMobile ? (
              <p className="text-sm font-medium">
                {t("imageUpload.tapToSelect", { ns: "common" })}
              </p>
            ) : (
              <>
                <p className="text-sm font-medium">
                  {t("imageUpload.dragDrop", { ns: "common" })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("imageUpload.orClick", { ns: "common" })}
                </p>
              </>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size={buttonSize}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            {uploading
              ? t("imageUpload.uploading", { ns: "common" })
              : t("imageUpload.selectImages", { ns: "common" })}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          {t("imageUpload.allowedTypes", { ns: "common" })}{" "}
          {ALLOWED_IMAGE_EXTENSIONS.join(", ")}
          <br />
          {t("imageUpload.maxSize", { ns: "common" })} {maxSizeMB}MB
          <br />
          {t("imageUpload.maxImages", { ns: "common" })} {maxImages}
        </p>
      </div>
    </div>
  );
}
