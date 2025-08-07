"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { storage, auth } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Upload, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_MAX_IMAGES,
  DEFAULT_MAX_SIZE_MB,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_IMAGE_EXTENSIONS,
  STORAGE_IMAGES_PATH,
  IMAGE_UPLOAD_ERRORS,
  generateImageFileName,
  getImageStoragePath,
  validateImageFile,
  getImageAcceptAttribute,
} from "@/lib/image-config";

interface ImageUploadProps {
  onImagesChange: (urls: string[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  className?: string;
}

export function ImageUpload({
  onImagesChange,
  maxImages = DEFAULT_MAX_IMAGES,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  className,
}: ImageUploadProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File): Promise<string> => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error(IMAGE_UPLOAD_ERRORS.USER_NOT_AUTHENTICATED);
    }

    const fileName = generateImageFileName(file.name);
    const storagePath = getImageStoragePath(userId, fileName);
    const storageRef = ref(storage, storagePath);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

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
          errors.push(`${file.name}: ${error}`);
        } else {
          validFiles.push(file);
        }
      }

      // Mostrar errores si los hay
      if (errors.length > 0) {
        toast({
          variant: "destructive",
          title: t("imageUpload.validationErrors"),
          description: errors.join("\n"),
        });
      }

      // Subir archivos válidos
      const newUrls: string[] = [];
      for (const file of validFiles) {
        try {
          const url = await uploadImage(file);
          newUrls.push(url);
        } catch (error) {
          console.error("Error uploading file:", file.name, error);
          toast({
            variant: "destructive",
            title: t("imageUpload.uploadError"),
            description: `${file.name}: ${t("imageUpload.uploadFailed")}`,
          });
        }
      }

      // Llamar callback con las nuevas URLs
      if (newUrls.length > 0) {
        onImagesChange(newUrls);
        toast({
          title: t("imageUpload.uploadSuccess"),
          description: `${t("imageUpload.imagesUploaded")} ${newUrls.length}`,
        });
      }
    } catch (error) {
      console.error("Error in file upload:", error);
      toast({
        variant: "destructive",
        title: t("imageUpload.uploadError"),
        description: t("imageUpload.uploadFailed"),
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
            <p className="text-sm font-medium">{t("imageUpload.dragDrop")}</p>
            <p className="text-xs text-muted-foreground">
              {t("imageUpload.orClick")}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            {uploading
              ? t("imageUpload.uploading")
              : t("imageUpload.selectImages")}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          {t("imageUpload.allowedTypes")} {ALLOWED_IMAGE_EXTENSIONS.join(", ")}
          <br />
          {t("imageUpload.maxSize")} {maxSizeMB}MB
          <br />
          {t("imageUpload.maxImages")} {maxImages}
        </p>
      </div>
    </div>
  );
}
