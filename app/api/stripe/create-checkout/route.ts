import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Initialize Stripe (runtime only)
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-08-27.basil",
    });

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
    const isPremium = Boolean((user.customClaims as any)?.premium);
    if (isPremium) {
      return NextResponse.json(
        { error: "already_premium", message: "User already has an active premium subscription" },
        { status: 409 } // Conflict
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    // Use existing Stripe Payment Link
    const stripePaymentLink = "https://buy.stripe.com/cNibJ37LpfHIfnx3aJcZa00";

    return NextResponse.json({
      success: true,
      checkout_url: stripePaymentLink,
      session_id: null, // Not applicable for payment links
    });
  } catch (error: any) {
    console.error("Stripe checkout creation error:", error);
    return NextResponse.json(
      { error: "checkout_creation_failed", message: error.message },
      { status: 500 }
    );
  }
}
