import type { BeforeInstallPromptEvent } from "./pwa";

export interface DesktopLandingViewProps {
  isLoggedIn: boolean;
  loginOpen: boolean;
  onLoginOpenChange: (open: boolean) => void;
  onLoginClick: () => void;
  onAuthStart?: () => void;
  deferredPrompt: BeforeInstallPromptEvent | null;
  onInstallPWA: () => void;
}

export interface CTASectionProps {
  onLoginClick: () => void;
  deferredPrompt: BeforeInstallPromptEvent | null;
  onInstallPWA: () => void;
  isLoggedIn: boolean;
}

export interface HeroSectionProps {
  onLoginClick: () => void;
  deferredPrompt: BeforeInstallPromptEvent | null;
  onInstallPWA: () => void;
  isLoggedIn: boolean;
}


