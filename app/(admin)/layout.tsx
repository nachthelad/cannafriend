import type { ReactNode } from "react";
import { AdminSurfaceLayout } from "@/features/shared/surfaces/admin/admin-surface-layout";

export default function AdminGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AdminSurfaceLayout>{children}</AdminSurfaceLayout>;
}
