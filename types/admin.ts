export type SortDirection = "newest" | "oldest";

export interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  premium: boolean;
  createdAt?: number;
}

export interface AdminUsersTableProps {
  adminEmail: string;
  users: AdminUser[];
  loading: boolean;
  sortDir: SortDirection;
  onSortChange: (dir: SortDirection) => void;
  onRefresh: () => void;
  onTogglePremium: (user: AdminUser, premium: boolean) => void;
  onCopy: (value: string, label?: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  variant?: "desktop" | "mobile";
  className?: string;
}

export type MpSearchScope = "all" | "payments" | "preapproval";

export interface MpSearchFilters {
  uid: string;
  status: string;
  scope: MpSearchScope;
}

export interface MpSearchItem {
  type: "payment" | "preapproval";
  id: string;
  status?: string;
  payer_email?: string;
  external_reference?: string;
  date?: string | null;
}

export interface MpSearchProps {
  filters: MpSearchFilters;
  items: MpSearchItem[];
  loading: boolean;
  onFiltersChange: (next: Partial<MpSearchFilters>) => void;
  onSearch: () => void;
  onReprocess: (item: MpSearchItem) => void;
  variant?: "desktop" | "mobile";
  className?: string;
}

export type StripeSearchScope = "all" | "payments" | "subscriptions";

export interface StripeSearchFilters {
  email: string;
  scope: StripeSearchScope;
}

export interface StripeSearchItem {
  type: "payment" | "subscription";
  id: string;
  status?: string;
  customer_email?: string;
  customer_id?: string;
  amount?: number;
  currency?: string;
  date?: string;
}

export interface StripeSearchProps {
  filters: StripeSearchFilters;
  items: StripeSearchItem[];
  loading: boolean;
  onFiltersChange: (next: Partial<StripeSearchFilters>) => void;
  onSearch: () => void;
  onReprocess: (item: StripeSearchItem) => void;
  variant?: "desktop" | "mobile";
  className?: string;
}

export type UnifiedSearchScope = MpSearchScope;

export interface UnifiedSearchFilters {
  uid: string;
  status: string;
  scope: UnifiedSearchScope;
}

export interface UnifiedSearchItem {
  type: "payment" | "preapproval";
  id: string;
  status?: string;
  payer_email?: string;
  external_reference?: string;
  date?: string | null;
}

export interface UnifiedSearchProps {
  filters: UnifiedSearchFilters;
  items: UnifiedSearchItem[];
  loading: boolean;
  onFiltersChange: (next: Partial<UnifiedSearchFilters>) => void;
  onSearch: () => void;
  onReprocess: (item: UnifiedSearchItem) => void;
  variant?: "desktop" | "mobile";
  className?: string;
}
