import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

import { firebaseConfig } from "@/lib/env";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
// Ensure auth persists across sessions on the web
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch((e) => {
    console.warn("Failed to set auth persistence", e);
  });
}
// Firestore with persistent local cache for offline support
let _db: ReturnType<typeof getFirestore>;
if (typeof window !== "undefined") {
  try {
    _db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch (e) {
    // Fallback to default if initializeFirestore fails (e.g., older SDK)
    _db = getFirestore(app);
  }
} else {
  _db = getFirestore(app);
}
export const db = _db;
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Analytics only on client side
let analytics: any = null;
if (typeof window !== "undefined") {
  try {
    const { getAnalytics } = require("firebase/analytics");
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn("Analytics not available:", error);
  }
}

// Configure Google Auth provider
googleProvider.setCustomParameters({
  prompt: "select_account",
});
