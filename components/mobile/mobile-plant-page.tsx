"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Camera,
  Droplet,
  FileText,
  Leaf,
  Loader2,
  Menu,
  Plus,
  Star,
  Thermometer,
  Trash2,
  Sun,
  Zap,
} from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import { updateDoc } from "firebase/firestore";
import { InlineEdit } from "@/components/common/inline-edit";
import { plantDoc } from "@/lib/paths";
import { ROUTE_PLANTS } from "@/lib/routes";
import {
  invalidatePlantDetails,
  invalidatePlantsCache,
} from "@/lib/suspense-cache";
import type { MobilePlantPageProps } from "@/types/mobile";
import type { LogEntry, Plant } from "@/types";
import type { UploadingState } from "@/types/common";
import { cn } from "@/lib/utils";
import { LOG_TYPES } from "@/lib/log-config";

// ─── Types ───────────────────────────────────────────────────────────────────

type TabId = "estado" | "diario" | "info" | "fotos";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeDate(dateStr: string): string {
  const days = Math.abs(differenceInDays(new Date(), parseISO(dateStr)));
  if (days === 0) return "hoy";
  if (days === 1) return "ayer";
  return `hace ${days}d`;
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  iconBg,
  icon,
  value,
  label,
}: {
  iconBg: string;
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-card p-3">
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          iconBg
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-foreground leading-tight">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ─── EstadoTab ────────────────────────────────────────────────────────────────

function EstadoTab({
  lastWatering,
  lastEnvironment,
  lightingSchedule,
  plantId,
}: {
  lastWatering?: LogEntry;
  lastEnvironment?: LogEntry;
  lightingSchedule?: string;
  plantId: string;
}) {
  const { t } = useTranslation(["plants", "journal"]);

  const lastWateringDays =
    lastWatering != null
      ? Math.abs(differenceInDays(new Date(), parseISO(lastWatering.date)))
      : null;

  return (
    <div className="space-y-4">
      {lastWatering != null && (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 text-xs font-medium text-blue-400">
          <Droplet className="h-3.5 w-3.5" />
          {t("plantPage.watered", { ns: "plants" })}:{" "}
          {lastWateringDays} {t("plantPage.dayAgo", { ns: "plants" })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          iconBg="bg-blue-500/15"
          icon={<Thermometer className="h-4 w-4 text-blue-400" />}
          value={
            lastEnvironment?.temperature != null
              ? `${lastEnvironment.temperature}°C`
              : "—"
          }
          label={t("plantPage.temperature", { ns: "plants" })}
        />
        <StatCard
          iconBg="bg-blue-500/15"
          icon={<Droplet className="h-4 w-4 text-blue-400" />}
          value={
            lastEnvironment?.humidity != null
              ? `${lastEnvironment.humidity}%`
              : "—"
          }
          label={t("plantPage.humidity", { ns: "plants" })}
        />
        <StatCard
          iconBg="bg-yellow-500/15"
          icon={<Sun className="h-4 w-4 text-yellow-400" />}
          value={lightingSchedule ?? "—"}
          label={t("plantPage.lighting", { ns: "plants" })}
        />
        <StatCard
          iconBg="bg-purple-500/15"
          icon={<Zap className="h-4 w-4 text-purple-400" />}
          value={
            lastEnvironment?.ph != null ? String(lastEnvironment.ph) : "—"
          }
          label={t("plantPage.ph", { ns: "plants" })}
        />
      </div>

      <div className="flex gap-3 pt-1">
        <Button variant="outline" size="sm" className="flex-1 h-11" asChild>
          <Link href={`/plants/${plantId}/logs`}>
            <FileText className="h-4 w-4 mr-2" />
            {t("viewLogs", { ns: "journal" })}
          </Link>
        </Button>
        <Button
          size="sm"
          className="flex-[1.4] h-11 bg-green-600 hover:bg-green-700 text-white"
          asChild
        >
          <Link href={`/plants/${plantId}/add-log`}>
            <Plus className="h-4 w-4 mr-2" />
            {t("addLog", { ns: "journal" })}
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ─── DiarioTab ────────────────────────────────────────────────────────────────

const LOG_TYPE_STYLE: Record<
  string,
  { icon: React.ReactNode; bg: string }
> = {
  [LOG_TYPES.WATERING]: {
    icon: <Droplet className="h-3.5 w-3.5 text-blue-400" />,
    bg: "bg-blue-500/15",
  },
  [LOG_TYPES.FEEDING]: {
    icon: <Zap className="h-3.5 w-3.5 text-green-400" />,
    bg: "bg-green-500/15",
  },
  [LOG_TYPES.TRAINING]: {
    icon: <Leaf className="h-3.5 w-3.5 text-orange-400" />,
    bg: "bg-orange-500/15",
  },
  [LOG_TYPES.TRANSPLANT]: {
    icon: <Leaf className="h-3.5 w-3.5 text-lime-400" />,
    bg: "bg-lime-500/15",
  },
  [LOG_TYPES.ENVIRONMENT]: {
    icon: <Thermometer className="h-3.5 w-3.5 text-purple-400" />,
    bg: "bg-purple-500/15",
  },
  [LOG_TYPES.FLOWERING]: {
    icon: <Sun className="h-3.5 w-3.5 text-pink-400" />,
    bg: "bg-pink-500/15",
  },
  [LOG_TYPES.NOTE]: {
    icon: <FileText className="h-3.5 w-3.5 text-gray-400" />,
    bg: "bg-gray-500/15",
  },
  [LOG_TYPES.END_CYCLE]: {
    icon: <Trash2 className="h-3.5 w-3.5 text-red-400" />,
    bg: "bg-red-500/15",
  },
};

function DiarioTab({
  recentLogs,
  plantId,
}: {
  recentLogs: LogEntry[];
  plantId: string;
}) {
  const { t } = useTranslation(["journal"]);

  return (
    <div className="space-y-3">
      {recentLogs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {t("noLogs", { ns: "journal" })}
        </p>
      ) : (
        recentLogs.map((log) => {
          const style = LOG_TYPE_STYLE[log.type] ?? {
            icon: <FileText className="h-3.5 w-3.5 text-gray-400" />,
            bg: "bg-gray-500/15",
          };
          return (
            <div
              key={log.id}
              className="flex items-center gap-3 rounded-xl bg-card p-3"
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  style.bg
                )}
              >
                {style.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {t(`logType.${log.type}` as `logType.${string}`, {
                    ns: "journal",
                  })}
                </p>
                {log.notes && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    {log.notes}
                  </p>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground shrink-0">
                {relativeDate(log.date)}
              </span>
            </div>
          );
        })
      )}

      <Button
        className="w-full h-11 bg-green-600 hover:bg-green-700 text-white mt-1"
        asChild
      >
        <Link href={`/plants/${plantId}/add-log`}>
          <Plus className="h-4 w-4 mr-2" />
          {t("addLog", { ns: "journal" })}
        </Link>
      </Button>
    </div>
  );
}

// ─── InfoTab ──────────────────────────────────────────────────────────────────

function InfoTab({
  plant,
  userId,
  daysSincePlanting,
  onUpdate,
  onDelete,
  isDeleting,
}: {
  plant: Plant;
  userId: string;
  daysSincePlanting: number;
  onUpdate?: (patch: Partial<Plant>) => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}) {
  const { t } = useTranslation(["plants", "common"]);

  return (
    <div className="space-y-5">
      {/* Section: Plant */}
      <div>
        <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-2">
          {t("plantPage.details", { ns: "plants" })}
        </p>
        <div className="rounded-xl bg-card divide-y divide-border overflow-hidden">
          {/* Name */}
          <div className="flex items-center justify-between gap-2 px-3 py-2.5">
            <span className="text-xs text-muted-foreground shrink-0">
              {t("plantPage.name", { ns: "plants" })}
            </span>
            <div className="flex-1 text-right min-w-0">
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
                placeholder={t("newPlant.namePlaceholder", { ns: "plants" })}
                className="text-sm font-medium text-foreground justify-end"
                inputClassName="text-sm text-foreground bg-background/50 border-border rounded-lg px-2 py-1 w-full"
              />
            </div>
          </div>
          {/* Age */}
          <div className="flex items-center justify-between px-3 py-2.5">
            <span className="text-xs text-muted-foreground">
              {t("plantPage.age", { ns: "plants" })}
            </span>
            <span className="text-sm font-bold text-foreground">
              {daysSincePlanting}{" "}
              <span className="text-xs font-normal text-green-400">
                {t("plantPage.days", { ns: "plants" })}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Section: Characteristics */}
      <div>
        <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-2">
          {t("plantPage.environment", { ns: "plants" })}
        </p>
        <div className="rounded-xl bg-card divide-y divide-border overflow-hidden">
          {/* Seed type */}
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-xs text-muted-foreground">
              {t("plantPage.seedType", { ns: "plants" })}
            </span>
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
              <SelectTrigger className="w-auto border-none bg-transparent text-foreground h-auto py-1 px-2 text-xs font-medium">
                <SelectValue>
                  {plant.seedType === "autoflowering"
                    ? t("seedType.autoflowering", { ns: "plants" })
                    : t("seedType.photoperiodic", { ns: "plants" })}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="autoflowering">
                  {t("seedType.autoflowering", { ns: "plants" })}
                </SelectItem>
                <SelectItem value="photoperiodic">
                  {t("seedType.photoperiodic", { ns: "plants" })}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Grow type */}
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-xs text-muted-foreground">
              {t("plantPage.growType", { ns: "plants" })}
            </span>
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
              <SelectTrigger className="w-auto border-none bg-transparent text-foreground h-auto py-1 px-2 text-xs font-medium">
                <SelectValue>
                  {plant.growType === "indoor"
                    ? t("growType.indoor", { ns: "plants" })
                    : t("growType.outdoor", { ns: "plants" })}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="indoor">
                  {t("growType.indoor", { ns: "plants" })}
                </SelectItem>
                <SelectItem value="outdoor">
                  {t("growType.outdoor", { ns: "plants" })}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Seed bank */}
          <div className="flex items-center justify-between gap-2 px-3 py-2.5">
            <span className="text-xs text-muted-foreground shrink-0">
              {t("plantPage.seedBank", { ns: "plants" })}
            </span>
            <div className="flex-1 text-right min-w-0">
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
                className="text-sm font-medium text-foreground justify-end"
                inputClassName="text-sm text-foreground bg-background/50 border-border rounded-lg px-2 py-1 w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      {onDelete && (
        <div>
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">
            {t("plantPage.dangerZone", { ns: "plants" })}
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full h-11"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t("deletePlant", { ns: "plants" })}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t("deletePlantConfirm", {
                    ns: "plants",
                    name: plant.name,
                  })}
                </AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {t("cancel", { ns: "common" })}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isDeleting}
                >
                  {t("delete", { ns: "common" })}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}

