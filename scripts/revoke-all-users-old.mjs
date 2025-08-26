// scripts/revoke-all-users.mjs
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } =
  process.env;

if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  throw new Error("Missing Firebase Admin env vars");
}

initializeApp({
  credential: cert({
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const auth = getAuth();

async function revokeAll() {
  let nextPageToken = undefined;
  let count = 0;
  do {
    const { users, pageToken } = await auth.listUsers(1000, nextPageToken);
    for (const u of users) {
      await auth.revokeRefreshTokens(u.uid);
      count++;
    }
    nextPageToken = pageToken;
  } while (nextPageToken);
  console.log(`Revoked refresh tokens for ${count} users.`);
}

revokeAll().catch((e) => {
  console.error(e);
  process.exit(1);
});
