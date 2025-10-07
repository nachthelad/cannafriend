"use client";

import { Crown, CreditCard, AlertTriangle } from "lucide-react";
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

export interface SubscriptionDetails {
  premium: boolean;
  premium_until: number | null;
  remaining_ms: number | null;
  recurring: boolean | null;
  preapproval_status: string | null;
  last_payment?: {
    id: string;
    status?: string;
    date_approved?: string;
  } | null;
}

export interface SubscriptionLine {
  label: string;
  value: string;
}

interface SubscriptionManagementProps {
  title: string;
  statusLabel: string;
  activeLabel: string;
  inactiveLabel: string;
  upgradeLabel: string;
  upgradeDescription?: string;
  onUpgrade: () => void;
  onCancel: () => void;
  cancelLabel: string;
  dialogCancelLabel: string;
  cancelConfirmTitle: string;
  cancelConfirmDescription: string;
  cancelConfirmActionLabel: string;
  cancelingLabel: string;
  isPremium: boolean;
  isCancelling: boolean;
  subscriptionLines?: SubscriptionLine[];
  note?: string;
}

export function SubscriptionManagement({
  title,
  statusLabel,
  activeLabel,
  inactiveLabel,
  upgradeLabel,
  upgradeDescription,
  onUpgrade,
  cancelLabel,
  cancelConfirmTitle,
  cancelConfirmDescription,
  cancelConfirmActionLabel,
  cancelingLabel,
  isPremium,
  isCancelling,
  subscriptionLines = [],
  note,
  dialogCancelLabel,
  onCancel,
}: SubscriptionManagementProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold flex items-center">
          <Crown className="mr-2 h-5 w-5 text-yellow-500" />
          {title}
        </h2>
      </div>

      <div className="space-y-4 max-w-lg">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{statusLabel}:</span>
          <div className="flex items-center gap-2">
            {isPremium ? (
              <>
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm text-green-600 font-medium">
                  {activeLabel}
                </span>
              </>
            ) : (
              <>
                <div className="h-2 w-2 rounded-full bg-gray-400" />
                <span className="text-sm text-muted-foreground">
                  {inactiveLabel}
                </span>
              </>
            )}
          </div>
        </div>

        {subscriptionLines.length > 0 && (
          <div className="space-y-2 text-sm">
            {subscriptionLines.map((line, index) => (
              <div key={index} className="flex justify-left">
                <span className="text-muted-foreground">{line.label}:</span>
                <span className="font-medium ml-2">{line.value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {!isPremium ? (
            <Button onClick={onUpgrade} className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              {upgradeLabel}
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {cancelLabel}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
                    {cancelConfirmTitle}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {cancelConfirmDescription}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{dialogCancelLabel}</AlertDialogCancel>
                  <AlertDialogAction onClick={onCancel} disabled={isCancelling}>
                    {isCancelling ? cancelingLabel : cancelConfirmActionLabel}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {note && (
          <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
            {note}
          </p>
        )}
      </div>
    </div>
  );
}
