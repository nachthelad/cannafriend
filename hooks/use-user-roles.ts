"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { getDoc } from "firebase/firestore";
import { userDoc } from "@/lib/paths";
import { onAuthStateChanged } from "firebase/auth";

export type UserRoles = {
  grower: boolean;
  consumer: boolean;
};

export function useUserRoles(): {
  roles: UserRoles | null;
  isLoading: boolean;
} {
  const [roles, setRoles] = useState<UserRoles | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Hydration-safe: set cached roles after mount
    try {
      const raw = sessionStorage.getItem("cf_user_roles");
      if (raw) {
        const cached = JSON.parse(raw) as UserRoles;
        setRoles(cached);
        setIsLoading(false);
      }
    } catch {}

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRoles(null);
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("cf_user_roles");
        }
        setIsLoading(false);
        return;
      }
      try {
        const snap = await getDoc(userDoc(user.uid));
        const data = snap.exists() ? snap.data() : {};
        const userRoles: UserRoles = {
          grower: Boolean((data as any)?.roles?.grower ?? false),
          consumer: Boolean((data as any)?.roles?.consumer ?? false),
        };
        setRoles(userRoles);
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem("cf_user_roles", JSON.stringify(userRoles));
          } catch {}
        }
      } catch {
        // Keep previous cached value to avoid flicker; if none, set to null
        setRoles((prev) => prev ?? null);
      } finally {
        setIsLoading(false);
      }
    });
    return () => unsub();
  }, []);

  return { roles, isLoading };
}
