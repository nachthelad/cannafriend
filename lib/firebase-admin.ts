import "server-only";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let initialized = false;

export function ensureAdminApp() {
  if (!initialized && !getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID as string | undefined;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL as string | undefined;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY as string | undefined;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        "Missing Firebase Admin credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY."
      );
    }

    // Support escaped newlines in env var
    privateKey = privateKey.replace(/\\n/g, "\n");

    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
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
