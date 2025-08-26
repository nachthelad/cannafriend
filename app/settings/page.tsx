"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ROUTE_LOGIN, ROUTE_PRIVACY, ROUTE_TERMS } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { useTheme } from "next-themes";
import { auth, db, storage } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { onAuthStateChanged, deleteUser, signOut } from "firebase/auth";
import {
  userDoc,
  plantsCol,
  logsCol,
  remindersCol,
  plantDoc as plantDocRef,
} from "@/lib/paths";
import { ref as storageRef, deleteObject, listAll } from "firebase/storage";
import { Layout } from "@/components/layout";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
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

export default function SettingsPage() {
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userSettings, setUserSettings] = useState<{
    timezone: string;
    darkMode: boolean;
    email?: string;
    providerId?: string;
    roles?: { grower: boolean; consumer: boolean };
  }>({
    timezone: "",
    darkMode: true,
    email: "",
    providerId: "",
    roles: { grower: true, consumer: false },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        router.push(ROUTE_LOGIN);
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!userId) return;

      try {
        // Try local cache first
        const cacheKey = `cf:userSettings:${userId}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setUserSettings(parsed);
            // sync theme with cached
            if (parsed.darkMode && theme !== "dark") setTheme("dark");
            if (!parsed.darkMode && theme !== "light") setTheme("light");
          } catch {}
        }

        const userRef = userDoc(userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const darkMode =
            typeof userData.darkMode === "boolean" ? userData.darkMode : true;

          setUserSettings({
            timezone: userData.timezone || "",
            darkMode: darkMode,
            email: auth.currentUser?.email || "",
            providerId: auth.currentUser?.providerData?.[0]?.providerId || "",
            roles: {
              grower: Boolean(userData.roles?.grower ?? true),
              consumer: Boolean(userData.roles?.consumer ?? false),
            },
          });

          // Save to cache
          try {
            localStorage.setItem(
              cacheKey,
              JSON.stringify({
                timezone: userData.timezone || "",
                darkMode,
                email: auth.currentUser?.email || "",
                providerId:
                  auth.currentUser?.providerData?.[0]?.providerId || "",
                roles: {
                  grower: Boolean(userData.roles?.grower ?? true),
                  consumer: Boolean(userData.roles?.consumer ?? false),
                },
              })
            );
          } catch {}

          // Sync with theme context
          if (darkMode && theme !== "dark") {
            setTheme("dark");
          } else if (!darkMode && theme !== "light") {
            setTheme("light");
          }
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: t("settings.error"),
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUserSettings();
    }
  }, [userId, toast, t, theme, setTheme]);

  const handleTimezoneChange = async (value: string) => {
    if (!userId) return;

    try {
      const userRef = userDoc(userId);
      await updateDoc(userRef, {
        timezone: value,
      });

      const next = { ...userSettings, timezone: value };
      setUserSettings(next);
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
      const userRef = userDoc(userId);
      await updateDoc(userRef, {
        darkMode: checked,
      });

      const next = { ...userSettings, darkMode: checked };
      setUserSettings(next);
      try {
        localStorage.setItem(`cf:userSettings:${userId}`, JSON.stringify(next));
      } catch {}

      // Update theme context immediately
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

      // Archive user data
      const userRef = userDoc(userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        // Create archive document
        await setDoc(doc(db, "archived_users", userId), {
          ...userData,
          archivedAt: new Date().toISOString(),
        });

        // Archive plants
        const plantsRef = plantsCol(userId);
        const plantsSnap = await getDocs(plantsRef);

        for (const plantDoc of plantsSnap.docs) {
          const plantData = plantDoc.data() as any;

          // Archive plant data
          await setDoc(
            doc(db, "archived_users", userId, "plants", plantDoc.id),
            {
              ...plantData,
              archivedAt: new Date().toISOString(),
            }
          );

          // Archive logs
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

          // Delete original logs
          for (const logDoc of logsSnap.docs) {
            await deleteDoc(
              doc(db, "users", userId, "plants", plantDoc.id, "logs", logDoc.id)
            );
          }

          // Delete photos from Storage (coverPhoto + photos[])
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

          // Delete original plant
          await deleteDoc(plantDocRef(userId, plantDoc.id));
        }

        // Archive and delete reminders
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

        // Delete user document
        await deleteDoc(userRef);
      }

      // Delete Firebase Auth user
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

      // Best-effort: garbage collect any remaining files under images/{uid}
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

  const timezones = [
    "America/Argentina/Buenos_Aires",
    "America/Mexico_City",
    "America/Bogota",
    "America/Santiago",
    "America/Lima",
    "Europe/Madrid",
    "America/New_York",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
  ];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{t("settings.title")}</h1>

        <div className="space-y-6">
          {/* Account summary */}
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.account")}</CardTitle>
              <CardDescription>{t("settings.accountDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 text-sm">
                {userSettings.providerId?.includes("google") ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                ) : (
                  <span className="inline-block h-4 w-4 rounded-full bg-muted" />
                )}
                <span className="text-muted-foreground">
                  {userSettings.email}
                </span>
              </div>
              <div className="mt-4">
                <Button variant="outline" onClick={handleSignOut}>
                  {t("nav.signOut")}
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.preferences")}</CardTitle>
              <CardDescription>{t("settings.preferencesDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">{t("settings.language")}</Label>
                <div className="w-full max-w-xs">
                  <LanguageSwitcher />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">{t("settings.timezone")}</Label>
                <Select
                  value={userSettings.timezone}
                  onValueChange={handleTimezoneChange}
                >
                  <SelectTrigger id="timezone" className="w-full max-w-xs">
                    <SelectValue placeholder={t("settings.selectTimezone")} />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="dark-mode"
                  checked={userSettings.darkMode}
                  onCheckedChange={handleDarkModeChange}
                />
                <Label htmlFor="dark-mode">{t("settings.darkMode")}</Label>
              </div>

              <div className="space-y-2">
                <Label>{t("settings.roles")}</Label>
                <div className="grid grid-cols-2 gap-3 max-w-xs">
                  <label className="flex items-center gap-2 border rounded-md p-3 cursor-pointer">
                    <input
                      id="role-grower"
                      type="checkbox"
                      className="h-4 w-4"
                      checked={Boolean(userSettings.roles?.grower)}
                      onChange={async (e) => {
                        if (!userId) return;
                        const newRoles = {
                          grower: e.target.checked,
                          consumer: Boolean(userSettings.roles?.consumer),
                        };
                        await updateDoc(doc(db, "users", userId), {
                          roles: newRoles,
                        });
                        const next = { ...userSettings, roles: newRoles };
                        setUserSettings(next);
                        try {
                          localStorage.setItem(
                            `cf:userSettings:${userId}`,
                            JSON.stringify(next)
                          );
                        } catch {}
                        toast({ title: t("settings.updated") });
                      }}
                    />
                    <span>{t("onboarding.grower")}</span>
                  </label>
                  <label className="flex items-center gap-2 border rounded-md p-3 cursor-pointer">
                    <input
                      id="role-consumer"
                      type="checkbox"
                      className="h-4 w-4"
                      checked={Boolean(userSettings.roles?.consumer)}
                      onChange={async (e) => {
                        if (!userId) return;
                        const newRoles = {
                          grower: Boolean(userSettings.roles?.grower),
                          consumer: e.target.checked,
                        };
                        await updateDoc(doc(db, "users", userId), {
                          roles: newRoles,
                        });
                        const next = { ...userSettings, roles: newRoles };
                        setUserSettings(next);
                        try {
                          localStorage.setItem(
                            `cf:userSettings:${userId}`,
                            JSON.stringify(next)
                          );
                        } catch {}
                        toast({ title: t("settings.updated") });
                      }}
                    />
                    <span>{t("onboarding.consumer")}</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-destructive flex items-center">
                <Trash2 className="mr-2 h-5 w-5" />
                {t("settings.dangerZone")}
              </CardTitle>
              <CardDescription>{t("settings.dangerZoneDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    {t("settings.deleteAccount")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center">
                      <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
                      {t("settings.confirmDelete")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("settings.confirmDeleteDesc")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {t("settings.cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={isDeletingAccount}
                    >
                      {isDeletingAccount ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("settings.deleting")}
                        </>
                      ) : (
                        t("settings.confirmDeleteButton")
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>

        {/* Footer with privacy/terms links */}
        <footer className="mt-8 pt-6 border-t border-border">
          <div className="flex justify-center space-x-6 text-sm text-muted-foreground">
            <Link
              href={ROUTE_PRIVACY}
              className="hover:text-primary transition-colors"
            >
              {t("privacy.title")}
            </Link>
            <span>•</span>
            <Link
              href={ROUTE_TERMS}
              className="hover:text-primary transition-colors"
            >
              {t("terms.title")}
            </Link>
          </div>
        </footer>
      </div>
    </Layout>
  );
}
