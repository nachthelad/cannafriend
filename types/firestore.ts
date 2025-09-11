export interface Roles {
  grower: boolean;
  consumer: boolean;
}

export interface UserProfile {
  timezone?: string;
  roles: Roles;
  createdAt?: string;
}

export interface NutrientMix {
  name?: string;
  npk?: string;
  notes?: string;
}
