import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ADMIN_EMAIL, DEV_EMAIL } from "@/lib/constants";
import webpush from "web-push";

export const runtime = "nodejs";

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: number | null;
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Import Firebase Admin at runtime
    const { adminAuth } = await import("@/lib/firebase-admin");

    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Check if user is admin (for now, restrict to admin only)
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    if (!userData || userData.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // Parse notification data
    const {
      notification,
      userIds,
      sendToAll = false
    }: {
      notification: NotificationPayload;
      userIds?: string[];
      sendToAll?: boolean;
    } = await request.json();

    if (!notification?.title || !notification?.body) {
      return NextResponse.json({ error: "invalid_notification" }, { status: 400 });
    }

    // Get target subscriptions
    let targetSubscriptions: Array<PushSubscription & { userId: string }> = [];

    if (sendToAll) {
      // Get all active subscriptions
      const subscriptionsSnapshot = await getDocs(collection(db, "pushSubscriptions"));
      targetSubscriptions = subscriptionsSnapshot.docs
        .map(doc => ({ ...doc.data(), userId: doc.id }))
        .filter((sub: any) => sub.endpoint) as Array<PushSubscription & { userId: string }>;
    } else if (userIds && userIds.length > 0) {
      // Get specific user subscriptions
      for (const targetUserId of userIds) {
        const subscriptionRef = doc(db, "pushSubscriptions", targetUserId);
        const subscriptionSnap = await getDoc(subscriptionRef);
        const subscriptionData = subscriptionSnap.data();

        if (subscriptionData?.endpoint) {
          targetSubscriptions.push({
            ...subscriptionData,
            userId: targetUserId
          } as PushSubscription & { userId: string });
        }
      }
    } else {
      return NextResponse.json({ error: "no_targets_specified" }, { status: 400 });
    }

    if (targetSubscriptions.length === 0) {
      return NextResponse.json({ error: "no_active_subscriptions" }, { status: 404 });
    }

    // Configure VAPID details
    webpush.setVapidDetails(
      'mailto:' + (process.env.VAPID_EMAIL || DEV_EMAIL),
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    // Send notifications to all target subscriptions
    const results = await Promise.allSettled(
      targetSubscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: subscription.keys
            },
            JSON.stringify({
              title: notification.title,
              body: notification.body,
              icon: notification.icon || '/web-app-manifest-192x192.png',
              badge: notification.badge || '/web-app-manifest-192x192.png',
              tag: notification.tag || 'default',
              data: notification.data || {},
              actions: notification.actions || []
            })
          );
          return { success: true, userId: subscription.userId };
        } catch (error) {
          console.error(`Failed to send to user ${subscription.userId}:`, error);
          return { success: false, userId: subscription.userId, error };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${successful} of ${targetSubscriptions.length} subscribers`,
      sent: successful,
      failed: failed
    });

  } catch (error) {
    console.error("Push send error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
