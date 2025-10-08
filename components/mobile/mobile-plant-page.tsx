"use client";

import type { MobilePlantPageProps } from "@/types/mobile";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import type { Plant, LogEntry } from "@/types";
import {
  Leaf,
  ArrowLeft,
  Droplet,
  Zap,
  Thermometer,
  Sun,
  Plus,
  Camera,
  Menu,
  FileText,
  Trash2,
  Star,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { differenceInDays, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import { InlineEdit } from "@/components/common/inline-edit";
import { updateDoc, doc } from "firebase/firestore";
import { plantDoc } from "@/lib/paths";
import { ROUTE_PLANTS } from "@/lib/routes";
import {
  invalidatePlantDetails,
  invalidatePlantsCache,
} from "@/lib/suspense-cache";

export function MobilePlantPage({
  plant,
  userId,
  lastWatering,
  lastFeeding,
  lastTraining,
  lastEnvironment,
  onAddPhoto,
  onRemovePhoto,
  onSetCoverPhoto,
  onUpdate,
  language,
}: MobilePlantPageProps) {
  const { t } = useTranslation(["plants", "common"]);
  const router = useRouter();
  const [showFullImage, setShowFullImage] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Get all available images (coverPhoto + photos)
  const allImages = [
    ...(plant.coverPhoto ? [plant.coverPhoto] : []),
    ...(plant.photos || []),
  ].filter((img, index, arr) => arr.indexOf(img) === index); // Remove duplicates

  const hasMultipleImages = allImages.length > 1;

  // Calculate days since planting
  const daysSincePlanting = plant.plantingDate
    ? differenceInDays(new Date(), parseISO(plant.plantingDate))
    : 0;

  const handleBack = () => {
    router.push(ROUTE_PLANTS);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + allImages.length) % allImages.length
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  // Touch handlers for swipe navigation
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && hasMultipleImages) {
      handleNextImage();
    }
    if (isRightSwipe && hasMultipleImages) {
      handlePrevImage();
    }
  };

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <div className="relative">
        {/* Plant Image */}
        <div
          className="relative h-80 w-full overflow-hidden rounded-xl"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {allImages.length > 0 ? (
            <>
              <Image
                src={allImages[currentImageIndex]}
                alt={plant.name}
                fill
                className="object-cover"
                onClick={() => setShowFullImage(true)}
              />
              {/* Image Counter */}
              {hasMultipleImages && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-full">
                  <span className="text-white text-xs font-medium">
                    {currentImageIndex + 1} / {allImages.length}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="h-full bg-gradient-to-br from-green-600/30 to-emerald-700/40 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <Leaf className="h-24 w-24 text-green-400/60" />
              </div>
            </div>
          )}

          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Navigation Header */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="h-10 w-10 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 p-0"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </Button>
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 p-0"
                >
                  <Menu className="h-5 w-5 text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onAddPhoto && (
                  <DropdownMenuItem
                    onClick={() => onAddPhoto(plant)}
                    className="text-slate-200 "
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {t("photos.addPhotos", { ns: "plants" })}
                  </DropdownMenuItem>
                )}
                {onSetCoverPhoto &&
                  allImages.length > 0 &&
                  allImages[currentImageIndex] !== plant.coverPhoto && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          onSelect={(e) => e.preventDefault()}
                          className="text-yellow-400"
                        >
                          <Star className="h-4 w-4 mr-2" />
                          {t("photos.setAsCover", { ns: "plants" })}
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-slate-200">
                            {t("photos.setCoverConfirmTitle", { ns: "plants" })}
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-slate-400">
                            {t("photos.setCoverConfirmDesc", { ns: "plants" })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="text-slate-200 ">
                            {t("cancel", { ns: "common" })}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              onSetCoverPhoto(allImages[currentImageIndex]);
                              setMenuOpen(false);
                            }}
                            className="bg-yellow-600 text-white "
                          >
                            {t("photos.setAsCover", { ns: "plants" })}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                {onRemovePhoto && allImages.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-red-400  "
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t("photos.deletePhoto", { ns: "plants" })}
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-200">
                          {t("photos.removeConfirmTitle", { ns: "plants" })}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                          {t("photos.removeConfirmDesc", { ns: "plants" })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="text-slate-200 ">
                          {t("cancel", { ns: "common" })}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            onRemovePhoto(currentImageIndex);
                            setMenuOpen(false);
                          }}
                          className="bg-red-600 text-white "
                        >
                          {t("delete", { ns: "common" })}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Plant Name and Day Counter */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-end justify-between">
              <div>
                <div className="mb-2 max-w-[calc(100vw-8rem)] pr-2">
                  <InlineEdit
                    value={plant.name}
                    onSave={async (newName) => {
                      await updateDoc(plantDoc(userId, plant.id), {
                        name: newName,
                      });
                      invalidatePlantDetails(userId, plant.id);
                      invalidatePlantsCache(userId);
                      onUpdate?.({ name: newName });
                    }}
                    placeholder={t("newPlant.namePlaceholder", {
                      ns: "plants",
                    })}
                    className="text-2xl font-bold text-white drop-shadow-lg uppercase rounded-md py-1 truncate block w-full"
                    inputClassName="text-lg font-bold text-white bg-black/50 border-white/30 rounded-lg py-2 backdrop-blur-sm placeholder-white/60 w-full max-w-full"
                  />
                </div>
                <div className="flex items-center text-lg text-green-400 font-bold drop-shadow">
                  <span>
                    {t("plantPage.day", { ns: "plants" })} {daysSincePlanting}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <Badge
                  variant="outline"
                  className="bg-green-500/20 text-green-400 border-green-500/50 backdrop-blur-sm"
                >
                  {plant.seedType === "autoflowering"
                    ? t("seedType.autoflowering", { ns: "plants" })
                    : t("seedType.photoperiodic", { ns: "plants" })}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-2 py-5 space-y-6">
        {/* Plant Status Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-green-400 tracking-wide uppercase">
              {t("plantPage.plantStatus", { ns: "plants" })}
            </h3>
          </div>

          {/* Status Grid */}
          <div className="space-y-4">
            {/* Temperature & Humidity Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Thermometer className="h-5 w-5 text-blue-400" />
                  <span className="text-white font-bold text-lg">
                    {lastEnvironment?.temperature
                      ? `${lastEnvironment.temperature}°`
                      : "73°"}
                  </span>
                  <span className="text-blue-400 text-sm">Cº</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Droplet className="h-5 w-5 text-blue-400" />
                  <span className="text-white font-bold text-lg">
                    {lastEnvironment?.humidity
                      ? `${lastEnvironment.humidity}`
                      : "50"}
                  </span>
                  <span className="text-blue-400 text-sm">%</span>
                </div>
              </div>
              {lastWatering && (
                <div className="text-right">
                  <div className="text-xs text-green-400 font-medium uppercase">
                    {t("plantPage.watered", { ns: "plants" })}:
                  </div>
                  <div className="text-white text-sm">
                    {Math.abs(
                      differenceInDays(new Date(), parseISO(lastWatering.date))
                    )}{" "}
                    {t("plantPage.dayAgo", { ns: "plants" })}
                  </div>
                </div>
              )}
            </div>

            {/* Lighting Row */}
            <div className="space-y-2">
              <div className="text-xs text-slate-400 font-medium uppercase">
                {t("plantPage.lighting", { ns: "plants" })}
              </div>
              <div className="flex items-center space-x-2">
                <Sun className="h-5 w-5 text-yellow-400" />
                <span className="text-white font-bold text-lg">
                  {plant.lightSchedule || "18h"}
                </span>
              </div>
            </div>

            {/* Nutrients Row */}
            <div className="space-y-2">
              <div className="text-xs text-slate-400 font-medium uppercase">
                {t("plantPage.nutrients", { ns: "plants" })}
              </div>
              <div className="space-y-2">
                {lastFeeding && (
                  <div className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-green-400" />
                    <span className="text-white font-bold">
                      {t("plantPage.npk", { ns: "plants" })}:{" "}
                      {lastFeeding.npk || "6.5"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* pH Row */}
            {lastEnvironment?.ph !== undefined && (
              <div className="space-y-2">
                <div className="text-xs text-slate-400 font-medium uppercase">
                  {t("plantPage.ph", { ns: "plants" })}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                  <span className="text-white font-bold">
                    {lastEnvironment.ph}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-center space-x-4 pt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-12"
            onClick={() => router.push(`/plants/${plant.id}/logs`)}
          >
            <FileText className="h-4 w-4 mr-2" />
            {t("viewLogs", { ns: "journal" })}
          </Button>
          <Button
            className="bg-green-600 text-white flex-1 h-12"
            onClick={() => router.push(`/plants/${plant.id}/add-log`)}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("addLog", { ns: "journal" })}
          </Button>
        </div>

        {/* Plant Info */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">
              {t("plantPage.seedType", { ns: "plants" })}
            </span>
            <div className="text-white font-medium">
              <Select
                value={plant.seedType}
                onValueChange={async (
                  value: "autoflowering" | "photoperiodic"
                ) => {
                  await updateDoc(plantDoc(userId, plant.id), {
                    seedType: value,
                  });
                  invalidatePlantDetails(userId, plant.id);
                  invalidatePlantsCache(userId);
                  onUpdate?.({ seedType: value });
                }}
              >
                <SelectTrigger className="w-auto border-none bg-transparent text-white rounded-2xl px-4 py-1 h-auto font-medium dark:bg-background">
                  <SelectValue>
                    {plant.seedType === "autoflowering"
                      ? t("seedType.autoflowering", { ns: "plants" })
                      : t("seedType.photoperiodic", { ns: "plants" })}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="autoflowering" className="text-slate-200 ">
                    {t("seedType.autoflowering", { ns: "plants" })}
                  </SelectItem>
                  <SelectItem value="photoperiodic" className="text-slate-200 ">
                    {t("seedType.photoperiodic", { ns: "plants" })}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">
              {t("plantPage.growType", { ns: "plants" })}
            </span>
            <div className="text-white font-medium">
              <Select
                value={plant.growType}
                onValueChange={async (value: "indoor" | "outdoor") => {
                  await updateDoc(plantDoc(userId, plant.id), {
                    growType: value,
                  });
                  invalidatePlantDetails(userId, plant.id);
                  invalidatePlantsCache(userId);
                  onUpdate?.({ growType: value });
                }}
              >
                <SelectTrigger className="w-auto border-none bg-transparent text-white rounded-2xl px-4 py-1 h-auto font-medium dark:bg-background">
                  <SelectValue>
                    {plant.growType === "indoor"
                      ? t("growType.indoor", { ns: "plants" })
                      : t("growType.outdoor", { ns: "plants" })}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indoor" className="text-slate-200 ">
                    {t("growType.indoor", { ns: "plants" })}
                  </SelectItem>
                  <SelectItem value="outdoor" className="text-slate-200 ">
                    {t("growType.outdoor", { ns: "plants" })}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 text-sm flex-shrink-0">
              {t("plantPage.seedBank", { ns: "plants" })}
            </span>
            <div className="text-white font-medium flex-1 text-right min-w-0">
              <InlineEdit
                value={plant.seedBank || ""}
                onSave={async (newBank) => {
                  await updateDoc(plantDoc(userId, plant.id), {
                    seedBank: newBank,
                  });
                  invalidatePlantDetails(userId, plant.id);
                  invalidatePlantsCache(userId);
                  onUpdate?.({ seedBank: newBank });
                }}
                placeholder={t("newPlant.seedBankPlaceholder", {
                  ns: "plants",
                })}
                className="text-white font-medium rounded-xl px-2 py-1"
                inputClassName="text-white bg-black/50 border-white/30 rounded-xl px-3 py-1 backdrop-blur-sm placeholder-white/60 w-full max-w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Full Image Modal */}
      {showFullImage && allImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowFullImage(false)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="relative max-w-full max-h-full">
            <Image
              src={allImages[currentImageIndex]}
              alt={plant.name}
              width={400}
              height={600}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            {/* Delete button in full screen */}
            {onRemovePhoto && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-5 w-5 text-white" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-slate-200">
                      {t("photos.removeConfirmTitle", { ns: "plants" })}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-400">
                      {t("photos.removeConfirmDesc", { ns: "plants" })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="text-slate-200">
                      {t("cancel", { ns: "common" })}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        onRemovePhoto(currentImageIndex);
                        setShowFullImage(false);
                      }}
                      className="bg-red-600 text-white"
                    >
                      {t("delete", { ns: "common" })}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* Counter in full screen */}
            {hasMultipleImages && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-2 bg-black/60 backdrop-blur-sm rounded-full">
                <span className="text-white text-sm font-medium">
                  {currentImageIndex + 1} / {allImages.length}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
