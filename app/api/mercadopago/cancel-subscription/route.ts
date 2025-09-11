import { NextRequest, NextResponse } from "next/server";
import { isUserPremium } from "@/lib/auth";
import { unwrapError } from "@/lib/errors";

export const runtime = "nodejs";

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

    // Check if user is premium
    const isPremium = isUserPremium(user);
    if (!isPremium) {
      return NextResponse.json(
        { error: "not_premium", message: "User does not have an active premium subscription" },
        { status: 404 }
      );
    }

    // Check MercadoPago token
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpToken) {
      return NextResponse.json({ error: "mercadopago_not_configured" }, { status: 500 });
    }

    // Find preapproval by payer email - we need to search for active preapprovals
    // Unfortunately, MercadoPago doesn't provide a direct search by email API
    // So we'll need to store the preapproval_id when creating subscriptions
    // For now, we'll manually revoke premium status and suggest users contact support

    // Manually revoke premium status
    const claims = { ...(user.customClaims || {}) } as Record<string, unknown>;
    claims.premium = false;
    await adminAuth().setCustomUserClaims(user.uid, claims);

    return NextResponse.json({
      success: true,
      message: "Premium status revoked. For complete subscription cancellation, please contact MercadoPago support or cancel through your MercadoPago account.",
      note: "Due to MercadoPago API limitations, automatic subscription cancellation requires the preapproval ID. Your premium access has been revoked immediately.",
    });

  } catch (err: unknown) {
    return NextResponse.json(
      { error: "cancellation_failed", message: unwrapError(err) },
      { status: 500 }
    );
  }
}
