import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/auth";
import { adminAuth, hasFirebaseAdminCredentials } from "@/lib/firebase-admin";

type FirebaseAuthError = {
  code?: string;
};

export async function POST() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "missing_oauth_session" }, { status: 401 });
  }

  if (!hasFirebaseAdminCredentials()) {
    return NextResponse.json(
      {
        error: "missing_firebase_admin_credentials",
        message:
          "Google OAuth succeeded, but Firebase Admin credentials are required to create the Firebase custom token.",
      },
      { status: 503 },
    );
  }

  const auth = adminAuth();
  let uid: string;

  try {
    const existingUser = await auth.getUserByEmail(email);
    uid = existingUser.uid;
  } catch (error) {
    const code = (error as FirebaseAuthError)?.code;

    if (code !== "auth/user-not-found") {
      return NextResponse.json({ error: "firebase_user_lookup_failed" }, { status: 500 });
    }

    const createdUser = await auth.createUser({
      email,
      displayName: session.user?.name ?? undefined,
      photoURL: session.user?.image ?? undefined,
      emailVerified: true,
    });
    uid = createdUser.uid;
  }

  const customToken = await auth.createCustomToken(uid);
  return NextResponse.json({ customToken });
}
