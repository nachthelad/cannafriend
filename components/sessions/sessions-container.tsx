"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  arrayRemove,
  arrayUnion,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
} from "firebase/firestore";
import { ROUTE_SESSIONS, resolveHomePathForRoles } from "@/lib/routes";
import { sessionsCol, userDoc } from "@/lib/paths";
import { getSuspenseResource } from "@/lib/suspense-utils";
import { useToast } from "@/hooks/use-toast";
import { toastSuccess } from "@/lib/toast-helpers";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { SessionsList } from "./sessions-list";
import { SessionsSkeleton } from "./sessions-skeleton";
import { ResponsivePageHeader } from "@/components/common/responsive-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, ArrowUpDown, Plus } from "lucide-react";
import Link from "next/link";
import {
  MobileSessions,
  SessionDetailView,
} from "@/components/mobile/mobile-sessions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type {
  Session,
  SessionsContainerProps,
  SessionsData,
  SessionEditFormValues,
} from "@/types";
import { auth } from "@/lib/firebase";
import { ROUTE_DASHBOARD } from "@/lib/routes";

async function fetchSessionsData(userId: string): Promise<SessionsData> {
  const ref = sessionsCol(userId);
  const snapshot = await getDocs(query(ref));
  const sessions: Session[] = [];

  snapshot.forEach((docSnapshot) => {
    sessions.push({ id: docSnapshot.id, ...(docSnapshot.data() as any) });
  });

  sessions.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  let favoriteStrains: string[] = [];
  try {
    const favoritesSnapshot = await getDoc(userDoc(userId));
    if (favoritesSnapshot.exists()) {
      favoriteStrains =
        ((favoritesSnapshot.data() as any)?.favoriteStrains as string[]) || [];
    }
  } catch {
    favoriteStrains = [];
  }

  let isPremium = false;
  try {
    if (
      typeof window !== "undefined" &&
      window.localStorage.getItem("cf_premium") === "1"
    ) {
      isPremium = true;
    } else if (auth.currentUser) {
      const token = await auth.currentUser.getIdTokenResult(true);
      const claims = token.claims as any;
      const boolPremium = Boolean(claims?.premium);
      const until =
        typeof claims?.premium_until === "number" ? claims.premium_until : 0;
      const timePremium = until > Date.now();
      isPremium = Boolean(boolPremium || timePremium);
    }
  } catch {
    isPremium = false;
  }

  return { sessions, favoriteStrains, isPremium };
}

