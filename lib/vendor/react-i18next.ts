import type { i18n as I18nInstance, TFunction as I18nextTFunction } from "i18next";
// @ts-ignore The published package is missing declarations for this bundled entrypoint.
import { initReactI18next as initReactI18nextRuntime, useTranslation as useTranslationRuntime } from "../../node_modules/react-i18next/react-i18next.js";

export interface UseTranslationResponse {
  i18n: I18nInstance;
  ready: boolean;
  t: I18nextTFunction;
}

export const useTranslation = useTranslationRuntime as (
  ns?: string | readonly string[],
) => UseTranslationResponse;

export const initReactI18next = initReactI18nextRuntime as {
  init(instance: I18nInstance): void;
  type: "3rdParty";
};
