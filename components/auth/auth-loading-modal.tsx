"use client";

import type { AuthLoadingModalProps } from "@/types/auth";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Logo } from "@/components/common/logo";

export function AuthLoadingModal({ open }: AuthLoadingModalProps) {
  const { t } = useTranslation("auth");

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200 dark:border-gray-800"
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>{t("login.signingIn")}</DialogTitle>
        </VisuallyHidden>
        <div className="flex flex-col items-center justify-center py-6">
          <Logo size={48} className="text-primary mb-4" />
          <p className="text-lg font-medium text-foreground">
            {t("login.signingIn")}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {t("pleaseWait")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
