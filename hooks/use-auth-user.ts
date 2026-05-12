"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { unwrapError } from "@/lib/errors";

let cachedUser: User | null = null;
let hasResolvedInitialAuth = false;

export function __resetAuthUserCacheForTests() {
  cachedUser = null;
  hasResolvedInitialAuth = false;
}

async function resolveUser(candidate: User | null): Promise<User | null> {
  if (!candidate) {
    return null;
  }

  try {
    // Get the token (Firebase auto-refreshes when near expiry)
    await candidate.getIdToken();
    return candidate;
  } catch (tokenError: unknown) {
    const code = (tokenError as any)?.code;
    console.warn("Token validation failed:", code, unwrapError(tokenError));

    if (
      code === "auth/user-token-expired" ||
      code === "auth/token-expired" ||
      code === "auth/user-disabled" ||
      code === "auth/network-request-failed"
    ) {
      console.log("Clearing user state due to auth error");

      // Only sign out for token expiry, not network errors
      if (code !== "auth/network-request-failed") {
        try {
          await auth.signOut();
        } catch (signOutError: unknown) {
          console.warn("Error signing out:", unwrapError(signOutError));
        }
      }

      return null;
    }

    // For other errors, keep the user authenticated but log the issue
    console.warn("Token error but keeping user authenticated:", code);
    return candidate;
  }
}

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(() => cachedUser);
  const [isLoading, setIsLoading] = useState(() => !hasResolvedInitialAuth);

  useEffect(() => {
    let isActive = true;
    let initialStateResolvedForHook = false;

    const finishInitialLoad = () => {
      hasResolvedInitialAuth = true;
      if (!initialStateResolvedForHook) {
        initialStateResolvedForHook = true;
      }
      if (isActive) {
        setIsLoading(false);
      }
    };

    const commitUser = (nextUser: User | null) => {
      cachedUser = nextUser;
      if (isActive) {
        setUser(nextUser);
      }
    };

    const applyResolvedUser = async (candidate: User | null) => {
      try {
        const nextUser = await resolveUser(candidate);
        commitUser(nextUser);
      } catch (err: unknown) {
        console.error("Auth state change error:", unwrapError(err));
        commitUser(null);
      } finally {
        finishInitialLoad();
      }
    };

    const unsub = onAuthStateChanged(auth, async (u) => {
      await applyResolvedUser(u);
    });

    auth
      .authStateReady()
      .then(async () => {
        if (initialStateResolvedForHook || !isActive) {
          return;
        }

        await applyResolvedUser(auth.currentUser);
      })
      .catch((err: unknown) => {
        console.error("Auth readiness error:", unwrapError(err));
        commitUser(null);
        finishInitialLoad();
      });

    return () => {
      isActive = false;
      unsub();
    };
  }, []);

  return { user, isLoading } as const;
}
