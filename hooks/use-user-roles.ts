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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRoles(null);
        setIsLoading(false);
        return;
      }
      try {
        const snap = await getDoc(userDoc(user.uid));
        const data = snap.exists() ? snap.data() : {};
        const userRoles: UserRoles = {
          grower: Boolean((data as any)?.roles?.grower ?? true),
          consumer: Boolean((data as any)?.roles?.consumer ?? false),
        };
        setRoles(userRoles);
      } catch {
        setRoles({ grower: true, consumer: false });
      } finally {
        setIsLoading(false);
      }
    });
    return () => unsub();
  }, []);

  return { roles, isLoading };
}
