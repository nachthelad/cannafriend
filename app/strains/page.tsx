"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Pencil, Trash2, ChevronDown } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ROUTE_LOGIN } from "@/lib/routes";
import { sessionsCol } from "@/lib/paths";
import {
  collection,
  getDocs,
  query,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { useTranslation } from "@/hooks/use-translation";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserRoles } from "@/hooks/use-user-roles";
import { formatDateTime } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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
};

export default function StrainsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const { user, isLoading: authLoading } = useAuthUser();
  const userId = user?.uid ?? null;
  const [editOpen, setEditOpen] = useState(false);
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const { roles } = useUserRoles();

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
      } catch (e: any) {
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: e?.message || String(e),
        });
      } finally {
        setIsLoading(false);
      }
    };
    if (userId) void fetchSessions();
  }, [userId]);

  const openEdit = (s: Session) => {
    setEditSession(s);
    setEditNotes(s.notes || "");
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!userId || !editSession) return;
    try {
      await updateDoc(doc(db, "users", userId, "sessions", editSession.id), {
        notes: editNotes,
      });
      setSessions((prev) =>
        prev.map((x) =>
          x.id === editSession.id ? { ...x, notes: editNotes } : x
        )
      );
      toast({ title: t("strains.updated") });
      setEditOpen(false);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: e?.message || String(e),
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, "users", userId, "sessions", id));
      setSessions((prev) => prev.filter((x) => x.id !== id));
      toast({ title: t("strains.deleted") });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: t("common.error"),
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
              {t("strains.title")}
            </h1>
            {/* Mobile: title acts as trigger when both roles; otherwise just title */}
            {roles?.grower && roles?.consumer ? (
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label="switch"
                      className="flex items-center p-"
                    >
                      <h1 className="text-3xl font-bold">
                        {t("strains.title")}
                      </h1>
                      <ChevronDown className="h-5 w-5 ml-1" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" sideOffset={2}>
                    <DropdownMenuItem
                      className="text-base py-2"
                      onClick={() => router.push("/dashboard")}
                    >
                      {t("dashboard.title")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <h1 className="md:hidden text-3xl font-bold">
                {t("strains.title")}
              </h1>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            {t("strains.description")}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => router.push("/sessions/new")}
            className="hidden sm:inline-flex"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("strains.addSession")}
          </Button>
          <Button
            onClick={() => router.push("/sessions/new")}
            aria-label={t("strains.addSession")}
            className="h-9 w-9 p-0 sm:hidden"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("strains.noSessions")}</CardTitle>
            <CardDescription>{t("strains.noSessionsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/sessions/new")}>
              <Plus className="mr-2 h-4 w-4" />
              {t("strains.addSession")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => (
            <Card key={s.id}>
              <CardHeader className="flex items-start justify-between space-y-0 gap-2">
                <div className="min-w-0 pr-2">
                  <CardTitle className="truncate">{s.strain}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {formatDateTime(s.date, "short")}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("strains.edit")}
                    onClick={() => openEdit(s)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("strains.delete")}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t("strains.deleteConfirmTitle")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("strains.deleteConfirmDesc")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {t("settings.cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(s.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t("strains.deleteConfirm")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent>
                {s.notes && <p className="text-sm">{s.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Session Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("strains.editSession")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">
                {t("strains.notes")}
              </label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={saveEdit}>{t("strains.update")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
