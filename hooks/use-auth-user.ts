"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { unwrapError } from "@/lib/errors";

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        // If we have a user but token is invalid, clear the state
        if (u) {
          try {
            await u.getIdToken(true); // Force refresh token
            setUser(u);
          } catch (tokenError: unknown) {
            // Token invalid, clear user state
            const code = (tokenError as any)?.code;
            console.warn('Token invalid, clearing user state:', code);
            unwrapError(tokenError);
            setUser(null);

            // Clear auth state if token was revoked
            if (
              code === 'auth/user-token-expired' ||
              code === 'auth/token-expired'
            ) {
              try {
                await auth.signOut();
              } catch (signOutError: unknown) {
                console.warn('Error signing out:', unwrapError(signOutError));
              }
            }
          }
        } else {
          setUser(null);
        }
      } catch (err: unknown) {
        console.error('Auth state change error:', unwrapError(err));
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });
    
    return () => unsub();
  }, []);

  return { user, isLoading } as const;
}
