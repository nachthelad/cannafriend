"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { AdminUsersTable } from "@/components/admin/users-table";
import { AdminMpSearch } from "@/components/admin/mp-search";
import { AdminStripeSearch } from "@/components/admin/stripe-search";
import type {
  AdminUser,
  SortDirection,
  MpSearchFilters,
  MpSearchItem,
  StripeSearchFilters,
  StripeSearchItem,
} from "@/types/admin";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useUserRoles } from "@/hooks/use-user-roles";
import { useToast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { authorizedFetch, copyToClipboard } from "@/lib/admin/utils";
import { ADMIN_EMAIL } from "@/lib/constants";
import { ROUTE_LOGIN, resolveHomePathForRoles } from "@/lib/routes";
import { getSuspenseResource } from "@/lib/suspense-utils";

const USERS_CACHE_KEY = "admin-users";

async function fetchAdminUsers(): Promise<AdminUser[]> {
  const response = await authorizedFetch("/api/admin/users");
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || "request_failed");
  }
  return (data?.users || []) as AdminUser[];
}

function AdminSkeleton() {
  return (
    <div className="py-12 text-center text-sm text-muted-foreground">
      Cargando panel de administración...
    </div>
  );
}

function AdminContent() {
  const { toast } = useToast();
  const { handleError } = useErrorHandler();

  const usersResource = getSuspenseResource(USERS_CACHE_KEY, fetchAdminUsers);
  const initialUsers = usersResource.read();

  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [sortDir, setSortDir] = useState<SortDirection>("newest");
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  const [mpFilters, setMpFilters] = useState<MpSearchFilters>({
    uid: "",
    status: "",
    scope: "all",
  });
  const [mpItems, setMpItems] = useState<MpSearchItem[]>([]);
  const [mpLoading, setMpLoading] = useState(false);

  const [stripeFilters, setStripeFilters] = useState<StripeSearchFilters>({
    email: "",
    scope: "all",
  });
  const [stripeItems, setStripeItems] = useState<StripeSearchItem[]>([]);
  const [stripeLoading, setStripeLoading] = useState(false);

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const refreshUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const next = await fetchAdminUsers();
      setUsers(next);
    } catch (error: any) {
      handleError(error);
    } finally {
      setUsersLoading(false);
    }
  }, [handleError]);

  const handleTogglePremium = useCallback(
    async (user: AdminUser, next: boolean) => {
      const previous = users;
      setUsers((list) =>
        list.map((entry) =>
          entry.uid === user.uid ? { ...entry, premium: next } : entry
        )
      );
      try {
        const response = await authorizedFetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: user.uid, premium: next }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "update_failed");
        }
      } catch (error: any) {
        setUsers(previous);
        handleError(error);
      }
    },
    [handleError, users]
  );

  const handleCopy = useCallback(
    async (value: string, label: string = "Valor") => {
      const copied = await copyToClipboard(value);
      if (!copied) {
        toast({
          variant: "destructive",
          title: "No se pudo copiar",
          description: `${label} no se pudo copiar. Intenta nuevamente desde un navegador compatible`,
        });
      }
    },
    [toast]
  );

  const handleMpSearch = useCallback(async () => {
    setMpLoading(true);
    try {
      const params = new URLSearchParams();
      if (mpFilters.uid) params.set("external_reference", mpFilters.uid);
      if (mpFilters.status) params.set("status", mpFilters.status);
      if (mpFilters.scope !== "all") params.set("scope", mpFilters.scope);
      const response = await authorizedFetch(
        `/api/mercadopago/admin/unified-search?${params.toString()}`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "search_failed");
      }
      const items = (data?.items || []) as MpSearchItem[];
      setMpItems(items);
    } catch (error: any) {
      handleError(error);
    } finally {
      setMpLoading(false);
    }
  }, [handleError, mpFilters]);

  const handleMpReprocess = useCallback(
    async (item: MpSearchItem) => {
      setMpLoading(true);
      try {
        const response = await fetch(
          `/api/mercadopago/webhook?type=${encodeURIComponent(
            item.type
          )}&id=${encodeURIComponent(item.id)}`
        );
        const data = await response.json();
        if (!response.ok || data?.error) {
          throw new Error(data?.error || "reprocess_failed");
        }
        toast({
          title: "Reprocesado",
          description: `premium: ${data?.premium ? "true" : "false"}`,
        });
        await refreshUsers();
      } catch (error: any) {
        handleError(error);
      } finally {
        setMpLoading(false);
      }
    },
    [toast, handleError, refreshUsers]
  );

  const handleStripeSearch = useCallback(async () => {
    if (!stripeFilters.email) return;
    setStripeLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("email", stripeFilters.email);
      if (stripeFilters.scope !== "all")
        params.set("scope", stripeFilters.scope);
      const response = await authorizedFetch(
        `/api/stripe/admin/search?${params.toString()}`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "search_failed");
      }
      const items = (data?.items || []) as StripeSearchItem[];
      setStripeItems(items);
    } catch (error: any) {
      handleError(error);
    } finally {
      setStripeLoading(false);
    }
  }, [handleError, stripeFilters]);

  const handleStripeReprocess = useCallback(
    async (item: StripeSearchItem) => {
      setStripeLoading(true);
      try {
        const response = await authorizedFetch("/api/stripe/admin/reprocess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: item.type, id: item.id }),
        });
        const data = await response.json();
        if (!response.ok || data?.error) {
          throw new Error(data?.error || "reprocess_failed");
        }
        toast({
          title: "Reprocesado",
          description: `premium: ${data?.premium ? "true" : "false"}`,
        });
        await refreshUsers();
      } catch (error: any) {
        handleError(error);
      } finally {
        setStripeLoading(false);
      }
    },
    [toast, handleError, refreshUsers]
  );

  return (
    <div className="w-full space-y-8">
      <div className="md:hidden space-y-6">
        <AdminUsersTable
          adminEmail={ADMIN_EMAIL}
          users={users}
          loading={usersLoading}
          sortDir={sortDir}
          onSortChange={setSortDir}
          onRefresh={refreshUsers}
          onTogglePremium={handleTogglePremium}
          onCopy={handleCopy}
          searchQuery={userSearchQuery}
          onSearchChange={setUserSearchQuery}
          variant="mobile"
        />
        <AdminMpSearch
          filters={mpFilters}
          items={mpItems}
          loading={mpLoading}
          onFiltersChange={(next) =>
            setMpFilters((prev) => ({ ...prev, ...next }))
          }
          onSearch={handleMpSearch}
          onReprocess={handleMpReprocess}
          variant="mobile"
        />
        <AdminStripeSearch
          filters={stripeFilters}
          items={stripeItems}
          loading={stripeLoading}
          onFiltersChange={(next) =>
            setStripeFilters((prev) => ({ ...prev, ...next }))
          }
          onSearch={handleStripeSearch}
          onReprocess={handleStripeReprocess}
          variant="mobile"
        />
      </div>

      <div className="hidden md:flex flex-col gap-8">
        <AdminUsersTable
          adminEmail={ADMIN_EMAIL}
          users={users}
          loading={usersLoading}
          sortDir={sortDir}
          onSortChange={setSortDir}
          onRefresh={refreshUsers}
          onTogglePremium={handleTogglePremium}
          onCopy={handleCopy}
          searchQuery={userSearchQuery}
          onSearchChange={setUserSearchQuery}
        />
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          <AdminMpSearch
            filters={mpFilters}
            items={mpItems}
            loading={mpLoading}
            onFiltersChange={(next) =>
              setMpFilters((prev) => ({ ...prev, ...next }))
            }
            onSearch={handleMpSearch}
            onReprocess={handleMpReprocess}
          />
          <AdminStripeSearch
            filters={stripeFilters}
            items={stripeItems}
            loading={stripeLoading}
            onFiltersChange={(next) =>
              setStripeFilters((prev) => ({ ...prev, ...next }))
            }
            onSearch={handleStripeSearch}
            onReprocess={handleStripeReprocess}
          />
        </div>
      </div>
    </div>
  );
}

export function AdminContainer() {
  const router = useRouter();
  const { user, isLoading } = useAuthUser();
  const { roles, isLoading: rolesLoading } = useUserRoles();

  const isAdmin = useMemo(
    () => (user?.email || "").toLowerCase() === ADMIN_EMAIL,
    [user?.email]
  );

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(ROUTE_LOGIN);
      return;
    }
    if (!isLoading && !rolesLoading && user && !isAdmin) {
      router.replace("/404");
    }
  }, [isLoading, rolesLoading, isAdmin, user, router, roles]);

  if (isLoading || rolesLoading) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Cargando...
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminContent />
    </Suspense>
  );
}


