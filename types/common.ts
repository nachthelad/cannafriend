import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";
import type { Plant, Reminder } from "./entities";
import type { Roles } from "./firestore";

export interface BrandedLoadingProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "minimal" | "with-text";
  text?: string;
  className?: string;
}

export interface ButtonLoadingProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  isLoading: boolean;
  loadingText?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "ghost";
}

export interface PageLoadingProps {
  title?: string;
  description?: string;
  className?: string;
}

export interface CardLoadingProps {
  lines?: number;
  showHeader?: boolean;
  className?: string;
}

export interface EditReminderDialogProps {
  reminder: Reminder | null;
  plants: Plant[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onReminderUpdated: () => void;
}

export interface EditReminderFormData {
  selectedPlant: string;
  reminderType: Reminder["type"];
  title: string;
  description?: string;
  interval: string;
}

export interface ImageUploadProps {
  onImagesChange: (urls: string[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  className?: string;
  buttonSize?: "sm" | "default";
  enableDropzone?: boolean;
  hideDefaultTrigger?: boolean;
  userId?: string;
}

export interface ImageUploadHandle {
  open: () => void;
}

export interface AmountWithUnitProps {
  inputId: string;
  placeholder?: string;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  defaultUnit?: string;
  unitOptions: { value: string; label?: string }[];
  onUnitChange: (unit: string) => void;
}

export interface InlineEditProps {
  value: string;
  onSave: (newValue: string) => Promise<void> | void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  showEditHint?: boolean;
  forceEdit?: boolean;
  onCancel?: () => void;
  onStartEdit?: () => void;
  clickToEdit?: boolean;
}

export type LogoVariant = "mark" | "badgeLight" | "badgeDark";

export interface LogoProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number | string;
  variant?: LogoVariant;
}

export interface ResponsivePageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  backHref?: string;
  onBackClick?: () => void;
  className?: string;
  mobileControls?: ReactNode;
  mobileActions?: ReactNode;
  desktopActions?: ReactNode;
  sticky?: boolean;
  showMobileBackButton?: boolean;
  showDesktopBackButton?: boolean;
  desktopBackLabel?: ReactNode;
}

export interface RoleSelectorProps {
  value: Roles;
  onChange: (roles: Roles) => void;
  growerLabel: string;
  consumerLabel: string;
  className?: string;
  optionClassName?: string;
}

export interface SearchProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
  className?: string;
}

export interface TimezoneSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  triggerClassName?: string;
}
