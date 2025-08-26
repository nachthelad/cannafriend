"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/use-translation";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { AnimatedLogo } from "@/components/common/animated-logo";

interface AuthLoadingModalProps {
  open: boolean;
}

export function AuthLoadingModal({ open }: AuthLoadingModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200 dark:border-gray-800"
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>{t("auth.signingIn")}</DialogTitle>
        </VisuallyHidden>
        <div className="flex flex-col items-center justify-center py-6">
          <AnimatedLogo
            size={48}
            className="text-primary mb-4"
            duration={1.5}
          />
          <p className="text-lg font-medium text-foreground">
            {t("auth.signingIn")}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {t("auth.pleaseWait")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
