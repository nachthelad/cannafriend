import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { unwrapError } from "@/lib/errors";
import { ADMIN_EMAIL } from "@/lib/constants";

export const runtime = "nodejs";

async function setPremiumByEmail(email: string, premium: boolean) {
  try {
    const { adminAuth } = await import("@/lib/firebase-admin");
    const user = await adminAuth().getUserByEmail(email);
    const claims = { ...(user.customClaims || {}) } as Record<string, unknown>;
    claims.premium = premium;
    await adminAuth().setCustomUserClaims(user.uid, claims);
    return { ok: true as const };
  } catch (err: unknown) {
    return { ok: false as const, error: unwrapError(err, "user_update_failed") };
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { type, id } = body;

    if (!type || !id) {
      return NextResponse.json({ error: "missing_type_or_id" }, { status: 400 });
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-08-27.basil",
    });

    let result: { ok: boolean; premium?: boolean; error?: string } = { ok: false };

    try {
      if (type === "payment") {
        // Fetch charge and process
        const charge = await stripe.charges.retrieve(id);
        
        if (!charge.customer || typeof charge.customer !== 'string') {
          return NextResponse.json({ error: "no_customer_found" }, { status: 400 });
        }

        const customer = await stripe.customers.retrieve(charge.customer) as Stripe.Customer;
        if (!customer.email) {
          return NextResponse.json({ error: "no_customer_email" }, { status: 400 });
        }

        // Determine if should grant or revoke premium based on charge status
        if (charge.status === 'succeeded') {
          result = await setPremiumByEmail(customer.email, true);
          result.premium = true;
        } else if (charge.refunded || charge.status === 'failed') {
          result = await setPremiumByEmail(customer.email, false);
          result.premium = false;
        } else {
          return NextResponse.json({ 
            ok: true, 
            ignored: true, 
            reason: `charge_status_${charge.status}` 
          });
        }

      } else if (type === "subscription") {
        // Fetch subscription and process
        const subscription = await stripe.subscriptions.retrieve(id);
        
        if (!subscription.customer || typeof subscription.customer !== 'string') {
          return NextResponse.json({ error: "no_customer_found" }, { status: 400 });
        }

        const customer = await stripe.customers.retrieve(subscription.customer) as Stripe.Customer;
        if (!customer.email) {
          return NextResponse.json({ error: "no_customer_email" }, { status: 400 });
        }

        // Determine premium status based on subscription status
        const isActive = subscription.status === 'active';
        result = await setPremiumByEmail(customer.email, isActive);
        result.premium = isActive;

      } else {
        return NextResponse.json({ error: "invalid_type" }, { status: 400 });
      }

      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({ 
        ok: true, 
        premium: result.premium,
        type,
        id 
      });

    } catch (stripeError: any) {
      console.error("Stripe reprocess error:", stripeError);
      return NextResponse.json({
        error: "stripe_reprocess_failed",
        message: stripeError.message || "Failed to reprocess Stripe data"
      }, { status: 500 });
    }

  } catch (err: unknown) {
    return NextResponse.json(
      { error: "reprocess_failed", message: unwrapError(err) },
      { status: 500 }
    );
  }
}