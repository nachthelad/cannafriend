"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedLogo } from "@/components/common/animated-logo";
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

interface DangerZoneProps {
  title: string;
  description: string;
  triggerLabel: string;
  dialogTitle: string;
  dialogDescription: string;
  confirmLabel: string;
  cancelLabel: string;
  deletingLabel: string;
  isDeleting: boolean;
  onConfirm: () => void;
}

export function DangerZone({
  title,
  description,
  triggerLabel,
  dialogTitle,
  dialogDescription,
  confirmLabel,
  cancelLabel,
  deletingLabel,
  isDeleting,
  onConfirm,
}: DangerZoneProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold flex items-center text-destructive">
          <Trash2 className="mr-2 h-5 w-5" />
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="max-w-sm">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-auto">{triggerLabel}</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
                {dialogTitle}
              </AlertDialogTitle>
              <AlertDialogDescription>{dialogDescription}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
              <AlertDialogAction
                onClick={onConfirm}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <div className="flex items-center gap-2">
                    <AnimatedLogo size={16} duration={1} className="text-current" />
                    {deletingLabel}
                  </div>
                ) : (
                  confirmLabel
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}