"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";

import { auth } from "@/lib/firebase";
import { userDoc } from "@/lib/paths";
import type { Roles, UserProfile } from "@/types";

const ROLES_STORAGE_KEY = "cf_user_roles";

let cachedRoles: Roles | null = null;
let cachedRolesLoaded = false;

function readRolesFromStorage(): Roles | null {
  if (cachedRoles) {
    cachedRolesLoaded = true;
    return cachedRoles;
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedValue = window.sessionStorage?.getItem(ROLES_STORAGE_KEY);
    if (!storedValue) {
      return null;
    }

    const parsed = JSON.parse(storedValue) as Partial<Roles> | null;
    if (!parsed) {
      return null;
    }

    const normalized: Roles = {
      grower: Boolean(parsed.grower),
      consumer: Boolean(parsed.consumer),
    };

    cachedRoles = normalized;
    cachedRolesLoaded = true;
    return normalized;
  } catch {
    return null;
  }
}

export function useUserRoles(): {
  roles: Roles | null;
  isLoading: boolean;
} {
  const initialRoles = readRolesFromStorage();
  const hadInitialRoles = Boolean(initialRoles);

  const [roles, setRoles] = useState<Roles | null>(initialRoles);
  const [isLoading, setIsLoading] = useState<boolean>(() => !hadInitialRoles);

  useEffect(() => {
    let unsubUserDoc: undefined | (() => void);

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        cachedRoles = null;
        cachedRolesLoaded = true;
        setRoles(null);
        if (unsubUserDoc) {
          try {
            unsubUserDoc();
          } catch {}
          unsubUserDoc = undefined;
        }
        try {
          if (typeof window !== "undefined") {
            window.sessionStorage?.removeItem(ROLES_STORAGE_KEY);
          }
        } catch {}
        setIsLoading(false);
        return;
      }

      if (!hadInitialRoles) {
        setIsLoading(true);
      }

      try {
        unsubUserDoc = onSnapshot(
          userDoc<UserProfile>(user.uid),
          (snap) => {
            const data = snap.data();
            const userRoles: Roles = {
              grower: Boolean(data?.roles?.grower ?? false),
              consumer: Boolean(data?.roles?.consumer ?? false),
            };
            cachedRoles = userRoles;
            cachedRolesLoaded = true;
            setRoles(userRoles);
            try {
              if (typeof window !== "undefined") {
                window.sessionStorage?.setItem(
                  ROLES_STORAGE_KEY,
                  JSON.stringify(userRoles)
                );
              }
            } catch {}
            setIsLoading(false);
          },
          (error) => {
            console.warn("useUserRoles onSnapshot error", error);
            setRoles((prev) => prev ?? null);
            cachedRolesLoaded = true;
            setIsLoading(false);
          }
        );
      } catch {
        setRoles((prev) => prev ?? null);
        cachedRolesLoaded = true;
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
  }, [hadInitialRoles]);

  return { roles, isLoading };
}

