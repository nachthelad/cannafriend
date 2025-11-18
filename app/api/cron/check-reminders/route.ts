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

    console.log("Checking for due reminders (alarm mode)...");

    // Import dependencies at runtime to keep bundle lean and avoid edge constraints
    const webpushModule = await import("web-push");
    const webpush = webpushModule.default ?? webpushModule;

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidEmail = process.env.VAPID_EMAIL || DEV_EMAIL;

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn("Skipping reminder cron because VAPID keys are missing");
      return NextResponse.json(
        {
          error: "missing_vapid_keys",
          message: "Push notifications are not configured on the server",
        },
        { status: 500 }
      );
    }

    // Import Firebase Admin at runtime (server-only)
    const { adminDb } = await import("@/lib/firebase-admin");
    const db = adminDb();

    // Configure VAPID for web-push
    webpush.setVapidDetails(
      "mailto:" + vapidEmail,
      vapidPublicKey,
      vapidPrivateKey
    );

    // Current time (use local server time so alarms follow the same clock stored by clients)
    const now = new Date();
    const nowString = now.toISOString();
    const currentDay = now.getDay(); // 0-6 in local time
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Get all users who might have reminders
    const usersSnapshot = await db.collection("users").get();
    const dueReminders: any[] = [];

    // Check each user's reminders subcollection
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      // Fetch active reminders; filter by day/time and clean legacy entries
      const userRemindersSnapshot = await db
        .collection("users")
        .doc(userId)
        .collection("reminders")
        .where("isActive", "==", true)
        .get();

      for (const reminderDoc of userRemindersSnapshot.docs) {
        const reminderData = reminderDoc.data();

        // Only process new alarm-style reminders; delete legacy as requested
        if (!Array.isArray(reminderData.daysOfWeek) || !reminderData.timeOfDay) {
          await reminderDoc.ref.delete();
          continue;
        }

        const [hours, minutes] = String(reminderData.timeOfDay)
          .split(":")
          .map((v) => parseInt(v, 10));

        if (Number.isNaN(hours) || Number.isNaN(minutes)) {
          continue;
        }

        const scheduledMinutes = hours * 60 + minutes;
        if (!reminderData.daysOfWeek.includes(currentDay)) {
          continue;
        }

        const lastSentDate = reminderData.lastSentDate
          ? new Date(reminderData.lastSentDate).toISOString().slice(0, 10)
          : null;
        const todayDate = nowString.slice(0, 10);

        if (lastSentDate === todayDate) {
          continue;
        }

        // Treat as due if we are at or past the scheduled time today
        if (scheduledMinutes <= currentMinutes) {
          dueReminders.push({
            id: reminderDoc.id,
            userId,
            ...reminderData,
          });
        }
      }
    }

    console.log(`Found ${dueReminders.length} due reminders`);

    if (dueReminders.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No due reminders found",
        checked: 0,
        sent: 0,
      });
    }

    let sentCount = 0;
    let errorCount = 0;

    // Process each due reminder
    for (const reminder of dueReminders) {
      try {
        // Get user's push subscription
        const subscriptionSnap = await db
          .collection("pushSubscriptions")
          .doc(reminder.userId)
          .get();
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
          icon: "/web-app-manifest-192x192.png",
          badge: "/web-app-manifest-192x192.png",
          tag: `reminder-${reminder.id}`,
          data: {
            url: reminder.plantId ? `/plants/${reminder.plantId}` : "/reminders",
            reminderId: reminder.id,
            plantId: reminder.plantId,
          },
          actions: [
            { action: "view_plant", title: "View Plant" },
            { action: "mark_done", title: "Mark Done" },
          ],
        };

        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys,
          },
          JSON.stringify(notificationPayload)
        );

        sentCount++;
        console.log(
          `Sent notification for reminder ${reminder.id} to user ${reminder.userId}`
        );

        await db
          .collection("users")
          .doc(reminder.userId)
          .collection("reminders")
          .doc(reminder.id)
          .update({
            lastSentDate: nowString.slice(0, 10),
            updatedAt: nowString,
          });
      } catch (error: any) {
        console.error(`Error processing reminder ${reminder.id}:`, error);

        // Clean up expired/invalid subscriptions so users can resubscribe
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          try {
            await db.collection("pushSubscriptions").doc(reminder.userId).delete();
            console.log(
              `Removed invalid push subscription for user ${reminder.userId}`
            );
          } catch (cleanupError) {
            console.error("Failed to clean up invalid subscription", cleanupError);
          }
        }

        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${dueReminders.length} reminders`,
      checked: dueReminders.length,
      sent: sentCount,
      errors: errorCount,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      {
        error: "internal_error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return runReminderCron(request);
}

export async function GET(request: NextRequest) {
  return runReminderCron(request);
}

function getNotificationTitle(reminder: any): string {
  if (reminder.label) return reminder.label;
  if (reminder.title) return reminder.title;
  if (reminder.plantName) return `${reminder.plantName} reminder`;
  return "Reminder";
}

function getNotificationBody(reminder: any): string {
  if (reminder.note) return reminder.note;
  if (reminder.description) return reminder.description;
  if (reminder.plantName) return `Reminder for ${reminder.plantName}.`;
  return "Don't forget your scheduled task.";
}
