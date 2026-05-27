"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { updateDoc } from "firebase/firestore";
import { invalidateSettingsCache } from "@/lib/suspense-cache";
import { AccountSummary } from "@/components/settings/account-summary";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { SubscriptionManagement } from "@/components/settings/subscription-management";
import { DangerZone } from "@/components/settings/danger-zone";
import { AppInformation } from "@/components/settings/app-information";
import { SettingsNavigation } from "@/components/settings/settings-navigation";
import { SettingsFooter } from "@/components/settings/settings-footer";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/components/providers/theme-provider";
import { auth } from "@/lib/firebase";
import { signOutEverywhere } from "@/lib/auth-session";
import { userDoc } from "@/lib/paths";
import { ROUTE_LOGIN, ROUTE_PREMIUM } from "@/lib/routes";
import { deleteUserAccount } from "@/lib/delete-account";
import { toast } from "sonner";
import {
  DEFAULT_SETTINGS_PREFERENCES,
  fetchSettingsData,
  getStoredSettingsPreferences,
} from "@/lib/settings-data";
import type {
  SettingsContainerProps,
  SettingsContentProps,
  SettingsPreferencesState,
  SettingsSection,
  SettingsSectionId,
  SubscriptionDetails,
  SubscriptionLine,
} from "@/types";

