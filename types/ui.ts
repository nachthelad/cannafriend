import type { Locale } from "date-fns";
import type { ComponentPropsWithoutRef, ReactElement } from "react";
import type * as ToastPrimitives from "@radix-ui/react-toast";

export interface MobileDatePickerProps {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  locale?: Locale;
}

export type ToastVariant = "default" | "destructive";

export type ToastProps = ComponentPropsWithoutRef<
  typeof ToastPrimitives.Root
> & {
  variant?: ToastVariant;
};

export type ToastActionElement = ReactElement;
