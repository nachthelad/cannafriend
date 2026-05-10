"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ADMIN_EMAIL } from "@/lib/constants";
import { ROUTE_LOGIN } from "@/lib/routes";
import { AdminShell } from "@/features/shared/surfaces/admin/admin-shell";
import { SurfaceLoading } from "@/features/shared/surfaces/shared/surface-loading";

type AdminSurfaceLayoutProps = {
  children: ReactNode;
};

export function AdminSurfaceLayout({ children }: AdminSurfaceLayoutProps) {
  const router = useRouter();
  const { user, isLoading } = useAuthUser();
  const isAdmin = useMemo(
    () => (user?.email || "").toLowerCase() === ADMIN_EMAIL,
    [user?.email]
  );

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(ROUTE_LOGIN);
      return;
    }

    if (!isLoading && user && !isAdmin) {
      router.replace("/404");
    }
  }, [isAdmin, isLoading, router, user]);

  if (isLoading) {
    return (
      <AdminShell>
        <SurfaceLoading />
      </AdminShell>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return <AdminShell>{children}</AdminShell>;
}
