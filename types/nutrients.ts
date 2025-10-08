import type { NutrientMix } from "./firestore";

export interface NutrientsContainerProps {
  userId: string;
}

export interface NutrientMixView extends NutrientMix {
  id: string;
  name: string;
  createdAt: string;
}

export interface NutrientsData {
  mixes: NutrientMixView[];
}