function SettingsContent({
  userId,
  email,
  providerId,
  showHeader = true,
}: SettingsContentProps) {
  const { t } = useTranslation(["common", "onboarding"]);
  const router = useRouter();
  const { handleFirebaseError } = useErrorHandler();
  const { setTheme } = useTheme();

  const [preferences, setPreferences] =
    useState<SettingsPreferencesState>(() =>
      typeof window === "undefined"
        ? DEFAULT_SETTINGS_PREFERENCES
        : getStoredSettingsPreferences(userId),
    );
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(
    null,
  );
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(true);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isCancellingSubscription, setIsCancellingSubscription] =
    useState(false);
  const [activeSection, setActiveSection] =
    useState<SettingsSectionId>("profile");
  const [hasHydrated, setHasHydrated] = useState(false);

  const persistPreferences = useCallback(
    (nextPreferences: SettingsPreferencesState) => {
      try {
        window.localStorage.setItem(
          `cf:userSettings:${userId}`,
          JSON.stringify(nextPreferences),
        );
      } catch {
        // Ignore storage errors
      }
    },
    [userId],
  );

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadSettings = async () => {
      setIsSubscriptionLoading(true);

      try {
        const data = await fetchSettingsData(userId);
        if (!isActive) {
          return;
        }

        setPreferences(data.preferences);
        persistPreferences(data.preferences);
        setSubscription(data.subscription);
      } catch (error) {
        if (!isActive) {
          return;
        }
        console.error("Error loading settings data:", error);
      } finally {
        if (isActive) {
          setIsSubscriptionLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      isActive = false;
    };
  }, [persistPreferences, userId]);

  useEffect(() => {
    setTheme(preferences.darkMode ? "dark" : "light");
  }, [preferences.darkMode, setTheme]);

  const isPremium = Boolean(subscription?.premium ?? false);

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
    [t],
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
    [hasHydrated],
  );

  const handleTimezoneChange = async (value: string) => {
    if (!userId) return;

    try {
      await updateDoc(userDoc(userId), { timezone: value });
      const next = { ...preferences, timezone: value };
      setPreferences(next);
      persistPreferences(next);
      invalidateSettingsCache(userId);
    } catch (error) {
      handleFirebaseError(error, "update timezone");
    }
  };

  const handleDarkModeChange = async (checked: boolean) => {
    if (!userId) return;

    const previous = preferences;
    const next = { ...preferences, darkMode: checked };

    setPreferences(next);
    persistPreferences(next);
    setTheme(checked ? "dark" : "light");

    try {
      await updateDoc(userDoc(userId), { darkMode: checked });
    } catch (error) {
      setPreferences(previous);
      persistPreferences(previous);
      setTheme(previous.darkMode ? "dark" : "light");
      handleFirebaseError(error, "update dark mode");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutEverywhere();
      router.replace(ROUTE_LOGIN);
    } catch (error) {
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

      if (!response.ok && !data.success) {
        throw new Error(data.message || "Failed to cancel subscription");
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
    } finally {
      setIsCancellingSubscription(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!userId) return;

    setIsDeletingAccount(true);

    try {
      await deleteUserAccount(userId);
      router.replace(ROUTE_LOGIN);
    } catch (error: any) {
      if (error.message === "DATA_DELETED_AUTH_FAILED") {
        setTimeout(async () => {
          try {
            await signOutEverywhere();
          } catch {
            // Ignore signout errors
          }
          router.replace(ROUTE_LOGIN);
        }, 2000);
      } else if (error.message === "REAUTH_REQUIRED") {
        toast.error(t("settings.reauthError", { ns: "common" }));
      } else {
        console.error("Error deleting account:", error);
        toast.error(t("settings.deleteAccountError", { ns: "common" }));
      }
    } finally {
      setIsDeletingAccount(false);
    }
  };

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

    lines.push({
      label: t("subscription.source"),
      value:
        subscription.source === "mercadopago"
          ? t("subscription.sourceMercadoPago")
          : subscription.source === "stripe"
            ? t("subscription.sourceStripe")
            : subscription.source === "admin"
              ? t("subscription.sourceManual")
              : t("subscription.sourceUnknown"),
    });

    if (typeof subscription.premium_until === "number") {
      lines.push({
        label: t("subscription.expires"),
        value: `${getDisplayDate(
          subscription.premium_until,
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

  const sections: SettingsSection[] = useMemo(
    () => [
      {
        id: "profile",
        label: t("settings.account"),
      },
      {
        id: "preferences",
        label: t("settings.preferences"),
      },
      {
        id: "billing",
        label: t("settings.billing"),
      },
      {
        id: "app-info",
        label: t("settings.appInfo"),
      },
      {
        id: "danger",
        label: t("settings.deleteAccount"),
        isDestructive: true,
      },
    ],
    [t],
  );

  const sectionRenderers = useMemo(
    () => ({
      profile: () => (
        <AccountSummary
          title={t("settings.account")}
          email={email}
          providerId={providerId}
          signOutLabel={t("signOut", { ns: "nav" })}
          onSignOut={handleSignOut}
        />
      ),
      preferences: () => (
        <PreferencesForm
          title={t("settings.preferences")}
          languageLabel={t("settings.language")}
          timezoneLabel={t("settings.timezone")}
          timezonePlaceholder={t("settings.selectTimezone")}
          timezoneValue={preferences.timezone}
          onTimezoneChange={handleTimezoneChange}
          darkModeLabel={t("settings.darkMode")}
          darkModeChecked={preferences.darkMode}
          onDarkModeChange={handleDarkModeChange}
        />
      ),
      billing: () => (
        <SubscriptionManagement
          title={t("subscription.title")}
          statusLabel={t("subscription.status")}
          activeLabel={t("subscription.active")}
          inactiveLabel={t("subscription.inactive")}
          loadingLabel={t("loading")}
          upgradeLabel={t("premium.upgrade")}
          upgradeDescription={t("premium.analyzeDesc")}
          onUpgrade={() => router.push(ROUTE_PREMIUM)}
          onCancel={handleCancelSubscription}
          cancelLabel={t("subscription.cancel")}
          dialogCancelLabel={t("cancel")}
          cancelConfirmTitle={t("subscription.confirmCancel")}
          cancelConfirmDescription={t("subscription.confirmCancelDesc")}
          cancelConfirmActionLabel={t("subscription.confirmCancelButton")}
          cancelingLabel={t("subscription.cancelling")}
          isPremium={isPremium}
          isCancelling={isCancellingSubscription}
          isLoading={isSubscriptionLoading}
          subscriptionLines={subscriptionLines}
          note={
            subscription?.management_hint === "mercadopago_account"
              ? t("subscription.mercadopagoNote")
              : t("subscription.manageInApp")
          }
        />
      ),
      "app-info": () => (
        <AppInformation
          title={t("settings.appInfoDesc")}
          versionLabel={t("settings.appVersion")}
          version={appVersion}
        />
      ),
      danger: () => (
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
      ),
    }),
    [
      appVersion,
      email,
      handleTimezoneChange,
      isCancellingSubscription,
      isDeletingAccount,
      isPremium,
      isSubscriptionLoading,
      preferences.darkMode,
      preferences.timezone,
      providerId,
      router,
      subscriptionLines,
      t,
    ],
  );

  const renderActiveSection = sectionRenderers[activeSection];

  useEffect(() => {
    if (!sections.length) return;
    const currentSectionValid = sections.some(
      (section) => section.id === activeSection,
    );
    if (!currentSectionValid) {
      setActiveSection(sections[0].id);
    }
  }, [activeSection, sections]);

  return (
    <div className="flex flex-col gap-6 p-4 md:px-0 md:py-6 md:gap-8">
      {showHeader ? (
        <header className="md:mb-4">
          <h1 className="text-xl font-bold md:text-3xl">
            {t("settings.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground md:mt-2 md:text-base md:max-w-2xl">
            {t("settings.accountDesc")}
          </p>
        </header>
      ) : null}

      <div className="flex flex-col md:flex-row md:items-start md:gap-8">
        <SettingsNavigation
          sections={sections}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          navigationTitle={t("settings.title")}
        />

        <div className="md:flex-1 min-w-0 space-y-6 md:space-y-8">
          {renderActiveSection ? renderActiveSection() : null}
        </div>
      </div>

      <SettingsFooter
        privacyLabel={t("privacy.title")}
        termsLabel={t("terms.title")}
      />
    </div>
  );
}

export function SettingsContainer({
  userId,
  email,
  providerId,
  showHeader,
}: SettingsContainerProps) {
  return (
    <SettingsContent
      userId={userId}
      email={email}
      providerId={providerId}
      showHeader={showHeader}
    />
  );
}
