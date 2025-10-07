"use client";

import type { LoginModalProps } from "@/types/auth";
import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AuthTabs } from "@/components/auth/auth-tabs";
import { useTranslation } from "react-i18next";

export function LoginModal({ open, onOpenChange, onAuthStart }: LoginModalProps) {
  const { t } = useTranslation("auth");

  useEffect(() => {
    // focus trap or side effects are handled by Dialog
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {t("login.title")}
          </DialogTitle>
        </DialogHeader>
        <AuthTabs onLoginSuccess={() => onOpenChange(false)} onAuthStart={onAuthStart} />
      </DialogContent>
    </Dialog>
  );
}
