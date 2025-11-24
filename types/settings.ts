import type { Roles } from "./firestore";

export interface AccountSummaryProps {
  title: string;
  email?: string | null;
  providerId?: string | null;
  signOutLabel: string;
  onSignOut: () => void;
}

export interface PreferencesFormProps {
  title: string;
  languageLabel: string;
  timezoneLabel: string;
  timezonePlaceholder: string;
  timezoneValue: string;
  onTimezoneChange: (value: string) => void;
  darkModeLabel: string;
  darkModeChecked: boolean;
  onDarkModeChange: (checked: boolean) => void;
  rolesLabel: string;
  rolesValue: Roles;
  onRolesChange: (roles: Roles) => void;
  growerLabel: string;
  consumerLabel: string;
}

export interface DangerZoneProps {
  title: string;
  description: string;
  triggerLabel: string;
  dialogTitle: string;
  dialogDescription: string;
  confirmLabel: string;
  cancelLabel: string;
  deletingLabel: string;
  isDeleting: boolean;
  onConfirm: () => void;
}

export interface SettingsFooterProps {
  privacyLabel: string;
  termsLabel: string;
}

export interface AppInformationLine {
  label: string;
  value: string;
}

export interface AppInformationProps {
  title: string;
  versionLabel: string;
  version?: string | null;
  infoLines?: AppInformationLine[];
}

export interface SubscriptionDetails {
  premium: boolean;
  premium_until: number | null;
  remaining_ms: number | null;
  recurring: boolean | null;
  preapproval_status: string | null;
  last_payment?: {
    id: string;
    status?: string;
    date_approved?: string;
  } | null;
}

export interface SubscriptionLine {
  label: string;
  value: string;
}

export interface SubscriptionManagementProps {
  title: string;
  statusLabel: string;
  activeLabel: string;
  inactiveLabel: string;
  upgradeLabel: string;
  upgradeDescription?: string;
  onUpgrade?: () => void;
  upgradeHref?: string;
  onCancel: () => void;
  cancelLabel: string;
  dialogCancelLabel: string;
  cancelConfirmTitle: string;
  cancelConfirmDescription: string;
  cancelConfirmActionLabel: string;
  cancelingLabel: string;
  isPremium: boolean;
  isCancelling: boolean;
  subscriptionLines?: SubscriptionLine[];
  note?: string;
}

export type SettingsSectionId =
  | "profile"
  | "preferences"
  | "billing"
  | "notifications"
  | "app-info"
  | "danger";

export interface SettingsSection {
  id: SettingsSectionId;
  label: string;
  isDestructive?: boolean;
}

export interface SettingsNavigationProps {
  sections: SettingsSection[];
  activeSection: SettingsSectionId;
  onSectionChange: (sectionId: SettingsSectionId) => void;
  navigationTitle: string;
}

export interface SettingsPreferencesState {
  timezone: string;
  darkMode: boolean;
  roles: Roles;
}

export interface SettingsData {
  preferences: SettingsPreferencesState;
  subscription: SubscriptionDetails | null;
}

export interface SettingsContentProps {
  userId: string;
  email?: string | null;
  providerId?: string | null;
  showHeader?: boolean;
}

export type SettingsContainerProps = SettingsContentProps;

export interface PushNotificationsProps {
  userId: string;
}
