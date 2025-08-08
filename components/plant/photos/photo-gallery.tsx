"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/use-translation";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Crown } from "lucide-react";
import { ImageUpload } from "@/components/common/image-upload";
import {
  DEFAULT_MAX_IMAGES,
  DEFAULT_MAX_SIZE_MB,
  getImageAltText,
} from "@/lib/image-config";
import { ImageGalleryModal } from "@/components/plant/photos/image-gallery-modal";

interface PhotoGalleryProps {
  photos: string[];
  plantId: string;
  coverPhoto?: string;
  onPhotosUpdate?: (photos: string[]) => void;
  onCoverPhotoUpdate?: (coverPhoto: string) => void;
}

export function PhotoGallery({
  photos,
  plantId,
  coverPhoto,
  onPhotosUpdate,
  onCoverPhotoUpdate,
}: PhotoGalleryProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [showUpload, setShowUpload] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const handlePhotosChange = async (newPhotos: string[]) => {
    if (!auth.currentUser) return;

    try {
      // Combine existing photos with new ones
      const allPhotos = [...photos, ...newPhotos];

      // Update photos in Firestore
      await updateDoc(
        doc(db, "users", auth.currentUser.uid, "plants", plantId),
        {
          photos: allPhotos,
        }
      );

      // Call callback to update parent component
      if (onPhotosUpdate) {
        onPhotosUpdate(allPhotos);
      }

      toast({
        title: t("photos.uploadSuccess"),
        description: t("photos.photosUpdated"),
      });

      setShowUpload(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("photos.uploadError"),
        description: error.message,
      });
    }
  };

  const openGallery = (images: string[], index: number) => {
    setGalleryImages(images);
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const removePhoto = async (photoIndex: number) => {
    if (!auth.currentUser) return;

    const newPhotos = photos.filter((_, index) => index !== photoIndex);
    const photoToRemove = photos[photoIndex];

    try {
      // If the photo being removed is the cover photo, clear the cover photo
      let coverPhotoUpdate = {};
      if (photoToRemove === coverPhoto) {
        coverPhotoUpdate = { coverPhoto: null };
        if (onCoverPhotoUpdate) {
          onCoverPhotoUpdate("");
        }
      }

      await updateDoc(
        doc(db, "users", auth.currentUser.uid, "plants", plantId),
        {
          photos: newPhotos,
          ...coverPhotoUpdate,
        }
      );

      if (onPhotosUpdate) {
        onPhotosUpdate(newPhotos);
      }

      toast({
        title: t("photos.removeSuccess"),
        description: t("photos.photoRemoved"),
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("photos.removeError"),
        description: error.message,
      });
    }
  };

  const setCoverPhoto = async (photoUrl: string) => {
    if (!auth.currentUser) return;

    try {
      await updateDoc(
        doc(db, "users", auth.currentUser.uid, "plants", plantId),
        {
          coverPhoto: photoUrl,
        }
      );

      if (onCoverPhotoUpdate) {
        onCoverPhotoUpdate(photoUrl);
      }

      toast({
        title: t("photos.coverPhotoSet"),
        description: t("photos.coverPhotoSetDesc"),
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("photos.coverPhotoError"),
        description: error.message,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con botón de subir */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t("photos.title")}</h3>
          <p className="text-sm text-muted-foreground">
            {photos.length}{" "}
            {photos.length === 1 ? t("photos.photo") : t("photos.photos")}
          </p>
        </div>
        <Button onClick={() => setShowUpload(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("photos.addPhotos")}
        </Button>
      </div>

      {/* Galería de fotos */}
      {photos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          <p className="text-lg font-medium">{t("photos.noPhotos")}</p>
          <p className="text-sm mt-1">{t("photos.noPhotosDesc")}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setShowUpload(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("photos.addFirstPhoto")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="aspect-square relative rounded-lg overflow-hidden cursor-pointer border group"
            >
              <Image
                src={photo || "/placeholder.svg"}
                alt={getImageAltText(index, t("photos.plantPhoto"))}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                onClick={() => openGallery(photos, index)}
                loading="lazy"
              />

              {/* Indicador de foto de portada */}
              {photo === coverPhoto && (
                <div className="absolute top-2 left-2 bg-yellow-500 text-white p-1 rounded-full">
                  <Crown className="h-3 w-3" />
                </div>
              )}

              {/* Botón de eliminar */}
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  removePhoto(index);
                }}
              >
                <X className="h-3 w-3" />
              </Button>

              {/* Botón de establecer como portada */}
              {photo !== coverPhoto && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-2 left-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCoverPhoto(photo);
                  }}
                  title={t("photos.setAsCover")}
                >
                  <Crown className="h-3 w-3 text-yellow-600" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de subida de fotos */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("photos.uploadPhotos")}</DialogTitle>
          </DialogHeader>
          <ImageUpload
            onImagesChange={handlePhotosChange}
            maxImages={DEFAULT_MAX_IMAGES}
            maxSizeMB={DEFAULT_MAX_SIZE_MB}
            className="mt-4"
          />
        </DialogContent>
      </Dialog>

      {/* Modal de galería */}
      <ImageGalleryModal
        images={galleryImages}
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        initialIndex={galleryIndex}
      />
    </div>
  );
}
