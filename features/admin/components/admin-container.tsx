"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { AdminUsersTable } from "@/features/admin/components/users-table";
import { AdminMpSearch } from "@/features/admin/components/mp-search";
import { AdminStripeSearch } from "@/features/admin/components/stripe-search";
import type {
  AdminUser,
  SortDirection,
  MpSearchFilters,
  MpSearchItem,
  StripeSearchFilters,
  StripeSearchItem,
} from "@/types/admin";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { authorizedFetch, copyToClipboard } from "@/lib/admin/utils";
import { ADMIN_EMAIL } from "@/lib/constants";
import { getSuspenseResource } from "@/lib/suspense-utils";
import { DataErrorBoundary } from "@/components/common/data-error-boundary";
import { toast } from "sonner";

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
    } catch (error) {
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
      } catch (error) {
        setUsers(previous);
        handleError(error);
      }
    },
    [handleError, users]
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
    } catch (error) {
      handleError(error);
    } finally {
      setMpLoading(false);
    }
  }, [handleError, mpFilters]);

  const handleMpReprocess = useCallback(
    async (item: MpSearchItem) => {
      setMpLoading(true);
      try {
        const response = await authorizedFetch(
          "/api/mercadopago/admin/reprocess",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: item.type, id: item.id }),
          }
        );
        const data = await response.json();
        if (!response.ok || data?.error) {
          throw new Error(data?.error || "reprocess_failed");
        }
        await refreshUsers();
      } catch (error) {
        handleError(error);
      } finally {
        setMpLoading(false);
      }
    },
    [handleError, refreshUsers]
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
    } catch (error) {
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
        await refreshUsers();
      } catch (error) {
        handleError(error);
      } finally {
        setStripeLoading(false);
      }
    },
    [handleError, refreshUsers]
  );

  const handleCopy = useCallback(async (value: string, label = "Valor") => {
    const copied = await copyToClipboard(value);
    if (copied) {
      toast.success(`${label} copiado`);
      return;
    }

    toast.error(`No se pudo copiar ${label.toLowerCase()}`);
  }, []);

  return (
    <div className="w-full space-y-8">
      <div className="md:hidden space-y-6">
        <section id="users">
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
        </section>
        <section id="mercadopago">
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
        </section>
        <section id="stripe">
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
        </section>
      </div>

      <div className="hidden md:flex flex-col gap-8">
        <section id="users">
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
        </section>
        <div className="grid grid-cols-1 gap-8 2xl:grid-cols-2">
          <section id="mercadopago">
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
          </section>
          <section id="stripe">
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
          </section>
        </div>
      </div>
    </div>
  );
}

export function AdminContainer() {
  return (
    <DataErrorBoundary>
      <Suspense fallback={<AdminSkeleton />}>
        <AdminContent />
      </Suspense>
    </DataErrorBoundary>
  );
}
