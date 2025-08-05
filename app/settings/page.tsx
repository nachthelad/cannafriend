"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { useTranslation } from "@/hooks/use-translation"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore"
import { onAuthStateChanged, deleteUser } from "firebase/auth"
import { Layout } from "@/components/layout"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Loader2, Trash2, AlertTriangle } from "lucide-react"
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
} from "@/components/ui/alert-dialog"

export default function SettingsPage() {
  const { t, language, setLanguage } = useTranslation()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userSettings, setUserSettings] = useState<{
    timezone: string
    darkMode: boolean
  }>({
    timezone: "",
    darkMode: false,
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid)
      } else {
        // Check if we're in demo mode
        const isDemoMode = window.location.search.includes("demo=true") || !auth.currentUser
        if (isDemoMode) {
          setUserId("demo-user-123")
        } else {
          router.push("/login")
        }
      }
    })

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!userId) return

      try {
        const userRef = doc(db, "users", userId)
        const userSnap = await getDoc(userRef)

        if (userSnap.exists()) {
          const userData = userSnap.data()
          setUserSettings({
            timezone: userData.timezone || "",
            darkMode: userData.darkMode || false,
          })
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: t("settings.error"),
          description: error.message,
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchUserSettings()
    }
  }, [userId, toast, t])

  const handleTimezoneChange = async (value: string) => {
    if (!userId) return

    try {
      const userRef = doc(db, "users", userId)
      await updateDoc(userRef, {
        timezone: value,
      })

      setUserSettings({
        ...userSettings,
        timezone: value,
      })

      toast({
        title: t("settings.timezoneUpdated"),
        description: t("settings.timezoneUpdatedDesc"),
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("settings.error"),
        description: error.message,
      })
    }
  }

  const handleDarkModeChange = async (checked: boolean) => {
    if (!userId) return

    try {
      const userRef = doc(db, "users", userId)
      await updateDoc(userRef, {
        darkMode: checked,
      })

      setUserSettings({
        ...userSettings,
        darkMode: checked,
      })

      toast({
        title: t("settings.darkModeUpdated"),
        description: checked ? t("settings.darkModeOn") : t("settings.darkModeOff"),
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("settings.error"),
        description: error.message,
      })
    }
  }

  const handleDeleteAccount = async () => {
    if (!userId || !auth.currentUser) return

    setIsDeletingAccount(true)

    try {
      // Archive user data
      const userRef = doc(db, "users", userId)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const userData = userSnap.data()

        // Create archive document
        await setDoc(doc(db, "archived_users", userId), {
          ...userData,
          archivedAt: new Date().toISOString(),
        })

        // Archive plants
        const plantsRef = collection(db, "users", userId, "plants")
        const plantsSnap = await getDocs(plantsRef)

        for (const plantDoc of plantsSnap.docs) {
          const plantData = plantDoc.data()

          // Archive plant data
          await setDoc(doc(db, "archived_users", userId, "plants", plantDoc.id), {
            ...plantData,
            archivedAt: new Date().toISOString(),
          })

          // Archive logs
          const logsRef = collection(db, "users", userId, "plants", plantDoc.id, "logs")
          const logsSnap = await getDocs(logsRef)

          for (const logDoc of logsSnap.docs) {
            await setDoc(doc(db, "archived_users", userId, "plants", plantDoc.id, "logs", logDoc.id), {
              ...logDoc.data(),
              archivedAt: new Date().toISOString(),
            })
          }

          // Delete original logs
          for (const logDoc of logsSnap.docs) {
            await deleteDoc(doc(db, "users", userId, "plants", plantDoc.id, "logs", logDoc.id))
          }

          // Delete original plant
          await deleteDoc(doc(db, "users", userId, "plants", plantDoc.id))
        }

        // Delete user document
        await deleteDoc(userRef)
      }

      // Delete Firebase Auth user
      await deleteUser(auth.currentUser)

      toast({
        title: t("settings.accountDeleted"),
        description: t("settings.accountDeletedDesc"),
      })

      router.push("/login")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("settings.deleteError"),
        description: error.message,
      })
      setIsDeletingAccount(false)
    }
  }

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
  ]

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{t("settings.title")}</h1>

        <div className="space-y-6">
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
                <Select value={userSettings.timezone} onValueChange={handleTimezoneChange}>
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
                <Switch id="dark-mode" checked={userSettings.darkMode} onCheckedChange={handleDarkModeChange} />
                <Label htmlFor="dark-mode">{t("settings.darkMode")}</Label>
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
                  <Button variant="destructive">{t("settings.deleteAccount")}</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center">
                      <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
                      {t("settings.confirmDelete")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>{t("settings.confirmDeleteDesc")}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("settings.cancel")}</AlertDialogCancel>
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
      </div>
    </Layout>
  )
}
