"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ROUTE_LOGIN } from "@/lib/routes";
import { SurfaceLoading } from "@/features/shared/surfaces/shared/surface-loading";

type ProductAuthenticatedLayoutProps = {
  children: ReactNode;
};

export function ProductAuthenticatedLayout({
  children,
}: ProductAuthenticatedLayoutProps) {
  const router = useRouter();
  const { t } = useTranslation(["common"]);
  const { user, isLoading } = useAuthUser();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(ROUTE_LOGIN);
    }
  }, [isLoading, router, user]);

  if (isLoading) {
    return <SurfaceLoading message={t("loading", { ns: "common" })} />;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
