import type { Locale } from "date-fns";
import type { ComponentPropsWithoutRef, ReactElement } from "react";
import type * as ToastPrimitives from "@radix-ui/react-toast";

export interface MobileDatePickerProps {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  locale?: Locale;
}

export type ToastProps = ComponentPropsWithoutRef<
  typeof ToastPrimitives.Root
> & {
  variant?: "default" | "destructive";
};

export type ToastActionElement = ReactElement;
