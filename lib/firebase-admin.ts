import "server-only";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

let initialized = false;

export function hasFirebaseAdminCredentials() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  return Boolean(
    projectId &&
      clientEmail &&
      privateKey &&
      !projectId.startsWith("your-") &&
      !clientEmail.startsWith("your-") &&
      privateKey.includes("BEGIN PRIVATE KEY") &&
      !privateKey.includes("..."),
  );
}

export function ensureAdminApp() {
  if (!initialized && !getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID as string | undefined;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL as string | undefined;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY as string | undefined;

    if (!hasFirebaseAdminCredentials()) {
      throw new Error(
        "Missing Firebase Admin credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY."
      );
    }

    // Support escaped newlines in env var
    privateKey = privateKey!.replace(/\\n/g, "\n");

    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    initialized = true;
  }
}

export function adminAuth() {
  ensureAdminApp();
  return getAuth();
}

export function adminDb() {
  ensureAdminApp();
  return getFirestore();
}

export function adminStorage() {
  ensureAdminApp();
  return getStorage();
}
