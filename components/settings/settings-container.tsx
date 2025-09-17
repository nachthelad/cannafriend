"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteUser, signOut } from "firebase/auth";
import {
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { listAll, ref as storageRef, deleteObject } from "firebase/storage";

import { AccountSummary } from "@/components/settings/account-summary";
import { PreferencesForm } from "@/components/settings/preferences-form";
import {
  SubscriptionDetails,
  SubscriptionManagement,
  type SubscriptionLine,
} from "@/components/settings/subscription-management";
import { DangerZone } from "@/components/settings/danger-zone";
import { AppInformation } from "@/components/settings/app-information";
import {
  SettingsNavigation,
  type SettingsSectionId,
  type SettingsSection,
} from "@/components/settings/settings-navigation";
import { SettingsFooter } from "@/components/settings/settings-footer";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { getSuspenseResource } from "@/lib/suspense-utils";
import { auth, db, storage } from "@/lib/firebase";
import {
  logsCol,
  plantDoc as plantDocRef,
  plantsCol,
  remindersCol,
  userDoc,
} from "@/lib/paths";
import { ROUTE_LOGIN, ROUTE_PREMIUM } from "@/lib/routes";
import type { Roles } from "@/types";

interface PreferencesState {
  timezone: string;
  darkMode: boolean;
  roles: Roles;
}

interface SettingsData {
  preferences: PreferencesState;
  subscription: SubscriptionDetails | null;
}

interface SettingsContentProps {
  userId: string;
  email?: string | null;
  providerId?: string | null;
}

async function fetchSettingsData(userId: string): Promise<SettingsData> {
  const userRef = userDoc(userId);
  const userSnap = await getDoc(userRef);

  let timezone = "";
  let darkMode = true;
  let roles: Roles = { grower: true, consumer: false };

  if (userSnap.exists()) {
    const data = userSnap.data() as any;
    timezone = data.timezone ?? "";
    darkMode = typeof data.darkMode === "boolean" ? data.darkMode : true;
    roles = {
      grower: Boolean(data.roles?.grower ?? true),
      consumer: Boolean(data.roles?.consumer ?? false),
    };
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
    preferences: { timezone, darkMode, roles },
    subscription,
  };
}

function SettingsContent({ userId, email, providerId }: SettingsContentProps) {
  const { t } = useTranslation(["common", "onboarding"]);
  const router = useRouter();
  const { toast } = useToast();
  const { setTheme } = useTheme();

  const cacheKey = `settings-${userId}`;
  const resource = getSuspenseResource(cacheKey, () =>
    fetchSettingsData(userId)
  );
  const { preferences: initialPreferences, subscription: initialSubscription } =
    resource.read();

  const [preferences, setPreferences] =
    useState<PreferencesState>(initialPreferences);
  const previousPreferencesRef = useRef<PreferencesState | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isCancellingSubscription, setIsCancellingSubscription] =
    useState(false);
  const [activeSection, setActiveSection] =
    useState<SettingsSectionId>("profile");
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

  useEffect(() => {
    setTheme(preferences.darkMode ? "dark" : "light");
  }, [preferences.darkMode, setTheme]);

  useEffect(() => {
    try {
      localStorage.setItem(
        `cf:userSettings:${userId}`,
        JSON.stringify(preferences)
      );
    } catch {
      // Ignore storage errors
    }
  }, [preferences, userId]);

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

  const handleTimezoneChange = async (value: string) => {
    if (!userId) return;

    try {
      await updateDoc(userDoc(userId), { timezone: value });
      const next = { ...preferences, timezone: value };
      setPreferences(next);
      try {
        localStorage.setItem(`cf:userSettings:${userId}`, JSON.stringify(next));
      } catch {}
      toast({
        title: t("settings.timezoneUpdated"),
        description: t("settings.timezoneUpdatedDesc"),
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("settings.error"),
        description: error.message,
      });
    }
  };

  const handleDarkModeChange = async (checked: boolean) => {
    if (!userId) return;

    try {
      await updateDoc(userDoc(userId), { darkMode: checked });
      const next = { ...preferences, darkMode: checked };
      setPreferences(next);
      try {
        localStorage.setItem(`cf:userSettings:${userId}`, JSON.stringify(next));
      } catch {}
      setTheme(checked ? "dark" : "light");
      toast({
        title: t("settings.darkModeUpdated"),
        description: checked
          ? t("settings.darkModeOn")
          : t("settings.darkModeOff"),
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("settings.error"),
        description: error.message,
      });
    }
  };

  const handleRolesChange = async (nextRoles: Roles) => {
    if (!userId) return;

    try {
      await updateDoc(userDoc(userId), { roles: nextRoles });
      const next = { ...preferences, roles: nextRoles };
      setPreferences(next);
      try {
        localStorage.setItem(`cf:userSettings:${userId}`, JSON.stringify(next));
      } catch {}
      toast({ title: t("settings.updated") });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("settings.error"),
        description: error.message,
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push(ROUTE_LOGIN);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("settings.error"),
        description: error.message,
      });
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
    if (!userId || !auth.currentUser) return;

    setIsDeletingAccount(true);

    try {
      const parseStoragePathFromDownloadUrl = (url: string): string | null => {
        try {
          const u = new URL(url);
          if (!u.pathname.includes("/o/")) return null;
          const afterO = u.pathname.split("/o/")[1] || "";
          const encodedPath = afterO.split("?")[0] || "";
          if (!encodedPath) return null;
          return decodeURIComponent(encodedPath);
        } catch {
          return null;
        }
      };

      const userRef = userDoc(userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        await setDoc(doc(db, "archived_users", userId), {
          ...userData,
          archivedAt: new Date().toISOString(),
        });

        const plantsRef = plantsCol(userId);
        const plantsSnap = await getDocs(plantsRef);

        for (const plantDoc of plantsSnap.docs) {
          const plantData = plantDoc.data() as any;

          await setDoc(
            doc(db, "archived_users", userId, "plants", plantDoc.id),
            {
              ...plantData,
              archivedAt: new Date().toISOString(),
            }
          );

          const logsRef = logsCol(userId, plantDoc.id);
          const logsSnap = await getDocs(logsRef);

          for (const logDoc of logsSnap.docs) {
            await setDoc(
              doc(
                db,
                "archived_users",
                userId,
                "plants",
                plantDoc.id,
                "logs",
                logDoc.id
              ),
              {
                ...logDoc.data(),
                archivedAt: new Date().toISOString(),
              }
            );
          }

          for (const logDoc of logsSnap.docs) {
            await deleteDoc(
              doc(db, "users", userId, "plants", plantDoc.id, "logs", logDoc.id)
            );
          }

          try {
            const photoUrls: string[] = [];
            if (plantData.coverPhoto) photoUrls.push(plantData.coverPhoto);
            if (Array.isArray(plantData.photos))
              photoUrls.push(...plantData.photos);
            for (const url of photoUrls) {
              const path = parseStoragePathFromDownloadUrl(url);
              if (path) {
                try {
                  await deleteObject(storageRef(storage, path));
                } catch (e) {
                  console.warn("Failed to delete storage object:", path, e);
                }
              }
            }
          } catch (e) {
            console.warn("Error deleting plant photos from storage", e);
          }

          await deleteDoc(plantDocRef(userId, plantDoc.id));
        }

        try {
          const remindersRef = remindersCol(userId);
          const remindersSnap = await getDocs(remindersRef);
          for (const r of remindersSnap.docs) {
            await setDoc(doc(db, "archived_users", userId, "reminders", r.id), {
              ...r.data(),
              archivedAt: new Date().toISOString(),
            });
          }
          for (const r of remindersSnap.docs) {
            await deleteDoc(doc(db, "users", userId, "reminders", r.id));
          }
        } catch (e) {
          console.warn("Error archiving/deleting reminders", e);
        }

        await deleteDoc(userRef);
      }

      try {
        await deleteUser(auth.currentUser);
      } catch (e: any) {
        if (e?.code === "auth/requires-recent-login") {
          toast({
            variant: "destructive",
            title: t("settings.deleteError"),
            description: t("settings.reauthRequired"),
          });
          setIsDeletingAccount(false);
          return;
        }
        throw e;
      }

      try {
        const userFolderRef = storageRef(storage, `images/${userId}`);
        const all = await listAll(userFolderRef);
        for (const item of all.items) {
          try {
            await deleteObject(item);
          } catch (e) {
            console.warn(
              "Failed to delete storage object (GC):",
              item.fullPath,
              e
            );
          }
        }
      } catch (e) {
        console.warn("GC storage listing failed", e);
      }

      toast({
        title: t("settings.accountDeleted"),
        description: t("settings.accountDeletedDesc"),
      });

      router.push(ROUTE_LOGIN);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("settings.deleteError"),
        description: error.message,
      });
      setIsDeletingAccount(false);
    }
  };

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
    [t]
  );

  const sectionRenderers = useMemo(
    () => ({
      profile: () => (
        <AccountSummary
          title={t("settings.account")}
          description={t("settings.accountDesc")}
          email={email}
          providerId={providerId}
          signOutLabel={t("signOut", { ns: "nav" })}
          onSignOut={handleSignOut}
        />
      ),
      preferences: () => (
        <PreferencesForm
          title={t("settings.preferences")}
          description={t("settings.preferencesDesc")}
          languageLabel={t("settings.language")}
          timezoneLabel={t("settings.timezone")}
          timezonePlaceholder={t("settings.selectTimezone")}
          timezoneValue={preferences.timezone}
          onTimezoneChange={handleTimezoneChange}
          darkModeLabel={t("settings.darkMode")}
          darkModeChecked={preferences.darkMode}
          onDarkModeChange={handleDarkModeChange}
          rolesLabel={t("settings.roles")}
          rolesValue={preferences.roles}
          onRolesChange={handleRolesChange}
          growerLabel={t("grower", { ns: "onboarding" })}
          consumerLabel={t("consumer", { ns: "onboarding" })}
        />
      ),
      billing: () => (
        <SubscriptionManagement
          title={t("subscription.title")}
          statusLabel={t("subscription.status")}
          activeLabel={t("subscription.active")}
          inactiveLabel={t("subscription.inactive")}
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
          subscriptionLines={subscriptionLines}
          note={t("subscription.mercadopagoNote")}
        />
      ),
      "app-info": () => (
        <AppInformation
          title={t("settings.appInfo")}
          description={t("settings.appInfoDesc")}
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
      handleCancelSubscription,
      handleDarkModeChange,
      handleDeleteAccount,
      handleRolesChange,
      handleSignOut,
      handleTimezoneChange,
      isCancellingSubscription,
      isDeletingAccount,
      isPremium,
      preferences.darkMode,
      preferences.roles,
      preferences.timezone,
      providerId,
      router,
      subscriptionLines,
      t,
    ]
  );

  const renderActiveSection = sectionRenderers[activeSection];

  useEffect(() => {
    if (!sections.length) return;
    if (!sections.some((section) => section.id === activeSection)) {
      setActiveSection(sections[0].id);
    }
  }, [activeSection, sections]);

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-6">
      <header className="mb-6 md:mb-10">
        <h1 className="text-xl font-bold md:text-3xl">{t("settings.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground md:mt-2 md:text-base md:max-w-2xl">
          {t("settings.accountDesc")}
        </p>
      </header>

      <div className="flex-1 flex flex-col md:flex-row md:items-start md:gap-8">
        <SettingsNavigation
          sections={sections}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          navigationTitle={t("settings.title")}
        />

        <div className="flex-1 min-w-0 space-y-6 md:space-y-8">
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
}: SettingsContentProps) {
  return (
    <SettingsContent userId={userId} email={email} providerId={providerId} />
  );
}
