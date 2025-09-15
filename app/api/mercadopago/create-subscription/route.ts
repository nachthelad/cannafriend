import { NextRequest, NextResponse } from "next/server";
import { isUserPremium } from "@/lib/auth";
import { unwrapError } from "@/lib/errors";

export const runtime = "nodejs";

interface MercadoPagoPreapprovalRequest {
  reason: string;
  external_reference: string;
  payer_email: string;
  card_token_id?: string;
  auto_recurring: {
    frequency: number;
    frequency_type: "months" | "days";
    transaction_amount: number;
    currency_id: string;
    start_date?: string;
    end_date?: string;
  };
  back_url?: string;
  status?: string;
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
    const user = await adminAuth().getUser(decoded.uid);

    if (!user.email && !process.env.MP_TEST_PAYER_EMAIL) {
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

    // Check MercadoPago token
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpToken) {
      return NextResponse.json({ error: "mercadopago_not_configured" }, { status: 500 });
    }

    // Create MercadoPago preapproval (subscription)
    const payerEmail = process.env.MP_TEST_PAYER_EMAIL || user.email!;

    const preapprovalData: MercadoPagoPreapprovalRequest = {
      reason: "Cannafriend Premium Subscription",
      external_reference: user.uid,
      payer_email: payerEmail,
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: Number(process.env.MP_AMOUNT || 10000),
      currency_id: process.env.MP_CURRENCY_ID || "ARS",
    },
    back_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/premium?status=completed`,
    // Do not set status explicitly; MP will manage it
  };

    const mpResponse = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mpToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preapprovalData),
    });

  if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error("MercadoPago API Error:", mpResponse.status, errorText);
      return NextResponse.json(
        { error: "mercadopago_api_error", status: mpResponse.status, details: errorText },
        { status: 500 }
      );
    }

    const mpData = await mpResponse.json();

  const checkoutUrl = mpData.init_point || mpData.sandbox_init_point;
    return NextResponse.json({
      success: true,
      subscription_id: mpData.id,
      init_point: mpData.init_point,
      sandbox_init_point: mpData.sandbox_init_point,
      checkout_url: checkoutUrl,
    });

  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: "subscription_creation_failed",
        message: unwrapError(err),
      },
      { status: 500 }
    );
  }
}
