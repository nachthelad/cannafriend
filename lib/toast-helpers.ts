import type { TFunction } from "i18next";

import type { useToast } from "@/hooks/use-toast";

type UseToastReturn = ReturnType<typeof useToast>;
type ToastFn = UseToastReturn["toast"];
type ToastPayload = Parameters<ToastFn>[0];

interface ToastCopyOptions {
  namespace?: string;
  titleKey?: string;
  titleParams?: Record<string, unknown>;
  title?: string;
  descriptionKey?: string;
  descriptionParams?: Record<string, unknown>;
  description?: string;
  toastOptions?: Omit<ToastPayload, "title" | "description">;
}

function resolveText(
  t: TFunction,
  key: string | undefined,
  ns: string,
  params?: Record<string, unknown>
) {
  if (!key) {
    return undefined;
  }
  return t(key, { ns, ...(params ?? {}) });
}

function resolveCopy(
  t: TFunction,
  defaultTitleKey: string,
  {
    namespace = "common",
    titleKey,
    titleParams,
    title,
    descriptionKey,
    descriptionParams,
    description,
    toastOptions,
  }: ToastCopyOptions
) {
  const resolvedTitle =
    title ??
    resolveText(t, titleKey ?? defaultTitleKey, titleKey ? namespace : "common", titleParams);
  const resolvedDescription =
    description ??
    resolveText(t, descriptionKey, namespace, descriptionParams);

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    toastOptions,
  };
}

export function toastSuccess(
  toast: ToastFn,
  t: TFunction,
  options: ToastCopyOptions = {}
) {
  const { title, description, toastOptions } = resolveCopy(t, "success", options);
  toast({
    title,
    description,
    ...(toastOptions ?? {}),
  });
}

export function toastInfo(
  toast: ToastFn,
  t: TFunction,
  options: ToastCopyOptions = {}
) {
  const { title, description, toastOptions } = resolveCopy(t, "info", options);
  toast({
    title,
    description,
    ...(toastOptions ?? {}),
  });
}
