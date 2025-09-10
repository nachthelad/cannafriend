"use client";

import { useEffect, useState } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import { ROUTE_AI_ASSISTANT, ROUTE_SESSIONS } from "@/lib/routes";
import { Layout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Calendar, Clock, Heart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ROUTE_LOGIN } from "@/lib/routes";
import { sessionsCol, userDoc } from "@/lib/paths";
import {
  collection,
  getDocs,
  query,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { useUserRoles } from "@/hooks/use-user-roles";
import { usePremium } from "@/hooks/use-premium";
import { formatDateTime } from "@/lib/format";
import { LocalizedCalendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, formatDateObjectWithLocale } from "@/lib/utils";
import { Brain } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/common/image-upload";
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

type Session = {
  id: string;
  strain: string;
  method?: string;
  amount?: string;
  effects?: string[];
  notes?: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  photos?: string[] | null;
};

export default function SessionsPage() {
  const { t } = useTranslation(["sessions", "common"]);
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const { user, isLoading: authLoading } = useAuthUser();
  const userId = user?.uid ?? null;
  const [editOpen, setEditOpen] = useState(false);
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editStrain, setEditStrain] = useState("");
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editPhotos, setEditPhotos] = useState<string[]>([]);
  const { roles } = useUserRoles();
  const { isPremium } = usePremium();
  const [favoriteStrains, setFavoriteStrains] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push(ROUTE_LOGIN);
  }, [authLoading, user, router]);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!userId) return;
      try {
        const ref = sessionsCol(userId);
        const q = query(ref);
        const snap = await getDocs(q);
        const list: Session[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        list.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setSessions(list);
        // load favorites
        const uSnap = await getDoc(userDoc(userId));
        setFavoriteStrains(
          ((uSnap.data() as any)?.favoriteStrains as string[]) || []
        );
      } catch (e: any) {
        toast({
          variant: "destructive",
          title: t("error", { ns: "common" }),
          description: e?.message || String(e),
        });
      } finally {
        setIsLoading(false);
      }
    };
    if (userId) void fetchSessions();
  }, [userId]);

  const normalizeStrain = (name: string) => name.trim().toLowerCase();

  const toggleFavorite = async (strainName: string) => {
    if (!userId) return;
    const norm = normalizeStrain(strainName);
    const isFav = favoriteStrains.includes(norm);
    try {
      await updateDoc(userDoc(userId), {
        favoriteStrains: isFav ? arrayRemove(norm) : arrayUnion(norm),
      });
      setFavoriteStrains((prev) =>
        isFav ? prev.filter((s) => s !== norm) : [...prev, norm]
      );
      toast({
        title: isFav
          ? t("favorites.removed", { ns: "sessions" })
          : t("favorites.added", { ns: "sessions" }),
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: t("error", { ns: "common" }),
        description: e?.message || String(e),
      });
    }
  };

  const openEdit = (s: Session) => {
    setEditSession(s);
    setEditNotes(s.notes || "");
    setEditStrain(s.strain || "");
    // Date
    try {
      setEditDate(s.date ? new Date(s.date) : new Date());
    } catch {
      setEditDate(new Date());
    }
    // Time HH:MM from ISO
    const isoToHHMM = (v?: string | null) => {
      if (!v) return "";
      const d = new Date(v);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    };
    setEditStartTime(isoToHHMM(s.startTime || undefined));
    setEditEndTime(isoToHHMM(s.endTime || undefined));
    setEditPhotos([...(s.photos || [])]);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!userId || !editSession) return;
    try {
      const buildDateTime = (base: Date, hhmm: string) => {
        if (!hhmm) return null;
        const [hh, mm] = hhmm.split(":").map((x) => Number.parseInt(x, 10));
        const d = new Date(base);
        d.setHours(
          Number.isFinite(hh) ? hh : 0,
          Number.isFinite(mm) ? mm : 0,
          0,
          0
        );
        return d.toISOString();
      };
      const startISO = buildDateTime(editDate, editStartTime);
      const endISO = buildDateTime(editDate, editEndTime);
      const dateISO =
        startISO ||
        new Date(
          editDate.getFullYear(),
          editDate.getMonth(),
          editDate.getDate()
        ).toISOString();

      await updateDoc(doc(db, "users", userId, "sessions", editSession.id), {
        notes: editNotes,
        strain: editStrain,
        date: dateISO,
        startTime: startISO,
        endTime: endISO,
        photos: editPhotos.length > 0 ? editPhotos : null,
      });
      setSessions((prev) =>
        prev.map((x) =>
          x.id === editSession.id
            ? {
                ...x,
                notes: editNotes,
                strain: editStrain,
                date: dateISO,
                startTime: startISO,
                endTime: endISO,
                photos: editPhotos.length > 0 ? editPhotos : null,
              }
            : x
        )
      );
      toast({ title: t("updated", { ns: "sessions" }) });
      setEditOpen(false);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: t("error", { ns: "common" }),
        description: e?.message || String(e),
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, "users", userId, "sessions", id));
      setSessions((prev) => prev.filter((x) => x.id !== id));
      toast({ title: t("deleted", { ns: "sessions" }) });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: t("error", { ns: "common" }),
        description: e?.message || String(e),
      });
    }
  };

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center">
            {/* Desktop title */}
            <h1 className="hidden md:block text-3xl font-bold">
              {t("title", { ns: "sessions" })}
            </h1>
            {/* Mobile title */}
            <h1 className="md:hidden text-3xl font-bold">
              {t("title", { ns: "sessions" })}
            </h1>
          </div>
          <p className="text-muted-foreground mt-1">
            {t("description", { ns: "sessions" })}
          </p>
          {isPremium ? (
            <div className="mt-3">
              <Button
                onClick={() => router.push(ROUTE_AI_ASSISTANT)}
                className="text-white bg-gradient-to-r from-emerald-500 via-green-600 to-teal-500 hover:from-emerald-600 hover:via-green-700 hover:to-teal-600"
              >
                <Brain className="mr-2 h-4 w-4" />{" "}
                {t("aiConsumer.title", { ns: "sessions" })}
              </Button>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => router.push(`${ROUTE_SESSIONS}/new`)}
            className="hidden sm:inline-flex"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("addSession", { ns: "sessions" })}
          </Button>
          <Button
            onClick={() => router.push(`${ROUTE_SESSIONS}/new`)}
            aria-label={t("addSession", { ns: "sessions" })}
            className="h-9 w-9 p-0 sm:hidden"
          >
            <Plus className="h-5 w-5" />
          </Button>
          <Button
            variant={showFavoritesOnly ? "secondary" : "outline"}
            onClick={() => setShowFavoritesOnly((v) => !v)}
            className="hidden sm:inline-flex"
          >
            <Heart className="mr-2 h-4 w-4" />{" "}
            {t("favorites.filter", { ns: "sessions" })}
          </Button>
          <Button
            onClick={() => setShowFavoritesOnly((v) => !v)}
            aria-label={t("favorites.filter", { ns: "sessions" })}
            className="h-9 w-9 p-0 sm:hidden"
            variant={showFavoritesOnly ? "secondary" : "outline"}
          >
            <Heart className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-4 md:p-6 space-y-4 overflow-x-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-2 w-full sm:w-auto">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-44 sm:w-72" />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("noSessions", { ns: "sessions" })}</CardTitle>
            <CardDescription>
              {t("noSessionsDesc", { ns: "sessions" })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push(`${ROUTE_SESSIONS}/new`)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("addSession", { ns: "sessions" })}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions
            .filter((s) =>
              showFavoritesOnly
                ? favoriteStrains.includes(normalizeStrain(s.strain))
                : true
            )
            .map((s) => (
              <Card key={s.id}>
                <CardHeader className="flex items-start justify-between space-y-0 gap-2">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="truncate">{s.strain}</CardTitle>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(s.strain)}
                        aria-label="toggle favorite"
                        className={cn(
                          "inline-flex h-7 w-7 items-center justify-center rounded-md",
                          favoriteStrains.includes(normalizeStrain(s.strain))
                            ? "text-red-500"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Heart
                          className={cn(
                            "h-4 w-4",
                            favoriteStrains.includes(
                              normalizeStrain(s.strain)
                            ) && "fill-current"
                          )}
                        />
                      </button>
                    </div>
                    <CardDescription className="text-xs mt-1">
                      {formatDateTime(s.date, "short")}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("edit", { ns: "sessions" })}
                      onClick={() => openEdit(s)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t("delete", { ns: "sessions" })}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {t("deleteConfirmTitle", { ns: "sessions" })}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("deleteConfirmDesc", { ns: "sessions" })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            {t("cancel", { ns: "common" })}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(s.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {t("deleteConfirm", { ns: "sessions" })}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(s.method || s.amount) && (
                    <p className="text-xs text-muted-foreground">
                      {s.method ? s.method : ""}
                      {s.method && s.amount ? " • " : ""}
                      {s.amount ? s.amount : ""}
                    </p>
                  )}
                  {s.notes && <p className="text-sm">{s.notes}</p>}
                  {s.photos && s.photos.length > 0 && (
                    <div className="mt-1 grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {s.photos.slice(0, 8).map((url, idx) => (
                        <div
                          key={idx}
                          className="relative w-full aspect-square overflow-hidden rounded-md border"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`photo ${idx + 1}`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Edit Session Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("editSession", { ns: "sessions" })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">
                {t("strain", { ns: "sessions" })}
              </label>
              <Input
                value={editStrain}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditStrain(e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("logForm.date", { ns: "sessions" })}
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal")}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {formatDateObjectWithLocale(editDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={editDate}
                    onSelect={(d) => d && setEditDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("startTime", { ns: "sessions" })}
                </label>
                <TimeField value={editStartTime} onChange={setEditStartTime} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("endTime", { ns: "sessions" })}
                </label>
                <TimeField value={editEndTime} onChange={setEditEndTime} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">
                {t("notes", { ns: "sessions" })}
              </label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                {t("photos", { ns: "sessions" })}
              </label>
              <ImageUpload
                onImagesChange={(newUrls) =>
                  setEditPhotos((prev) => [...prev, ...newUrls])
                }
                maxSizeMB={5}
              />
              {editPhotos.length > 0 && (
                <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {editPhotos.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative w-full aspect-square overflow-hidden rounded-md border"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`photo ${idx + 1}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              {t("cancel", { ns: "common" })}
            </Button>
            <Button onClick={saveEdit}>
              {t("update", { ns: "sessions" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function TimeField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const sanitize = (v: string) => {
    const filtered = v.replace(/[^0-9:]/g, "");
    const parts = filtered.split(":");
    if (parts.length > 2) {
      const [a, b] = parts;
      return `${a}:${b}`.slice(0, 5);
    }
    return filtered.slice(0, 5);
  };

  const pad2 = (n: number) => String(n).padStart(2, "0");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(sanitize(e.target.value));
  };

  const handleBlur = () => {
    const raw = (value || "").trim();
    if (!raw) return;
    const onlyDigits = raw.replace(/\D/g, "");
    let hh = 0;
    let mm = 0;
    if (raw.includes(":")) {
      const [h, m = "0"] = raw.split(":");
      hh = Number.parseInt(h || "0", 10);
      mm = Number.parseInt(m || "0", 10);
    } else if (onlyDigits.length <= 2) {
      hh = Number.parseInt(onlyDigits || "0", 10);
      mm = 0;
    } else {
      const d = onlyDigits.padEnd(4, "0");
      hh = Number.parseInt(d.slice(0, 2), 10);
      mm = Number.parseInt(d.slice(2, 4), 10);
    }
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return;
    hh = Math.min(23, Math.max(0, hh));
    mm = Math.min(59, Math.max(0, mm));
    onChange(`${pad2(hh)}:${pad2(mm)}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="HH:MM"
        inputMode="numeric"
        className="w-32"
      />
    </div>
  );
}
