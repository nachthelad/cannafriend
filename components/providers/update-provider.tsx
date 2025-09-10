"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppVersion } from "@/hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function UpdateProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation(["common"]);
  const { updateAvailable, reload } = useAppVersion(60_000);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (updateAvailable) setOpen(true);
  }, [updateAvailable]);

  // Enforce modal when update is available; prevent closing via overlay
  const handleOpenChange = (next: boolean) => {
    if (!updateAvailable) setOpen(next);
  };

  return (
    <>
      {children}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{t("updates.title", { ns: "common" })}</DialogTitle>
            <DialogDescription>
              {t("updates.description", { ns: "common" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={reload}>{t("updates.reload", { ns: "common" })}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
