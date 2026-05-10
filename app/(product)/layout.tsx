import type { ReactNode } from "react";
import { ProductAuthenticatedLayout } from "@/features/shared/surfaces/product/product-authenticated-layout";

export default function ProductGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ProductAuthenticatedLayout>{children}</ProductAuthenticatedLayout>;
}
