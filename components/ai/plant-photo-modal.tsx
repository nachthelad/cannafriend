"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useFirebaseCollection } from "@/hooks/use-firebase-collection";
import { Plant, LogEntry } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";

interface PlantPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhoto: (photoUrl: string, promptText: string) => void;
}

export function PlantPhotoModal({
  isOpen,
  onClose,
  onSelectPhoto,
}: PlantPhotoModalProps) {
  const { t, i18n } = useTranslation(["aiAssistant", "common"]);
  const { user } = useAuthUser();
  const [selectedPhoto, setSelectedPhoto] = useState<{
    url: string;
    plant: Plant;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch plants for the current user
  const { data: plants, loading: plantsLoading } = useFirebaseCollection<Plant>(
    "users/{userId}/plants",
    {
      enabled: isOpen && !!user,
    },
  );

  // Filter plants that have at least one photo
  const plantsWithPhotos = plants.filter(
    (p) => p.photos && p.photos.length > 0,
  );

  // Reset selection when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedPhoto(null);
      setIsProcessing(false);
    }
  }, [isOpen]);

  const handleSelect = async () => {
    if (!selectedPhoto || !user) return;
    setIsProcessing(true);

    try {
      // Fetch latest logs to find humidity and watering
      const logsRef = collection(
        db,
        "users",
        user.uid,
        "plants",
        selectedPhoto.plant.id,
        "logs",
      );

      // We need recent logs. We can just fetch the last 20 logs and find what we need
      const logsQuery = query(logsRef, orderBy("date", "desc"), limit(20));
      const snapshot = await getDocs(logsQuery);

      let lastWateredDate = "unknown";

      snapshot.forEach((doc) => {
        const log = doc.data() as LogEntry;
        if (log.type === "watering" && lastWateredDate === "unknown") {
          const dateLocale = i18n.language?.startsWith("es") ? es : enUS;
          lastWateredDate = format(new Date(log.date), "PPP", {
            locale: dateLocale,
          });
        }
      });

      const wateringContext =
        lastWateredDate !== "unknown"
          ? t("lastWatered", { date: lastWateredDate })
          : t("noWateringData");

      // Construct prompt
      const promptText = t("plantSelectionContext", {
        plantName: selectedPhoto.plant.name,
        wateringContext,
        defaultValue: "Here is a photo of my plant", // Fallback if translation fails
      });

      onSelectPhoto(selectedPhoto.url, promptText);
      onClose();
    } catch (error) {
      console.error("Error fetching logs for photo context:", error);
      // Fallback
      onSelectPhoto(
        selectedPhoto.url,
        `Here is a photo of ${selectedPhoto.plant.name}. How does it look?`,
      );
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("selectPlantPhoto")}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-[300px] p-4 overflow-y-auto">
          {plantsLoading ? (
            <div className="flex justify-center items-center h-full min-h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : plantsWithPhotos.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {t("noPhotosAvailable")}
            </div>
          ) : (
            <div className="space-y-6">
              {plantsWithPhotos.map((plant) => (
                <div key={plant.id} className="space-y-3">
                  <h3 className="font-medium text-sm text-muted-foreground">
                    {plant.name}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {plant.photos?.map((photoUrl, index) => (
                      <div
                        key={index}
                        className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          selectedPhoto?.url === photoUrl
                            ? "border-primary ring-2 ring-primary ring-offset-2"
                            : "border-transparent hover:border-primary/50"
                        }`}
                        onClick={() =>
                          setSelectedPhoto({ url: photoUrl, plant })
                        }
                      >
                        <Image
                          src={photoUrl}
                          alt={`${plant.name} photo ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 33vw, 25vw"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSelect}
            disabled={!selectedPhoto || isProcessing}
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("usePhoto")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
