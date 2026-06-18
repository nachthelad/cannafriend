import type { BeforeInstallPromptEvent } from "./pwa";

export interface DesktopLandingViewProps {
  authActionLabel: string;
  isAuthActionLoading: boolean;
  onAuthAction: () => void;
  deferredPrompt: BeforeInstallPromptEvent | null;
  onInstallPWA: () => void;
}

export interface CTASectionProps {
  authActionLabel: string;
  isAuthActionLoading: boolean;
  onAuthAction: () => void;
  deferredPrompt: BeforeInstallPromptEvent | null;
  onInstallPWA: () => void;
}

export interface HeroSectionProps {
  authActionLabel: string;
  isAuthActionLoading: boolean;
  onAuthAction: () => void;
  deferredPrompt: BeforeInstallPromptEvent | null;
  onInstallPWA: () => void;
}


