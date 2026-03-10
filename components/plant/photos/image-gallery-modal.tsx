"use client";

import type { ImageGalleryModalProps } from "@/types/plants";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getImageAltText } from "@/lib/image-config";
import Image from "next/image";

export function ImageGalleryModal({
  images,
  isOpen,
  onClose,
  initialIndex = 0,
}: ImageGalleryModalProps) {
  const { t } = useTranslation(["plants", "common"]);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Update currentIndex when initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      prevImage();
    } else if (e.key === "ArrowRight") {
      nextImage();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>
            {t("plantPage.photoGallery", { ns: "plants" })}
          </DialogTitle>
        </DialogHeader>
        <div className="relative h-full">
          {/* Botón de cerrar */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 z-10 bg-black/50 text-white hover:bg-black/70"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Imagen principal */}
          <div
            className="relative flex items-center justify-center"
            style={{ height: "70vh" }}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            <Image
              src={images[currentIndex]}
              alt={getImageAltText(currentIndex, t("gallery.image"))}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Navegación */}
          {images.length > 1 && (
            <>
              {/* Botón anterior */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70"
                onClick={prevImage}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Botón siguiente */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70"
                onClick={nextImage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              {/* Indicador de posición */}
              <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                {currentIndex + 1} / {images.length}
              </div>
            </>
          )}

          {/* Miniaturas */}
          {images.length > 1 && (
            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2 bg-black/70 p-2 rounded-lg max-w-sm overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={image}
                  onClick={() => setCurrentIndex(index)}
                  className={`relative w-12 h-12 flex-shrink-0 rounded overflow-hidden border-2 transition-[border-color] ${
                    index === currentIndex
                      ? "border-white"
                      : "border-transparent hover:border-white/50"
                  }`}
                >
                  <Image
                    src={image}
                    alt={getImageAltText(index, t("gallery.thumbnail"))}
                    fill
                    className="object-cover"
                    sizes="48px"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
