"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

interface ImageGalleryModalProps {
  images: string[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

export function ImageGalleryModal({
  images,
  isOpen,
  onClose,
  initialIndex = 0,
}: ImageGalleryModalProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

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
          <div className="flex items-center justify-center h-full">
            <img
              src={images[currentIndex]}
              alt={`${t("gallery.image")} ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              onKeyDown={handleKeyDown}
              tabIndex={0}
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
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {currentIndex + 1} / {images.length}
              </div>
            </>
          )}

          {/* Miniaturas */}
          {images.length > 1 && (
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-10 flex gap-2 bg-black/50 p-2 rounded-lg">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                    index === currentIndex
                      ? "border-white"
                      : "border-transparent hover:border-white/50"
                  }`}
                >
                  <img
                    src={image}
                    alt={`${t("gallery.thumbnail")} ${index + 1}`}
                    className="w-full h-full object-cover"
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
