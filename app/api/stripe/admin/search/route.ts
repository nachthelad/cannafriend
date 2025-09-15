import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { unwrapError } from "@/lib/errors";
import { ADMIN_EMAIL } from "@/lib/constants";

export const runtime = "nodejs";

type StripeItem = {
  type: "payment" | "subscription";
  id: string;
  status?: string;
  customer_email?: string;
  amount?: number;
  currency?: string;
  date?: string;
  customer_id?: string;
};

export async function GET(req: NextRequest) {
  try {
    // Import Firebase Admin at runtime
    const { adminAuth } = await import("@/lib/firebase-admin");

    // Verify authentication
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return NextResponse.json({ error: "missing_auth" }, { status: 401 });
    }

    const idToken = authHeader.split(" ")[1];
    const decoded = await adminAuth().verifyIdToken(idToken);
    const adminUser = await adminAuth().getUser(decoded.uid);

    // Verify admin access
    if (adminUser.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-08-27.basil",
    });

    const searchParams = req.nextUrl.searchParams;
    const email = searchParams.get("email");
    const scope = searchParams.get("scope") || "all"; // all, payments, subscriptions

    if (!email) {
      return NextResponse.json({ error: "email_required" }, { status: 400 });
    }

    const items: StripeItem[] = [];

    try {
      // Search customers by email
      const customers = await stripe.customers.search({
        query: `email:"${email}"`,
        limit: 10,
      });

      for (const customer of customers.data) {
        if (!customer.email) continue;

        // Search payments/charges for this customer
        if (scope === "all" || scope === "payments") {
          const charges = await stripe.charges.search({
            query: `customer:"${customer.id}"`,
            limit: 20,
          });

          for (const charge of charges.data) {
            items.push({
              type: "payment",
              id: charge.id,
              status: charge.status,
              customer_email: customer.email,
              customer_id: customer.id,
              amount: charge.amount,
              currency: charge.currency,
              date: new Date(charge.created * 1000).toISOString(),
            });
          }
        }

        // Search subscriptions for this customer
        if (scope === "all" || scope === "subscriptions") {
          const subscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            limit: 20,
          });

          for (const subscription of subscriptions.data) {
            items.push({
              type: "subscription",
              id: subscription.id,
              status: subscription.status,
              customer_email: customer.email,
              customer_id: customer.id,
              amount: subscription.items.data[0]?.price?.unit_amount || 0,
              currency: subscription.items.data[0]?.price?.currency || "usd",
              date: new Date(subscription.created * 1000).toISOString(),
            });
          }
        }
      }
    } catch (stripeError: any) {
      console.error("Stripe search error:", stripeError);
      return NextResponse.json({
        error: "stripe_search_failed",
        message: stripeError.message || "Failed to search Stripe data"
      }, { status: 500 });
    }

    // Sort by date (newest first)
    items.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

    return NextResponse.json({
      items,
      total: items.length,
      email,
      scope,
    });

  } catch (err: unknown) {
    return NextResponse.json(
      { error: "search_failed", message: unwrapError(err) },
      { status: 500 }
    );
  }
}