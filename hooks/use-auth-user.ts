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
            // Try to get a fresh token to validate the user
            await u.getIdToken(true);
            cachedUser = u;
            setUser(u);
          } catch (tokenError: unknown) {
            const code = (tokenError as any)?.code;
            console.warn("Token validation failed:", code, unwrapError(tokenError));

            // Handle specific error cases
            if (
              code === "auth/user-token-expired" ||
              code === "auth/token-expired" ||
              code === "auth/user-disabled" ||
              code === "auth/network-request-failed"
            ) {
              console.log("Clearing user state due to auth error");
              cachedUser = null;
              setUser(null);

              // Only sign out for token expiry, not network errors
              if (code !== "auth/network-request-failed") {
                try {
                  await auth.signOut();
                } catch (signOutError: unknown) {
                  console.warn("Error signing out:", unwrapError(signOutError));
                }
              }
            } else {
              // For other errors, still set the user but log the issue
              console.warn("Token error but keeping user authenticated:", code);
              cachedUser = u;
              setUser(u);
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
