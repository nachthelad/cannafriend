import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Import Firebase Admin at runtime
    const { adminAuth, adminDb } = await import("@/lib/firebase-admin");

    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Parse subscription data
    const subscription = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "invalid_subscription" }, { status: 400 });
    }

    // Store subscription in Firestore using Firebase Admin
    await adminDb().collection("pushSubscriptions").doc(userId).set({
      userId,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      expirationTime: subscription.expirationTime || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push subscription error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Import Firebase Admin at runtime
    const { adminAuth, adminDb } = await import("@/lib/firebase-admin");

    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Delete subscription from Firestore using Firebase Admin
    await adminDb().collection("pushSubscriptions").doc(userId).set({
      userId,
      endpoint: null,
      keys: null,
      expirationTime: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      unsubscribedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push unsubscription error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}