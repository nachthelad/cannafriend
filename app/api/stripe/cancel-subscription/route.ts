import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-08-27.basil",
    });

    // Import Firebase Admin at runtime
    const { adminAuth } = await import("@/lib/firebase-admin");

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

    // Check if user is premium
    const isPremium = Boolean((user.customClaims as any)?.premium);
    if (!isPremium) {
      return NextResponse.json(
        { error: "not_premium", message: "User does not have an active premium subscription" },
        { status: 404 }
      );
    }

    // Find customer by email
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json(
        { error: "customer_not_found", message: "No Stripe customer found for this email" },
        { status: 404 }
      );
    }

    const customer = customers.data[0];

    // Get active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json(
        { error: "no_active_subscription", message: "No active subscription found" },
        { status: 404 }
      );
    }

    // Cancel all active subscriptions (usually there should be only one)
    const cancelledSubscriptions = [];
    for (const subscription of subscriptions.data) {
      const cancelled = await stripe.subscriptions.cancel(subscription.id);
      cancelledSubscriptions.push(cancelled.id);
    }

    return NextResponse.json({
      success: true,
      cancelled_subscriptions: cancelledSubscriptions,
      message: "Subscription cancelled successfully",
    });

  } catch (error: any) {
    console.error("Stripe cancellation error:", error);
    return NextResponse.json(
      { error: "cancellation_failed", message: error.message },
      { status: 500 }
    );
  }
}