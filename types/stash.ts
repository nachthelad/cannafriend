export type StashCategory = "flower" | "concentrate" | "edible";

export interface StashContainerProps {
  userId: string;
}

export interface StashItem {
  id: string;
  name: string;
  type: StashCategory;
  amount?: string;
  unit?: string;
  thc?: string;
  cbd?: string;
  addedAt?: string;
  vendor?: string;
  price?: string;
  notes?: string;
}

export interface StashData {
  items: StashItem[];
}

export interface StashFormValues {
  name: string;
  type: StashCategory;
  amount: string;
  unit: string;
  thc?: string;
  cbd?: string;
  vendor?: string;
  price?: string;
  notes?: string;
}
