import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

export const runtime = "nodejs";

// Test endpoint to send a sample notification to the current user
export async function POST(request: NextRequest) {
  try {
    console.log("=== PUSH TEST API CALLED ===");

    // Get the authorization header
    const authHeader = request.headers.get("authorization");
    console.log("Auth header present:", !!authHeader);

    if (!authHeader?.startsWith("Bearer ")) {
      console.log("No valid Bearer token found");
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    console.log("Token length:", token.length);

    // Verify the Firebase token and get admin instances
    const { adminAuth, adminDb } = await import("@/lib/firebase-admin");
    const decodedToken = await adminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    console.log("Testing push notification for user:", userId);

    // Debug VAPID keys
    console.log("VAPID Public Key length:", process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.length);
    console.log("VAPID Private Key length:", process.env.VAPID_PRIVATE_KEY?.length);
    console.log("VAPID Email:", process.env.VAPID_EMAIL);

    // Configure VAPID for web-push
    webpush.setVapidDetails(
      'mailto:' + (process.env.VAPID_EMAIL || 'nacho.vent@gmail.com'),
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    // Get user's push subscription using Firebase Admin
    console.log("Attempting to read push subscription for user:", userId);

    let subscription;

    try {
      const subscriptionDoc = await adminDb().collection("pushSubscriptions").doc(userId).get();
      console.log("Subscription document exists:", subscriptionDoc.exists);

      if (subscriptionDoc.exists) {
        subscription = subscriptionDoc.data();
        console.log("Subscription data:", subscription ? "found" : "null");
      } else {
        console.log("No subscription document found");
      }
    } catch (error) {
      console.error("Error reading subscription document:", error);
      throw error; // Re-throw to see the full error
    }

    if (!subscription?.endpoint) {
      console.log("No subscription endpoint found");
      return NextResponse.json({
        error: "no_subscription",
        message: "User has not enabled push notifications"
      }, { status: 400 });
    }

    console.log("Found subscription endpoint:", subscription.endpoint.substring(0, 50) + "...");

    // Send test notification
    const testNotification = {
      title: "🧪 Test Notification",
      body: "Push notifications are working correctly! This is a test from your Cannafriend app.",
      icon: '/web-app-manifest-192x192.png',
      badge: '/web-app-manifest-192x192.png',
      tag: `test-${Date.now()}`,
      data: {
        url: "/",
        test: true
      },
      actions: [
        { action: 'view_app', title: 'Open App' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    };

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys
      },
      JSON.stringify(testNotification)
    );

    console.log(`Test notification sent successfully to user ${userId}`);

    return NextResponse.json({
      success: true,
      message: "Test notification sent successfully!",
      notification: testNotification
    });

  } catch (error: any) {
    console.error("Test notification error:", error);

    if (error.code === "auth/id-token-expired") {
      return NextResponse.json({
        error: "token_expired",
        message: "Authentication token expired"
      }, { status: 401 });
    }

    return NextResponse.json({
      error: "internal_error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
