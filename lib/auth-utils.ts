// lib/auth-utils.ts
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

/**
 * Clears all Firebase auth state from browser storage
 * Useful when dealing with auth/internal-error after token revocation
 */
export function clearAuthState(): void {
  if (typeof window === 'undefined') return;

  // Clear localStorage
  const authKeys = Object.keys(localStorage).filter(key => 
    key.startsWith('firebase:authUser') || 
    key.startsWith('firebase:persistence') ||
    key.startsWith('firebase:host')
  );
  authKeys.forEach(key => localStorage.removeItem(key));
  
  // Clear sessionStorage
  const authSessionKeys = Object.keys(sessionStorage).filter(key => 
    key.startsWith('firebase:authUser') || 
    key.startsWith('firebase:persistence') ||
    key.startsWith('firebase:host')
  );
  authSessionKeys.forEach(key => sessionStorage.removeItem(key));
  
  console.log('🧹 Cleared auth state from browser storage');
}

/**
 * Force sign out and clear all auth state
 * Use this when encountering persistent auth errors
 */
export async function forceSignOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.warn('Error during sign out:', error);
  }
  
  clearAuthState();
  
  // Optional: reload page to ensure clean state
  if (typeof window !== 'undefined' && window.location.pathname !== '/') {
    window.location.href = '/';
  }
}

/**
 * Check if current auth state is potentially corrupted
 * Returns true if state should be cleared
 */
export function isAuthStateCorrupted(): boolean {
  if (typeof window === 'undefined') return false;
  
  const currentUser = auth.currentUser;
  if (!currentUser) return false;
  
  // Check for signs of corrupted state
  const hasLocalStorageAuth = Object.keys(localStorage).some(key => 
    key.startsWith('firebase:authUser')
  );
  
  // If we have a user but no localStorage auth, state might be corrupted
  return currentUser && !hasLocalStorageAuth;
}

/**
 * Safe auth state recovery
 * Call this on app initialization to handle corrupted states
 */
export async function recoverAuthState(): Promise<void> {
  if (isAuthStateCorrupted()) {
    console.warn('🔧 Detected potentially corrupted auth state, clearing...');
    await forceSignOut();
  }
}