// ─── FotosTab ─────────────────────────────────────────────────────────────────

function FotosTab({
  allImages,
  coverPhoto,
  onSelectImage,
  onOpenFullscreen,
  onAddPhoto,
  photoUploadState,
  plantName,
}: {
  allImages: string[];
  coverPhoto?: string;
  onSelectImage: (index: number) => void;
  onOpenFullscreen: (open: boolean) => void;
  onAddPhoto?: () => void;
  photoUploadState: UploadingState;
  plantName: string;
}) {
  const { t } = useTranslation(["plants"]);

  if (allImages.length === 0 && !onAddPhoto) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Leaf className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          {t("plantPage.noPhotos", { ns: "plants" })}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {allImages.map((url, idx) => (
        <button
          key={url}
          type="button"
          className="relative aspect-square overflow-hidden rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 active:scale-95 transition-transform"
          onClick={() => {
            onSelectImage(idx);
            onOpenFullscreen(true);
          }}
          aria-label={`${plantName} photo ${idx + 1}`}
        >
          <Image src={url} alt="" fill className="object-cover" />
          {url === coverPhoto && (
            <div className="absolute top-1 left-1 flex items-center gap-0.5 rounded bg-yellow-500/90 px-1 py-0.5">
              <Star className="h-2.5 w-2.5 text-black fill-black" />
              <span className="text-[8px] font-bold text-black leading-none">
                Portada
              </span>
            </div>
          )}
        </button>
      ))}

      {onAddPhoto && (
        <button
          type="button"
          onClick={onAddPhoto}
          disabled={photoUploadState === "uploading"}
          className="relative aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-card hover:border-green-500/60 transition-colors disabled:opacity-50 active:scale-95"
          aria-label={t("photos.addPhotos", { ns: "plants" })}
        >
          {photoUploadState === "uploading" ? (
            <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
          ) : (
            <Plus className="h-6 w-6 text-muted-foreground" />
          )}
        </button>
      )}
    </div>
  );
}

