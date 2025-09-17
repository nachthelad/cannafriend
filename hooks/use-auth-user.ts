"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { unwrapError } from "@/lib/errors";

let cachedUser: User | null = null;

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(() => cachedUser);
  const [isLoading, setIsLoading] = useState(() => cachedUser == null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        if (u) {
          try {
            await u.getIdToken(true);
            cachedUser = u;
            setUser(u);
          } catch (tokenError: unknown) {
            const code = (tokenError as any)?.code;
            console.warn("Token invalid, clearing user state:", code);
            unwrapError(tokenError);
            cachedUser = null;
            setUser(null);

            if (
              code === "auth/user-token-expired" ||
              code === "auth/token-expired"
            ) {
              try {
                await auth.signOut();
              } catch (signOutError: unknown) {
                console.warn("Error signing out:", unwrapError(signOutError));
              }
            }
          }
        } else {
          cachedUser = null;
          setUser(null);
        }
      } catch (err: unknown) {
        console.error("Auth state change error:", unwrapError(err));
        cachedUser = null;
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsub();
  }, []);

  return { user, isLoading } as const;
}
