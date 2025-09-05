import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import Stripe from "stripe";

export const runtime = "nodejs";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return NextResponse.json({ error: "missing_auth" }, { status: 401 });
    }

    const idToken = authHeader.split(" ")[1];
    const decoded = await adminAuth().verifyIdToken(idToken);
    const user = await adminAuth().getUser(decoded.uid);

    if (!user.email) {
      return NextResponse.json({ error: "missing_email" }, { status: 400 });
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Use existing Stripe Payment Link
    const stripePaymentLink = "https://buy.stripe.com/test_3cI4gB6FF2rH7WWdcX2kw00";

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