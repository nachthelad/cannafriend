import type { ReactNode } from "react";
import { ProductShell } from "@/features/shared/surfaces/product/product-shell";

type ProductShellLayoutProps = {
  children: ReactNode;
};

export function ProductShellLayout({ children }: ProductShellLayoutProps) {
  return <ProductShell>{children}</ProductShell>;
}
