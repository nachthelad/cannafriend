import { NextRequest, NextResponse } from "next/server";

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

    if (!user.email) {
      return NextResponse.json({ error: "missing_email" }, { status: 400 });
    }

    // Check MercadoPago token
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpToken) {
      return NextResponse.json({ error: "mercadopago_not_configured" }, { status: 500 });
    }

    // Create MercadoPago preapproval (subscription)
    const preapprovalData: MercadoPagoPreapprovalRequest = {
      reason: "Cannafriend Premium Subscription",
      external_reference: user.uid,
      payer_email: user.email,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: 10000, // 10000 ARS
        currency_id: "ARS", // Argentine Peso
      },
      back_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/premium?status=completed`,
      status: "pending"
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
      console.error("MercadoPago API Error:", errorText);
      return NextResponse.json(
        { error: "mercadopago_api_error", details: errorText },
        { status: 500 }
      );
    }

    const mpData = await mpResponse.json();

    return NextResponse.json({
      success: true,
      subscription_id: mpData.id,
      init_point: mpData.init_point, // URL to redirect user for payment
      sandbox_init_point: mpData.sandbox_init_point, // For testing
    });

  } catch (error: any) {
    console.error("MercadoPago subscription creation error:", error);
    return NextResponse.json(
      { error: "subscription_creation_failed", message: error.message },
      { status: 500 }
    );
  }
}