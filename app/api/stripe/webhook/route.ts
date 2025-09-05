import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

async function setPremiumByEmail(email: string, premium: boolean) {
  try {
    const { adminAuth } = await import("@/lib/firebase-admin");
    const user = await adminAuth().getUserByEmail(email);
    const claims = { ...(user.customClaims || {}) } as Record<string, unknown>;
    claims.premium = premium;
    await adminAuth().setCustomUserClaims(user.uid, claims);
    return { ok: true as const };
  } catch (e: any) {
    return { ok: false as const, error: e?.message || "user_update_failed" };
  }
}

// GET endpoint for testing webhook is alive
export async function GET() {
  return NextResponse.json({ 
    status: "Stripe webhook endpoint is active",
    timestamp: new Date().toISOString(),
    methods: ["POST"]
  });
}

export async function POST(req: NextRequest) {
  try {
    // Initialize Stripe (runtime only)
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-08-27.basil",
    });
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    const body = await req.text();
    const signature = req.headers.get("stripe-signature")!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed:`, err.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session completed:', session.id);
        
        if (session.customer_email) {
          const result = await setPremiumByEmail(session.customer_email, true);
          if (!result.ok) {
            console.error('Failed to set premium status:', result.error);
          }
        }
        break;
      }
      
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription created:', subscription.id);
        
        if (subscription.customer && typeof subscription.customer === 'string') {
          const customer = await stripe.customers.retrieve(subscription.customer) as Stripe.Customer;
          if (customer.email) {
            const result = await setPremiumByEmail(customer.email, true);
            if (!result.ok) {
              console.error('Failed to set premium status:', result.error);
            }
          }
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const isActive = subscription.status === 'active';
        
        if (subscription.customer && typeof subscription.customer === 'string') {
          const customer = await stripe.customers.retrieve(subscription.customer) as Stripe.Customer;
          if (customer.email) {
            const result = await setPremiumByEmail(customer.email, isActive);
            if (!result.ok) {
              console.error('Failed to update premium status:', result.error);
            }
          }
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        if (subscription.customer && typeof subscription.customer === 'string') {
          const customer = await stripe.customers.retrieve(subscription.customer) as Stripe.Customer;
          if (customer.email) {
            const result = await setPremiumByEmail(customer.email, false);
            if (!result.ok) {
              console.error('Failed to revoke premium status:', result.error);
            }
          }
        }
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.customer && typeof invoice.customer === 'string') {
          const customer = await stripe.customers.retrieve(invoice.customer) as Stripe.Customer;
          if (customer.email) {
            // Optionally revoke premium on payment failure
            // const result = await setPremiumByEmail(customer.email, false);
            console.log('Payment failed for customer:', customer.email);
          }
        }
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    console.log(`✅ Webhook processed successfully: ${event.type}`);
    return NextResponse.json({ received: true, processed: event.type });
  } catch (error: any) {
    console.error('❌ Stripe webhook error:', error);
    return NextResponse.json(
      { error: "webhook_error", message: error.message },
      { status: 500 }
    );
  }
}