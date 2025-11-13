"use client";

import type { PlantPhotoGalleryProps } from "@/types/plants";
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import useEmblaCarousel from "embla-carousel-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ImageUpload,
  type ImageUploadHandle,
} from "@/components/common/image-upload";
import { ImageGalleryModal } from "@/components/plant/photos/image-gallery-modal";
import { Loader2, Plus, Star, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import Image from "next/image";

export function PlantPhotoGallery({
  plant,
  onPhotosChange,
  onRemovePhoto,
  onSetCoverPhoto,
  userId,
}: PlantPhotoGalleryProps) {
  const { t } = useTranslation(["plants", "common"]);
  const imageUploadRef = useRef<ImageUploadHandle>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string>(
    () => plant.coverPhoto ?? plant.photos?.[0] ?? ""
  );
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showUploadPrompt, setShowUploadPrompt] = useState(false);

  // Embla Carousel for thumbnails
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
  });

  const photos = plant.photos ?? [];
  const coverPhoto = plant.coverPhoto ?? "";

  // Get all available images (cover + photos, deduplicated)
  const allImages = [...(coverPhoto ? [coverPhoto] : []), ...photos].filter(
    (img, i, arr) => arr.indexOf(img) === i
  );

  const openLightbox = (photoUrl: string) => {
    const index = allImages.findIndex((img) => img === photoUrl);
    setLightboxIndex(index >= 0 ? index : 0);
    setIsLightboxOpen(true);
  };

  const handleOpenUpload = useCallback(() => {
    setShowUploadPrompt(true);
    imageUploadRef.current?.open();
  }, []);

  const handleUploadingChange = useCallback((state: boolean) => {
    setIsUploadingPhoto(state);
    setShowUploadPrompt(state);
  }, []);

  useEffect(() => {
    if (!showUploadPrompt || isUploadingPhoto) return;
    const timeout = setTimeout(() => setShowUploadPrompt(false), 2500);
    return () => clearTimeout(timeout);
  }, [showUploadPrompt, isUploadingPhoto]);

  const showUploadOverlay = isUploadingPhoto || showUploadPrompt;

  return (
    <div className="space-y-6">
      {/* Desktop Gallery */}
      <div className="hidden md:block">
        <div className="border rounded-lg shadow-sm bg-background overflow-hidden">
          <div className="flex">
            {/* Left Thumbnail Gallery */}
            <div className="w-28 border-r bg-muted/50">
              <div className="p-3">
                {allImages.length > 0 && (
                  <div className="space-y-3 max-h-[700px] overflow-y-auto">
                    {allImages.map((photo, idx) => (
                      <div
                        key={idx}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          if (e.detail === 1) {
                            // Single click - select photo
                            setSelectedPhoto(photo);
                          } else if (e.detail === 2) {
                            // Double click - open lightbox
                            openLightbox(photo);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedPhoto(photo);
                          }
                        }}
                        className={`relative w-full aspect-square overflow-hidden rounded-lg border-2 cursor-pointer transition-all`}
                      >
                        <Image
                          src={photo}
                          alt={`${plant.name} ${idx + 1}`}
                          fill
                          className="object-cover"
                          sizes="112px"
                          loading="lazy"
                        />

                        {/* Cover Photo Indicator */}
                        {photo === coverPhoto && (
                          <div className="absolute top-1 left-1">
                            <div className="bg-yellow-500 text-white rounded-full p-1">
                              <Star className="h-3 w-3 fill-current" />
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="absolute inset-0 bg-black/0 transition-colors">
                          <div className="absolute top-1 right-1 flex gap-1">
                            {/* Set as Cover Button */}
                            {photo !== coverPhoto && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-6 w-6 p-0 bg-white/90 "
                                    onClick={(e) => e.stopPropagation()}
                                    aria-label={t("photos.setAsCover", {
                                      ns: "plants",
                                    })}
                                  >
                                    <Star className="h-3 w-3 text-yellow-600" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {t("photos.setCoverConfirmTitle", {
                                        ns: "plants",
                                      })}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t("photos.setCoverConfirmDesc", {
                                        ns: "plants",
                                      })}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      {t("cancel", { ns: "common" })}
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        void onSetCoverPhoto(photo);
                                      }}
                                    >
                                      {t("photos.setAsCover", { ns: "plants" })}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}

                            {/* Delete Photo Button */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  className="h-6 w-6 p-0 bg-white/90"
                                  onClick={(e) => e.stopPropagation()}
                                  aria-label={t("photos.removePhoto", {
                                    ns: "plants",
                                  })}
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {t("photos.removeConfirmTitle", {
                                      ns: "plants",
                                    })}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t("photos.removeConfirmDesc", {
                                      ns: "plants",
                                    })}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    {t("cancel", { ns: "common" })}
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void onRemovePhoto(idx);
                                    }}
                                    className="bg-destructive text-destructive-foreground "
                                  >
                                    {t("deleteConfirm", { ns: "plants" })}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Photo Button */}
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={handleOpenUpload}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Main Image Display */}
            <div className="flex-1">
              <div
                className="relative w-full h-auto aspect-[4/3.6] flex items-center justify-center cursor-pointer group"
                onClick={() => {
                  const currentPhoto = selectedPhoto || coverPhoto || photos[0];
                  if (currentPhoto) {
                    openLightbox(currentPhoto);
                  }
                }}
              >
                {showUploadOverlay && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm text-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-dashed border-primary/50">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                      {t("imageUpload.uploading", { ns: "common" })}
                    </p>
                  </div>
                )}
                {selectedPhoto || coverPhoto || photos[0] ? (
                  <>
                    <Image
                      src={
                        selectedPhoto ||
                        coverPhoto ||
                        photos[0] ||
                        "/placeholder.svg"
                      }
                      alt={plant.name}
                      fill
                      className="object-contain transition-transform "
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                        {t("photos.clickToEnlarge", { ns: "plants" })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-muted-foreground mb-4">
                        {t("photos.noPhotos", { ns: "plants" })}
                      </div>
                      <Button onClick={handleOpenUpload}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t("photos.addFirstPhoto", { ns: "plants" })}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Gallery */}
      <div className="md:hidden">
        <div className="border rounded-lg shadow-sm bg-background overflow-hidden">
          {/* Main Image Display */}
          <div
            className="relative w-full h-auto aspect-[4/3] bg-muted flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            onClick={() => {
              const currentPhoto = selectedPhoto || coverPhoto || photos[0];
              if (currentPhoto) openLightbox(currentPhoto);
            }}
          >
            {showUploadOverlay && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-dashed border-primary/50">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {t("imageUpload.uploading", { ns: "common" })}
                </p>
              </div>
            )}
            {selectedPhoto || coverPhoto || photos[0] ? (
              <Image
                src={
                  selectedPhoto || coverPhoto || photos[0] || "/placeholder.svg"
                }
                alt={plant.name}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-4">
                  <div className="text-muted-foreground mb-4">
                    {t("photos.noPhotos", { ns: "plants" })}
                  </div>
                  <Button onClick={handleOpenUpload}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("photos.addFirstPhoto", { ns: "plants" })}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Thumbnails - Enhanced Horizontal Scroll */}
          {allImages.length > 1 && (
            <div className="p-4">
              <div className="flex gap-3 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory">
                {allImages.map((photo, idx) => (
                  <div
                    key={idx}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedPhoto(photo);
                      openLightbox(photo);
                    }}
                    className={`relative flex-shrink-0 w-20 h-20 overflow-hidden rounded-lg border-2 cursor-pointer transition-all duration-200 active:scale-90 snap-center`}
                  >
                    <Image
                      src={photo}
                      alt={`${plant.name} ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                      loading="lazy"
                    />
                    {photo === coverPhoto && (
                      <div className="absolute top-0.5 left-0.5">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mobile Add Button */}
          <div className="p-4 border-t">
            <Button
              className="w-full h-12 text-base"
              variant="outline"
              onClick={handleOpenUpload}
            >
              <Plus className="mr-2 h-5 w-5" />
              {t("photos.addPhotos", { ns: "plants" })}
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden Image Upload */}
      <ImageUpload
        ref={imageUploadRef}
        onImagesChange={onPhotosChange}
        hideDefaultTrigger
        maxImages={10}
        className="sr-only"
        userId={userId}
        onUploadingChange={handleUploadingChange}
      />

      {/* Lightbox Modal */}
      <ImageGalleryModal
        key={`lightbox-${lightboxIndex}`}
        images={allImages}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        initialIndex={lightboxIndex}
      />
    </div>
  );
}
