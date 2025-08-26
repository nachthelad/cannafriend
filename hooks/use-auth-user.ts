"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";

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
          } catch (tokenError: any) {
            // Token invalid, clear user state
            console.warn('Token invalid, clearing user state:', tokenError.code);
            setUser(null);
            
            // Clear auth state if token was revoked
            if (tokenError.code === 'auth/user-token-expired' || 
                tokenError.code === 'auth/token-expired') {
              try {
                await auth.signOut();
              } catch (signOutError) {
                console.warn('Error signing out:', signOutError);
              }
            }
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });
    
    return () => unsub();
  }, []);

  return { user, isLoading } as const;
}
