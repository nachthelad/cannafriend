import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string(),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string(),
});

// Important: Read each var explicitly so Next.js can inline values in the client bundle.
const raw = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const parsed = envSchema.safeParse(raw);
if (!parsed.success) {
  if (process.env.NODE_ENV === "production") {
    // Throw a concise error to surface missing keys early in production builds.
    throw parsed.error;
  }

  console.warn(
    "Missing Firebase environment variables. Using local development placeholders; Firebase-backed features will not work until .env.local is configured.",
  );
}

export const env = parsed.success
  ? parsed.data
  : {
      NEXT_PUBLIC_FIREBASE_API_KEY: "local-dev-api-key",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "local-dev.firebaseapp.com",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "local-dev",
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "local-dev.appspot.com",
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "000000000000",
      NEXT_PUBLIC_FIREBASE_APP_ID: "1:000000000000:web:localdev",
      NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: "G-LOCALDEV",
    };

export const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const isFirebaseClientConfigured =
  !env.NEXT_PUBLIC_FIREBASE_API_KEY.startsWith("your-") &&
  !env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN.startsWith("your-") &&
  !env.NEXT_PUBLIC_FIREBASE_PROJECT_ID.startsWith("your-") &&
  env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== "local-dev" &&
  env.NEXT_PUBLIC_FIREBASE_API_KEY !== "local-dev-api-key";
