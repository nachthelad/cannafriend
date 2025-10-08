import type { ComponentType } from "react";
import type { BeforeInstallPromptEvent } from "./pwa";

export interface Feature {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

export interface FeaturesSectionProps {
  className?: string;
}

export interface MobileLoginSectionProps {
  className?: string;
}

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

export interface MobileHeaderProps {
  className?: string;
  isLoggedIn?: boolean;
  onPrimaryClick?: () => void;
}