// ─── MobilePlantPage ──────────────────────────────────────────────────────────

export function MobilePlantPage({
  plant,
  userId,
  lastWatering,
  lastFeeding: _lastFeeding,
  lastTraining: _lastTraining,
  lastEnvironment,
  lastLighting,
  recentLogs = [],
  onAddPhoto,
  onRemovePhoto,
  onSetCoverPhoto,
  onUpdate,
  language,
  photoUploadState = "idle",
  onDelete,
  isDeleting,
}: MobilePlantPageProps) {
  const { t } = useTranslation(["plants", "common"]);
  const [activeTab, setActiveTab] = useState<TabId>("estado");
  const [showFullImage, setShowFullImage] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const allImages = [
    ...(plant.coverPhoto ? [plant.coverPhoto] : []),
    ...(plant.photos || []),
  ].filter((img, i, arr) => arr.indexOf(img) === i);

  const showUploadOverlay = photoUploadState === "uploading";

  const daysSincePlanting = plant.plantingDate
    ? differenceInDays(new Date(), parseISO(plant.plantingDate))
    : 0;

  const lightingSchedule =
    lastLighting?.lightSchedule || plant.lightSchedule;

  // Swipe handlers — only used for fullscreen modal navigation
  const minSwipeDistance = 50;
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) =>
    setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || allImages.length < 2) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance)
      setCurrentImageIndex((p) => (p + 1) % allImages.length);
    if (distance < -minSwipeDistance)
      setCurrentImageIndex(
        (p) => (p - 1 + allImages.length) % allImages.length
      );
  };

  const TABS: { id: TabId; label: string }[] = [
    { id: "estado", label: t("plantPage.tabEstado", { ns: "plants" }) },
    { id: "diario", label: t("plantPage.tabDiario", { ns: "plants" }) },
    { id: "info",   label: t("plantPage.tabInfo",   { ns: "plants" }) },
    { id: "fotos",  label: t("plantPage.tabFotos",  { ns: "plants" }) },
  ];

  return (
    <div className="min-h-screen" lang={language}>
      {/* ── Hero (compact) ── */}
      <div className="relative h-28 w-full overflow-hidden rounded-xl">
        {allImages.length > 0 ? (
          <Image
            src={allImages[currentImageIndex]}
            alt={plant.name}
            fill
            className="object-cover cursor-pointer"
            onClick={() => setShowFullImage(true)}
          />
        ) : (
          <div className="relative h-full bg-gradient-to-br from-green-600/30 to-emerald-700/40">
            <Leaf className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 text-green-400/40" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

        {showUploadOverlay && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-primary/60">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          </div>
        )}

        {/* Top navigation row */}
        <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between z-10">
          <Link
            href={ROUTE_PLANTS}
            className="h-9 w-9 rounded-full bg-black/25 backdrop-blur-sm border border-white/20 flex items-center justify-center"
            aria-label={t("back", { ns: "common" })}
          >
            <ArrowLeft className="h-4 w-4 text-white" />
          </Link>

          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-9 w-9 rounded-full bg-black/25 backdrop-blur-sm border border-white/20 flex items-center justify-center"
                aria-label="Menu"
              >
                <Menu className="h-4 w-4 text-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onAddPhoto && (
                <DropdownMenuItem onClick={() => onAddPhoto(plant)}>
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
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t("photos.setCoverConfirmTitle", { ns: "plants" })}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("photos.setCoverConfirmDesc", { ns: "plants" })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {t("cancel", { ns: "common" })}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            onSetCoverPhoto(allImages[currentImageIndex]);
                            setMenuOpen(false);
                          }}
                          className="bg-yellow-600 text-white"
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
                      className="text-red-400"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t("photos.deletePhoto", { ns: "plants" })}
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t("photos.removeConfirmTitle", { ns: "plants" })}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("photos.removeConfirmDesc", { ns: "plants" })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {t("cancel", { ns: "common" })}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          onRemovePhoto(currentImageIndex);
                          setMenuOpen(false);
                        }}
                        className="bg-red-600 text-white"
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

        {/* Plant name + meta line */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2 z-10">
          <div className="max-w-[calc(100vw-5rem)]">
            <InlineEdit
              value={plant.name}
              onSave={async (newName) => {
                await updateDoc(plantDoc(userId, plant.id), { name: newName });
                invalidatePlantDetails(userId, plant.id);
                invalidatePlantsCache(userId);
                onUpdate?.({ name: newName });
              }}
              placeholder={t("newPlant.namePlaceholder", { ns: "plants" })}
              className="text-lg font-bold text-white drop-shadow-lg uppercase truncate block w-full"
              inputClassName="text-base font-bold text-white bg-black/50 border-white/30 rounded-lg py-1.5 backdrop-blur-sm placeholder-white/60 w-full"
            />
          </div>
          <p className="text-xs text-green-400 font-semibold mt-0.5">
            {t("plantPage.day", { ns: "plants" })} {daysSincePlanting}
            {" · "}
            {plant.seedType === "autoflowering"
              ? t("seedType.autoflowering", { ns: "plants" })
              : t("seedType.photoperiodic", { ns: "plants" })}
            {" · "}
            {plant.growType === "indoor"
              ? t("growType.indoor", { ns: "plants" })
              : t("growType.outdoor", { ns: "plants" })}
          </p>
        </div>
      </div>

      {/* ── Tab Strip ── */}
      <div className="sticky top-0 z-10 bg-card border-b border-border flex">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 py-2.5 text-xs font-medium transition-colors",
              activeTab === tab.id
                ? "text-green-400 border-b-2 border-green-400"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="px-3 py-3">
        {activeTab === "estado" && (
          <EstadoTab
            lastWatering={lastWatering}
            lastEnvironment={lastEnvironment}
            lightingSchedule={lightingSchedule}
            plantId={plant.id}
          />
        )}
        {activeTab === "diario" && (
          <DiarioTab recentLogs={recentLogs} plantId={plant.id} />
        )}
        {activeTab === "info" && (
          <InfoTab
            plant={plant}
            userId={userId}
            daysSincePlanting={daysSincePlanting}
            onUpdate={onUpdate}
            onDelete={onDelete}
            isDeleting={isDeleting}
          />
        )}
        {activeTab === "fotos" && (
          <FotosTab
            allImages={allImages}
            coverPhoto={plant.coverPhoto}
            onSelectImage={setCurrentImageIndex}
            onOpenFullscreen={setShowFullImage}
            onAddPhoto={onAddPhoto ? () => onAddPhoto(plant) : undefined}
            photoUploadState={photoUploadState}
            plantName={plant.name}
          />
        )}
      </div>

      {/* ── Fullscreen Image Modal ── */}
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
            {onRemovePhoto && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-5 w-5 text-white" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("photos.removeConfirmTitle", { ns: "plants" })}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("photos.removeConfirmDesc", { ns: "plants" })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
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
            {allImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full">
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
