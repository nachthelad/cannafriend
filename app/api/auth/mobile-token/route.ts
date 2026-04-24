import { NextRequest, NextResponse } from "next/server";
import { adminAuth, ensureAdminApp } from "@/lib/firebase-admin";

export const runtime = "nodejs";

/**
 * POST /api/auth/mobile-token
 * Exchanges a Firebase ID token (from the web Google sign-in) for a Firebase
 * Custom Token that the native Expo app can use with signInWithCustomToken().
 *
 * Flow:
 *   1. Mobile app opens cannafriend.app/auth/mobile in a browser
 *   2. User signs in with Google on the web
 *   3. Web page calls this endpoint with the Firebase ID token
 *   4. We verify the token, create a short-lived custom token for the same UID
 *   5. Web page redirects to cannafriend://auth?ct=CUSTOM_TOKEN
 *   6. Expo app captures the deep link and calls signInWithCustomToken()
 */
export async function POST(req: NextRequest) {
  try {
    ensureAdminApp();

    const { idToken } = await req.json();
    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    // Verify the ID token to get the UID
    const decoded = await adminAuth().verifyIdToken(idToken);

    // Create a custom token for the same user
    const customToken = await adminAuth().createCustomToken(decoded.uid);

    return NextResponse.json({ customToken });
  } catch (err: any) {
    console.error("[mobile-token]", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
