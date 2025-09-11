"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onSnapshot } from "firebase/firestore";
import { userDoc } from "@/lib/paths";
import { onAuthStateChanged } from "firebase/auth";
import type { Roles, UserProfile } from "@/types";

export function useUserRoles(): {
  roles: Roles | null;
  isLoading: boolean;
} {
  const [roles, setRoles] = useState<Roles | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Hydration-safe: set cached roles after mount
    try {
      const raw = sessionStorage.getItem("cf_user_roles");
      if (raw) {
        const cached = JSON.parse(raw) as Roles;
        setRoles(cached);
        setIsLoading(false);
      }
    } catch {}

    let unsubUserDoc: undefined | (() => void);

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRoles(null);
        if (unsubUserDoc) {
          try {
            unsubUserDoc();
          } catch {}
          unsubUserDoc = undefined;
        }
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("cf_user_roles");
        }
        setIsLoading(false);
        return;
      }
      // Real-time subscribe to roles to reflect updates instantly
      try {
        unsubUserDoc = onSnapshot(
          userDoc<UserProfile>(user.uid),
          (snap) => {
            const data = snap.data();
            const userRoles: Roles = {
              grower: Boolean(data?.roles?.grower ?? false),
              consumer: Boolean(data?.roles?.consumer ?? false),
            };
            setRoles(userRoles);
            if (typeof window !== "undefined") {
              try {
                sessionStorage.setItem(
                  "cf_user_roles",
                  JSON.stringify(userRoles)
                );
              } catch {}
            }
            setIsLoading(false);
          },
          (error) => {
            console.warn("useUserRoles onSnapshot error", error);
            setRoles((prev) => prev ?? null);
            setIsLoading(false);
          }
        );
      } catch {
        setRoles((prev) => prev ?? null);
        setIsLoading(false);
      }
    });
    return () => {
      try {
        unsub();
      } catch {}
      if (unsubUserDoc) {
        try {
          unsubUserDoc();
        } catch {}
      }
    };
  }, []);

  return { roles, isLoading };
}
