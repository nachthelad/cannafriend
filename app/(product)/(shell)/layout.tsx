import type { ReactNode } from "react";
import { ProductShellLayout } from "@/features/shared/surfaces/product/product-shell-layout";

export default function ProductShellGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ProductShellLayout>{children}</ProductShellLayout>;
}
