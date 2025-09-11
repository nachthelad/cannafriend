import { NextRequest, NextResponse } from "next/server";
import { isUserPremium } from "@/lib/auth";
import { unwrapError } from "@/lib/errors";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Import Firebase Admin at runtime
    const { adminAuth } = await import("@/lib/firebase-admin");

    // Verify authentication
    const authHeader =
      req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return NextResponse.json({ error: "missing_auth" }, { status: 401 });
    }

    const idToken = authHeader.split(" ")[1];
    const decoded = await adminAuth().verifyIdToken(idToken);
    const user = await adminAuth().getUser(decoded.uid);

    if (!user.email) {
      return NextResponse.json({ error: "missing_email" }, { status: 400 });
    }

    // Check if user is already premium
    const isPremium = isUserPremium(user);
    if (isPremium) {
      return NextResponse.json(
        { error: "already_premium", message: "User already has an active premium subscription" },
        { status: 409 } // Conflict
      );
    }

    // Use existing Stripe Payment Link
    const stripePaymentLink = "https://buy.stripe.com/cNibJ37LpfHIfnx3aJcZa00";

    return NextResponse.json({
      success: true,
      checkout_url: stripePaymentLink,
      session_id: null, // Not applicable for payment links
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: "checkout_creation_failed", message: unwrapError(err) },
      { status: 500 }
    );
  }
}