function SessionsContainerContent({
  userId,
  searchQuery,
  filterMethod,
  sortBy,
  onSearchChange,
  onFilterMethodChange,
  onSortByChange,
  availableMethods,
  isPremium,
}: SessionsContainerProps & {
  searchQuery: string;
  filterMethod: string;
  sortBy: string;
  onSearchChange: (val: string) => void;
  onFilterMethodChange: (val: string) => void;
  onSortByChange: (val: string) => void;
  availableMethods: string[];
  isPremium: boolean;
}) {
  const { t } = useTranslation(["sessions", "common"]);
  const { toast } = useToast();
  const { handleFirebaseError } = useErrorHandler();

  const cacheKey = `sessions-${userId}`;
  const resource = getSuspenseResource(cacheKey, () =>
    fetchSessionsData(userId),
  );
  const { sessions: initialSessions, favoriteStrains: initialFavoriteStrains } =
    resource.read();

  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [favoriteStrains, setFavoriteStrains] = useState<string[]>(
    initialFavoriteStrains,
  );
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const previousSessionsRef = useRef<Session[] | null>(initialSessions);
  const previousFavoritesRef = useRef<string[] | null>(initialFavoriteStrains);

  useEffect(() => {
    if (previousSessionsRef.current === initialSessions) {
      return;
    }
    previousSessionsRef.current = initialSessions;
    setSessions(initialSessions);
  }, [initialSessions]);

  useEffect(() => {
    if (previousFavoritesRef.current === initialFavoriteStrains) {
      return;
    }
    previousFavoritesRef.current = initialFavoriteStrains;
    setFavoriteStrains(initialFavoriteStrains);
  }, [initialFavoriteStrains]);

  const normalizeStrain = (name: string) => name.trim().toLowerCase();

  const favoriteSet = useMemo(
    () => new Set(favoriteStrains.map((item) => item.trim().toLowerCase())),
    [favoriteStrains],
  );

  // Get available methods for filtering
  const calculatedMethods = useMemo(() => {
    const methods = new Set<string>();
    sessions.forEach((session) => {
      if (session.method && session.method.trim()) {
        methods.add(session.method.trim());
      }
    });
    return Array.from(methods).sort();
  }, [sessions]);

  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    let filtered = sessions;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (session) =>
          session.strain.toLowerCase().includes(query) ||
          (session.method && session.method.toLowerCase().includes(query)) ||
          (session.notes && session.notes.toLowerCase().includes(query)),
      );
    }

    // Method filter
    if (filterMethod !== "all") {
      filtered = filtered.filter((session) => session.method === filterMethod);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "strain-asc":
          return a.strain.localeCompare(b.strain);
        case "strain-desc":
          return b.strain.localeCompare(a.strain);
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return filtered;
  }, [sessions, searchQuery, filterMethod, sortBy]);

  const handleView = (session: Session) => {
    setSelectedSession(session);
  };

  const handleToggleFavorite = async (session: Session) => {
    const normalized = normalizeStrain(session.strain);
    const isFav = favoriteSet.has(normalized);
    try {
      await updateDoc(userDoc(userId), {
        favoriteStrains: isFav
          ? arrayRemove(normalized)
          : arrayUnion(normalized),
      });
      setFavoriteStrains((prev) =>
        isFav
          ? prev.filter((item) => item !== normalized)
          : [...prev, normalized],
      );
    } catch (error) {
      handleFirebaseError(error, "toggle favorite");
    }
  };

  const handleEdit = async (
    updatedSession: SessionEditFormValues & { id: string },
  ) => {
    if (!userId) return;

    try {
      const updateData: Record<string, any> = {
        strain: updatedSession.strain,
        date: updatedSession.date.toISOString(),
        startTime: updatedSession.startTime
          ? new Date(`1970-01-01T${updatedSession.startTime}:00`).toISOString()
          : null,
        endTime: updatedSession.endTime
          ? new Date(`1970-01-01T${updatedSession.endTime}:00`).toISOString()
          : null,
      };

      if (updatedSession.notes && updatedSession.notes.trim()) {
        updateData.notes = updatedSession.notes;
      }
      if (updatedSession.photos && updatedSession.photos.length > 0) {
        updateData.photos = updatedSession.photos;
      }
      if (updatedSession.method && updatedSession.method.trim()) {
        updateData.method = updatedSession.method;
      }
      if (updatedSession.amount && updatedSession.amount.trim()) {
        updateData.amount = updatedSession.amount;
      }

      await updateDoc(doc(sessionsCol(userId), updatedSession.id), updateData);

      setSessions((prev) =>
        prev.map((session) =>
          session.id === updatedSession.id
            ? ({ ...session, ...updateData } as Session)
            : session,
        ),
      );

      toastSuccess(toast, t, { titleKey: "updated", namespace: "sessions" });
    } catch (error) {
      console.error("Error updating session:", error);
      toast({
        title: t("error", { ns: "sessions" }),
        description: t("updateError", { ns: "sessions" }),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (sessionId: string) => {
    try {
      await deleteDoc(doc(sessionsCol(userId), sessionId));
      setSessions((prev) => prev.filter((session) => session.id !== sessionId));
      toastSuccess(toast, t, { titleKey: "deleted", namespace: "sessions" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("error", { ns: "common" }),
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const isFavorite = (session: Session) =>
    favoriteSet.has(normalizeStrain(session.strain));

  const handleDesktopEdit = (session: Session) => {
    setSelectedSession(session);
  };

  return (
    <>
      <div className="md:hidden">
        <MobileSessions
          sessions={filteredSessions}
          addSessionHref={`${ROUTE_SESSIONS}/new`}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleFavorite={handleToggleFavorite}
          isFavorite={isFavorite}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          filterMethod={filterMethod}
          onFilterMethodChange={onFilterMethodChange}
          sortBy={sortBy}
          onSortByChange={onSortByChange}
          availableMethods={calculatedMethods}
          backHref={ROUTE_DASHBOARD}
        />
      </div>

      {/* Desktop Sessions - only show on desktop */}
      <div className="hidden md:block">
        <ResponsivePageHeader
          title={t("title", { ns: "sessions" })}
          description={t("description", { ns: "sessions" })}
          backHref={ROUTE_DASHBOARD}
          desktopControls={
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                {/* Search Input */}
                <div className="relative flex-1 sm:max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t("search.placeholder", { ns: "sessions" })}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Method Filter */}
                <Select value={filterMethod} onValueChange={setFilterMethod}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue
                      placeholder={t("filter.method", { ns: "sessions" })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("filter.allMethods", { ns: "sessions" })}
                    </SelectItem>
                    {availableMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort By */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px]">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    <SelectValue
                      placeholder={t("sort.label", { ns: "sessions" })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">
                      {t("sort.dateDesc", { ns: "sessions" })}
                    </SelectItem>
                    <SelectItem value="date-asc">
                      {t("sort.dateAsc", { ns: "sessions" })}
                    </SelectItem>
                    <SelectItem value="strain-asc">
                      {t("sort.strainAsc", { ns: "sessions" })}
                    </SelectItem>
                    <SelectItem value="strain-desc">
                      {t("sort.strainDesc", { ns: "sessions" })}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          }
          desktopActions={
            <Button asChild>
              <Link href={`${ROUTE_SESSIONS}/new`}>
                <Plus className="mr-2 h-4 w-4" />
                {t("addSession", { ns: "sessions" })}
              </Link>
            </Button>
          }
          sticky={true}
        />
        <div className="mt-6">
          <SessionsList
            sessions={filteredSessions}
            t={t}
            addSessionHref={`${ROUTE_SESSIONS}/new`}
            onEdit={handleDesktopEdit}
            onDelete={handleDelete}
            onToggleFavorite={handleToggleFavorite}
            isFavorite={isFavorite}
            hasActiveFilter={
              searchQuery.trim() !== "" || filterMethod !== "all"
            }
            onView={handleView}
          />
        </div>
      </div>

      <Dialog
        open={!!selectedSession}
        onOpenChange={() => setSelectedSession(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <VisuallyHidden>
            <DialogHeader>
              <DialogTitle>
                {selectedSession
                  ? `${t("viewSession", {
                      ns: "sessions",
                      defaultValue: "View Session",
                    })}: ${selectedSession.strain}`
                  : t("sessionDetails", {
                      ns: "sessions",
                      defaultValue: "Session Details",
                    })}
              </DialogTitle>
            </DialogHeader>
          </VisuallyHidden>
          {selectedSession && (
            <SessionDetailView
              session={selectedSession}
              t={t}
              onBack={() => setSelectedSession(null)}
              onEdit={handleEdit}
              onDelete={(sessionId) => {
                handleDelete(sessionId);
                setSelectedSession(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function SessionsContainer({ userId }: SessionsContainerProps) {
  const { t } = useTranslation(["sessions", "common"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMethod, setFilterMethod] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const checkPremium = async () => {
      try {
        if (
          typeof window !== "undefined" &&
          window.localStorage.getItem("cf_premium") === "1"
        ) {
          setIsPremium(true);
        } else if (auth.currentUser) {
          const token = await auth.currentUser.getIdTokenResult(true);
          const claims = token.claims as any;
          setIsPremium(
            Boolean(
              claims?.premium ||
              (claims?.premium_until && claims.premium_until > Date.now()),
            ),
          );
        }
      } catch {
        // Ignore
      }
    };
    checkPremium();
  }, [userId]);

  return (
    <div className="space-y-6">
      <div className="hidden md:block">
        <SessionsHeader
          t={t}
          addSessionHref={`${ROUTE_SESSIONS}/new`}
          onOpenAssistant={() => {}}
          isPremium={isPremium}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterMethod={filterMethod}
          onFilterMethodChange={setFilterMethod}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          availableMethods={[]} // Will be populated in Content
        />
      </div>

      <Suspense fallback={<SessionsSkeleton />}>
        <SessionsContainerContent
          userId={userId}
          searchQuery={searchQuery}
          filterMethod={filterMethod}
          sortBy={sortBy}
          onSearchChange={setSearchQuery}
          onFilterMethodChange={setFilterMethod}
          onSortByChange={setSortBy}
          availableMethods={[]} // This placeholder is fine for initial render
          isPremium={isPremium}
        />
      </Suspense>
    </div>
  );
}
