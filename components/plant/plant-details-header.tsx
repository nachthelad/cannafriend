"use client";

import { Button } from "@/components/ui/button";
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
import { ArrowLeft, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { ROUTE_PLANTS } from "@/lib/routes";
import type { Plant } from "@/types";

interface PlantDetailsHeaderProps {
  plant: Plant;
  plantId: string;
  onDelete: () => Promise<void>;
  isDeleting: boolean;
}

export function PlantDetailsHeader({
  plant,
  plantId,
  onDelete,
  isDeleting,
}: PlantDetailsHeaderProps) {
  const { t } = useTranslation(["plants", "common", "journal"]);
  const router = useRouter();

  const handleBack = () => {
    router.push(ROUTE_PLANTS);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden mb-4 p-4">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{plant.name}</h1>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                plant.seedType === "autoflowering"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-foreground"
              }`}
            >
              {plant.seedType === "autoflowering"
                ? t("newPlant.autoflowering")
                : t("newPlant.photoperiodic")}
            </span>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block mb-4 px-2 pt-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-transform: uppercase">
            {plant.name}
          </h1>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete plant"
                className="h-8 w-8 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t("deleteTitle", { ns: "plants" })}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("deleteDesc", { ns: "plants" })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>
                  {t("cancel", { ns: "common" })}
                </AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} disabled={isDeleting}>
                  {t("deleteConfirm", { ns: "plants" })}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </>
  );
}
