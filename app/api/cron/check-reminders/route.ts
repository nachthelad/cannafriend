import { NextRequest, NextResponse } from "next/server";
import { DEV_EMAIL } from "@/lib/constants";

export const runtime = "nodejs";

// This endpoint can be triggered by Vercel Cron Jobs (paid plans) or manually.
// To enable the scheduled job, add to vercel.json: { "crons": [{ "path": "/api/cron/check-reminders?secret=<value>", "schedule": "0 * * * *" }] }

async function runReminderCron(request: NextRequest) {
  try {
    // Verify this is called by Vercel Cron (optional security check)
    const authHeader = request.headers.get("authorization");
    const headerSecret = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;
    const querySecret = request.nextUrl.searchParams.get("secret");
    const providedSecret = headerSecret ?? querySecret ?? undefined;

    if (!providedSecret || providedSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    console.log("Checking for overdue reminders...");

    // Import dependencies at runtime to keep bundle lean and avoid edge constraints
    const webpushModule = await import("web-push");
    const webpush = webpushModule.default ?? webpushModule;

    // Import Firebase Admin at runtime (server-only)
    const { adminDb } = await import("@/lib/firebase-admin");
    const db = adminDb();

    // Configure VAPID for web-push
    webpush.setVapidDetails(
      'mailto:' + (process.env.VAPID_EMAIL || DEV_EMAIL),
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    // Get current time
    const now = new Date();
    const nowString = now.toISOString();

    // Get all users who might have reminders
    const usersSnapshot = await db.collection("users").get();
    const overdueReminders: any[] = [];

    // Check each user's reminders subcollection
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      const userRemindersSnapshot = await db
        .collection("users")
        .doc(userId)
        .collection("reminders")
        .where("isActive", "==", true)
        .where("nextReminder", "<=", nowString)
        .get();

      for (const reminderDoc of userRemindersSnapshot.docs) {
        overdueReminders.push({
          id: reminderDoc.id,
          userId: userId, // Add userId to the reminder data
          ...reminderDoc.data()
        });
      }
    }

    console.log(`Found ${overdueReminders.length} overdue reminders`);

    if (overdueReminders.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No overdue reminders found",
        checked: 0,
        sent: 0
      });
    }

    let sentCount = 0;
    let errorCount = 0;

    // Process each overdue reminder
    for (const reminder of overdueReminders) {
      try {
        // Get user's push subscription
        const subscriptionSnap = await db.collection("pushSubscriptions").doc(reminder.userId).get();
        const subscription = subscriptionSnap.data();

        if (!subscription?.endpoint) {
          console.warn(
            `Missing push subscription for reminder ${reminder.id} (user ${reminder.userId}); skipping notification.`
          );
          errorCount++;
          continue;
        }

        // Send push notification
        const notificationPayload = {
          title: getNotificationTitle(reminder),
          body: getNotificationBody(reminder),
          icon: '/web-app-manifest-192x192.png',
          badge: '/web-app-manifest-192x192.png',
          tag: `reminder-${reminder.id}`,
          data: {
            url: `/plants/${reminder.plantId}`,
            reminderId: reminder.id,
            plantId: reminder.plantId
          },
          actions: [
            { action: 'view_plant', title: 'View Plant' },
            { action: 'mark_done', title: 'Mark Done' }
          ]
        };

        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys
          },
          JSON.stringify(notificationPayload)
        );

        sentCount++;
        console.log(`Sent notification for reminder ${reminder.id} to user ${reminder.userId}`);

        // Update reminder with next occurrence
        const nextReminderDate = new Date(reminder.nextReminder);
        nextReminderDate.setDate(nextReminderDate.getDate() + reminder.interval);

        await db
          .collection("users")
          .doc(reminder.userId)
          .collection("reminders")
          .doc(reminder.id)
          .update({
            lastReminder: nowString,
            nextReminder: nextReminderDate.toISOString()
          });

      } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${overdueReminders.length} overdue reminders`,
      checked: overdueReminders.length,
      sent: sentCount,
      errors: errorCount
    });

  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json({
      error: "internal_error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return runReminderCron(request);
}

export async function GET(request: NextRequest) {
  return runReminderCron(request);
}

function getNotificationTitle(reminder: any): string {
  if (reminder.title) {
    return reminder.title;
  }

  // Generate title based on reminder type
  switch (reminder.type) {
    case 'watering':
      return `💧 ${reminder.plantName} needs watering`;
    case 'feeding':
      return `🌱 ${reminder.plantName} needs fertilizer`;
    case 'training':
      return `✂️ ${reminder.plantName} needs training`;
    default:
      return `🔔 ${reminder.plantName} reminder`;
  }
}

function getNotificationBody(reminder: any): string {
  if (reminder.description) {
    return reminder.description;
  }

  // Generate body based on reminder type
  switch (reminder.type) {
    case 'watering':
      return `Your plant is ready for its next watering session.`;
    case 'feeding':
      return `Time to give your plant some nutrients!`;
    case 'training':
      return `Your plant might need some pruning or training.`;
    default:
      return `Don't forget to take care of your plant.`;
  }
}
