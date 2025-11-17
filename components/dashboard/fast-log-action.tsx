"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import type { Plant } from "@/types";
import { ROUTE_JOURNAL_NEW, ROUTE_PLANTS_NEW } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FastLogActionProps {
  plants: Plant[];
  renderTrigger: (props: {
    onClick: () => void;
    disabled: boolean;
  }) => ReactNode;
}

export function FastLogAction({ plants, renderTrigger }: FastLogActionProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { t } = useTranslation("dashboard");

  const handleSelectPlant = (plantId: string) => {
    setOpen(false);
    router.push(
      `${ROUTE_JOURNAL_NEW}?plantId=${plantId}&returnTo=dashboard`
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {renderTrigger({
        onClick: () => setOpen(true),
        disabled: plants.length === 0,
      })}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("fastLogTitle", { ns: "dashboard" })}</DialogTitle>
          <DialogDescription>
            {t("fastLogDescription", { ns: "dashboard" })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {plants.length > 0 ? (
            plants.map((plant) => (
              <Button
                key={plant.id}
                variant="outline"
                className="w-full justify-between"
                onClick={() => handleSelectPlant(plant.id)}
              >
                <span className="font-medium">{plant.name}</span>
              </Button>
            ))
          ) : (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                {t("fastLogEmpty", { ns: "dashboard" })}
              </p>
              <Button asChild>
                <Link href={ROUTE_PLANTS_NEW}>
                  {t("fastLogAddPlant", { ns: "dashboard" })}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
