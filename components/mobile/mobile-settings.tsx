"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ResponsivePageHeader } from "@/components/common/responsive-page-header";
import { Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { getSuspenseResource } from "@/lib/suspense-utils";
import { AccountSummary } from "@/components/settings/account-summary";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { SubscriptionManagement } from "@/components/settings/subscription-management";
import { AppInformation } from "@/components/settings/app-information";
import { DangerZone } from "@/components/settings/danger-zone";
import { SettingsFooter } from "@/components/settings/settings-footer";
import { PushNotifications } from "@/components/settings/push-notifications";
import { useToast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { updateDoc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { userDoc } from "@/lib/paths";
import { ROUTE_LOGIN, ROUTE_PREMIUM } from "@/lib/routes";
import { deleteUserAccount } from "@/lib/delete-account";
import { invalidateSettingsCache } from "@/lib/suspense-cache";
import type {
  MobilePreferencesState,
  MobileSettingsData,
  MobileSettingsProps,
  SubscriptionDetails,
  SubscriptionLine,
} from "@/types";

async function fetchSettingsData(userId: string): Promise<MobileSettingsData> {
  const userRef = userDoc(userId);
  const userSnap = await getDoc(userRef);

  let timezone = "";
  let darkMode = true;

  if (userSnap.exists()) {
    const data = userSnap.data() as any;
    timezone = data.timezone ?? "";
    darkMode = typeof data.darkMode === "boolean" ? data.darkMode : true;
  }

  let subscription: SubscriptionDetails | null = null;

  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch("/api/mercadopago/subscription-status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        subscription = (await response.json()) as SubscriptionDetails;
      }
    } catch {
      subscription = null;
    }
  }

  return {
    preferences: { timezone, darkMode },
    subscription,
  };
}

function MobileSettingsContent({
  userId,
  email,
  providerId,
  showHeader = true,
}: MobileSettingsProps) {
  const { t } = useTranslation(["common", "onboarding"]);
  const router = useRouter();
  const { toast } = useToast();
  const { handleFirebaseError } = useErrorHandler();
  const { setTheme } = useTheme();

  const cacheKey = `settings-${userId}`;
  const resource = getSuspenseResource(cacheKey, () =>
    fetchSettingsData(userId)
  );
  const { preferences: initialPreferences, subscription: initialSubscription } =
    resource.read();

  const [preferences, setPreferences] =
    useState<MobilePreferencesState>(initialPreferences);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isCancellingSubscription, setIsCancellingSubscription] =
    useState(false);
  const previousPreferencesRef = useRef<MobilePreferencesState | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    if (previousPreferencesRef.current === initialPreferences) {
      return;
    }
    previousPreferencesRef.current = initialPreferences;
    setPreferences(initialPreferences);
  }, [initialPreferences]);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const subscription = initialSubscription;
  const isPremium = Boolean(subscription?.premium ?? false);

  const handleTimezoneChange = async (value: string) => {
    if (!userId) return;
    try {
      await updateDoc(userDoc(userId), { timezone: value });
      const next = { ...preferences, timezone: value };
      setPreferences(next);
      invalidateSettingsCache(userId);
    } catch (error: any) {
      handleFirebaseError(error, "update timezone");
    }
  };

  const handleDarkModeChange = async (checked: boolean) => {
    if (!userId) return;
    const previous = preferences.darkMode;

    setPreferences((prev) => ({ ...prev, darkMode: checked }));
    setTheme(checked ? "dark" : "light");

    try {
      await updateDoc(userDoc(userId), { darkMode: checked });
      // Delay cache invalidation to avoid conflicts
      setTimeout(() => invalidateSettingsCache(userId), 100);

      // Mobile fallback: Force refresh if theme doesn't apply properly
      // This ensures the theme change is visible even if there are mobile-specific issues
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      }, 500);
    } catch (error: any) {
      setPreferences((prev) => ({ ...prev, darkMode: previous }));
      setTheme(previous ? "dark" : "light");
      handleFirebaseError(error, "update dark mode");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push(ROUTE_LOGIN);
    } catch (error: any) {
      handleFirebaseError(error, "sign out");
    }
  };

  const handleCancelSubscription = async () => {
    if (!auth.currentUser) return;
    setIsCancellingSubscription(true);
    try {
      const token = await auth.currentUser.getIdToken();
      let response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      let data = await response.json();
      if (!response.ok && data.error === "customer_not_found") {
        response = await fetch("/api/mercadopago/cancel-subscription", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        data = await response.json();
      }
      if (response.ok && data.success) {
        toast({
          title: t("subscription.cancelled"),
          description: t("subscription.cancelledDesc"),
        });
        if (data.note) {
          setTimeout(() => {
            toast({
              title: t("info"),
              description: data.note,
            });
          }, 2000);
        }
      } else if (data.error === "not_premium") {
        toast({
          variant: "destructive",
          title: t("subscription.cancelError"),
          description: t("subscription.alreadyCancelled"),
        });
      } else {
        throw new Error(data.message || "Failed to cancel subscription");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("subscription.cancelError"),
        description: error.message || "Failed to cancel subscription",
      });
    } finally {
      setIsCancellingSubscription(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!userId) return;

    setIsDeletingAccount(true);

    try {
      await deleteUserAccount(userId);

      // Complete success - both data and auth user deleted
      toast({
        title: t("settings.accountDeleted"),
        description: t("settings.accountDeletedDesc"),
      });

      router.push(ROUTE_LOGIN);
    } catch (error: any) {
      if (error.message === "DATA_DELETED_AUTH_FAILED") {
        // Data deletion succeeded, but auth requires re-login
        // Show success message and sign out after delay
        toast({
          title: t("settings.accountDeleted"),
          description: t("settings.accountDeletedDesc"),
        });

        setTimeout(async () => {
          try {
            await signOut(auth);
          } catch {
            // Ignore signout errors
          }
          router.push(ROUTE_LOGIN);
        }, 2000);
      } else if (error.message === "REAUTH_REQUIRED") {
        toast({
          variant: "destructive",
          title: t("settings.deleteError"),
          description: t("settings.reauthRequired"),
        });
      } else {
        toast({
          variant: "destructive",
          title: t("settings.deleteError"),
          description: error.message || "Failed to delete account",
        });
      }
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const formatRemaining = useCallback(
    (ms?: number | null) => {
      if (!ms || ms <= 0) return t("inactive");
      const days = Math.floor(ms / (24 * 60 * 60 * 1000));
      const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      if (days > 0) return `${days}d ${hours}h`;
      const mins = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
      if (hours > 0) return `${hours}h ${mins}m`;
      return `${mins}m`;
    },
    [t]
  );

  const getDisplayDate = useCallback(
    (value: number | string) => {
      const date =
        typeof value === "number" ? new Date(value) : new Date(value);
      if (Number.isNaN(date.getTime())) {
        return "—";
      }
      if (!hasHydrated) {
        return date.toISOString().replace("T", " ").replace("Z", " UTC");
      }
      return date.toLocaleString();
    },
    [hasHydrated]
  );

  const subscriptionLines: SubscriptionLine[] = useMemo(() => {
    if (!subscription) return [];
    const lines: SubscriptionLine[] = [];
    lines.push({
      label: t("status"),
      value:
        subscription.recurring === true
          ? t("subscription.recurring")
          : subscription.preapproval_status
          ? subscription.preapproval_status
          : t("subscription.oneTime"),
    });

    if (typeof subscription.premium_until === "number") {
      lines.push({
        label: t("subscription.expires"),
        value: `${getDisplayDate(
          subscription.premium_until
        )} (${formatRemaining(subscription.remaining_ms)})`,
      });
    }

    if (subscription.last_payment?.date_approved) {
      lines.push({
        label: t("subscription.lastPayment"),
        value: getDisplayDate(subscription.last_payment.date_approved),
      });
    }

    return lines;
  }, [formatRemaining, getDisplayDate, subscription, t]);

  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? null;

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {showHeader && (
        <ResponsivePageHeader
          title={
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <span>{t("settings.title")}</span>
            </div>
          }
          onBackClick={() => router.back()}
        />
      )}

      {/* All Settings in Single Column */}
      <div className="pb-24 w-full max-w-full">
        {/* Account Section */}
        <div className="w-full p-4 border-b border-border">
          <AccountSummary
            title={t("settings.account")}
            // description={t("settings.accountDesc")}
            email={email}
            providerId={providerId}
            signOutLabel={t("signOut", { ns: "nav" })}
            onSignOut={handleSignOut}
          />
        </div>

        {/* Preferences Section */}
        <div className="w-full p-4 border-b border-border">
          <PreferencesForm
            title={t("settings.preferences")}
            // description={t("settings.preferencesDesc")}
            languageLabel={t("settings.language")}
            timezoneLabel={t("settings.timezone")}
            timezonePlaceholder={t("settings.selectTimezone")}
            timezoneValue={preferences.timezone}
            onTimezoneChange={handleTimezoneChange}
            darkModeLabel={t("settings.darkMode")}
            darkModeChecked={preferences.darkMode}
            onDarkModeChange={handleDarkModeChange}
          />
        </div>

        {/* Billing Section */}
        <div className="w-full p-4 border-b border-border">
          <SubscriptionManagement
            title={t("subscription.title")}
            statusLabel={t("subscription.status")}
            activeLabel={t("subscription.active")}
            inactiveLabel={t("subscription.inactive")}
            upgradeLabel={t("premium.upgrade")}
            upgradeDescription={t("premium.analyzeDesc")}
            upgradeHref={ROUTE_PREMIUM}
            onCancel={handleCancelSubscription}
            cancelLabel={t("subscription.cancel")}
            dialogCancelLabel={t("cancel")}
            cancelConfirmTitle={t("subscription.confirmCancel")}
            cancelConfirmDescription={t("subscription.confirmCancelDesc")}
            cancelConfirmActionLabel={t("subscription.confirmCancelButton")}
            cancelingLabel={t("subscription.cancelling")}
            isPremium={isPremium}
            isCancelling={isCancellingSubscription}
            subscriptionLines={subscriptionLines}
            note={t("subscription.mercadopagoNote")}
          />
        </div>

        {/* Push Notifications Section */}
        <div className="w-full p-4 border-b border-border">
          <PushNotifications userId={userId} />
        </div>

        {/* App Info Section */}
        <div className="w-full p-4 border-b border-border">
          <AppInformation
            title={t("settings.appInfoDesc")}
            // description={t("settings.appInfoDesc")}
            versionLabel={t("settings.appVersion")}
            version={appVersion}
          />
        </div>

        {/* Danger Zone Section */}
        <div className="w-full p-4 border-b border-border">
          <DangerZone
            title={t("settings.dangerZone")}
            description={t("settings.dangerZoneDesc")}
            triggerLabel={t("settings.deleteAccount")}
            dialogTitle={t("settings.confirmDelete", { ns: "common" })}
            dialogDescription={t("settings.confirmDeleteDesc", {
              ns: "common",
            })}
            confirmLabel={t("settings.confirmDeleteButton")}
            cancelLabel={t("cancel", { ns: "common" })}
            deletingLabel={t("settings.deleting")}
            isDeleting={isDeletingAccount}
            onConfirm={handleDeleteAccount}
          />
        </div>

        {/* Footer */}
        <div className="w-full p-4">
          <SettingsFooter
            privacyLabel={t("privacy.title")}
            termsLabel={t("terms.title")}
          />
        </div>
      </div>
    </div>
  );
}

export function MobileSettings(props: MobileSettingsProps) {
  return <MobileSettingsContent {...props} />;
}
